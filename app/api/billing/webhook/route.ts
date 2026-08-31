import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Stripe sends raw body — disable Next.js body parsing
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: import('stripe').Stripe.Event

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as import('stripe').Stripe.Checkout.Session
    const orgId = session.metadata?.orgId
    if (orgId) {
      await db.organization.update({
        where: { id: orgId },
        data: { plan: 'EXTENDED', stripeCustomerId: session.customer as string },
      })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as import('stripe').Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    await db.organization.updateMany({
      where: { stripeCustomerId: customerId },
      data: { plan: 'FREE' },
    })
  }

  return NextResponse.json({ received: true })
}
