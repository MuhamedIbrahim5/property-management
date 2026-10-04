import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'
import { buildAppUrl } from '@/lib/url'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: params.id },
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    const requestUrl = buildAppUrl(`/request?unitId=${unit.id}`)

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(requestUrl, {
      width: 300,
      margin: 2,
    })

    return NextResponse.json({
      url: requestUrl,
      qrCode: qrCodeDataUrl,
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
