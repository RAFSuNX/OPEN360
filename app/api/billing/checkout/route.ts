import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { db } from '@/lib/db'

const FAKE_CHECKOUT_URL = 'https://buy.stripe.com/REPLACE_WITH_REAL_STRIPE_LINK'

export async function POST() {
  const auth = await getAdminSession()
  if (!auth.ok) return auth.response
  const { orgId, email } = auth

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, slug: true, stripeCustomerId: true, name: true },
  })
  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })
  if (org.plan === 'EXTENDED') return NextResponse.json({ error: 'Already on Extended Plan' }, { status: 400 })

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  // If Stripe keys are configured, create a real checkout session
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID) {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Get or create Stripe customer
    let customerId = org.stripeCustomerId ?? undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: org.name,
        metadata: { orgId, orgSlug: org.slug },
      })
      customerId = customer.id
      await db.organization.update({
        where: { id: orgId },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${appUrl}/org/${org.slug}/admin/settings?upgraded=1`,
      cancel_url: `${appUrl}/org/${org.slug}/admin/settings`,
      metadata: { orgId },
    })

    return NextResponse.json({ url: session.url })
  }

  // No Stripe keys — return fake URL for now
  return NextResponse.json({ url: FAKE_CHECKOUT_URL })
}
