import { Metadata } from 'next'
import TrackingClient from './TrackingClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'تتبع البلاغ | Track Request',
  description: 'تتبع حالة بلاغ الصيانة | Track your maintenance request status',
}

export default function TrackingPage({ params }: { params: { code: string } }) {
  return <TrackingClient trackingCode={params.code} />
}
