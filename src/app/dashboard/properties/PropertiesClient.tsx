'use client'

import { useState } from 'react'
import { Building2, MapPin, Plus, X, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/hooks/useTranslation'

type Property = {
  id: string
  name: string
  neighborhood: string
  status: string
  type: string
  units: any[]
  _count: { maintenanceRequests: number }
}

export default function PropertiesClient({ initialProperties }: { initialProperties: Property[] }) {
  const { t } = useTranslation()
  const [properties, setProperties] = useState<Property[]>(initialProperties)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    neighborhood: '',
    type: 'residential' as 'residential' | 'commercial' | 'mixed',
    status: 'active' as 'active' | 'inactive'
  })

  const handleAdd = () => {
    setEditingProperty(null)
    setFormData({ name: '', neighborhood: '', type: 'residential', status: 'active' })
    setShowDialog(true)
  }

  const handleEdit = (property: Property) => {
    setEditingProperty(property)
    setFormData({
      name: property.name,
      neighborhood: property.neighborhood,
      type: property.type as any,
      status: property.status as any
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingProperty) {
        const res = await fetch(`/api/properties/${editingProperty.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to update')
        const updated = await res.json()
        setProperties(props => props.map(p => p.id === updated.id ? { ...p, ...updated } : p))
      } else {
        const res = await fetch('/api/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to create')
        const newProperty = await res.json()
        setProperties(props => [{ ...newProperty, units: [], _count: { maintenanceRequests: 0 } }, ...props])
      }
      setShowDialog(false)
    } catch (error) {
      console.error('Error saving property:', error)
      alert(t('messages.error'))
    }
  }

  const handleDelete = (property: Property) => {
    setDeletingProperty(property)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingProperty) return

    try {
      const res = await fetch(`/api/properties/${deletingProperty.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete')
      }
      setProperties(props => props.filter(p => p.id !== deletingProperty.id))
      setShowDeleteDialog(false)
      setDeletingProperty(null)
    } catch (error: any) {
      console.error('Error deleting property:', error)
      alert(error.message || t('messages.error'))
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('properties.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('properties.subtitle')} ({properties.length} {t('properties.title')})
            </p>
          </div>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            {t('properties.newProperty')}
          </Button>
        </div>

        {properties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {t('properties.noProperties')}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('properties.subtitle')}
              </p>
              <Button className="mt-4 gap-2" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                {t('properties.newProperty')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {property.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{property.neighborhood}</span>
                      </div>
                    </div>
                    <Badge
                      variant={property.status === 'active' ? 'success' : 'secondary'}
                    >
                      {property.status === 'active' ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {property.units.length}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('units.title')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {property._count.maintenanceRequests}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('maintenance.title')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {property.type === 'residential' ? t('properties.propertyType.residential') :
                          property.type === 'commercial' ? t('properties.propertyType.commercial') : 
                          t('properties.propertyType.mixed')}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('properties.type')}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(property)}>
                      {t('common.edit')}
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDelete(property)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  {editingProperty ? t('properties.editProperty') : t('properties.addProperty')}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('properties.propertyName')}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('properties.neighborhood')}</label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('properties.type')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="residential">{t('properties.propertyType.residential')}</option>
                    <option value="commercial">{t('properties.propertyType.commercial')}</option>
                    <option value="mixed">{t('properties.propertyType.mixed')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('common.status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="active">{t('common.active')}</option>
                    <option value="inactive">{t('common.inactive')}</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingProperty ? t('common.edit') : t('common.add')}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showDeleteDialog && deletingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-destructive">{t('messages.deleteConfirm')}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('properties.deleteConfirm')} <strong>{deletingProperty.name}</strong>?
              </p>
              {(deletingProperty.units.length > 0 || deletingProperty._count.maintenanceRequests > 0) && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
                  <p className="text-sm text-destructive font-semibold">{t('messages.deleteWarning')}</p>
                  <p className="text-xs text-destructive/80">
                    {t('properties.deleteWarning')}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={confirmDelete}>
                  {t('common.yes')}, {t('common.delete')}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
