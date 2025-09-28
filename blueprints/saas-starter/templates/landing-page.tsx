import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-16 pb-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              {{APP_HEADLINE}}
            </h1>
            <p className="mb-8 text-xl text-gray-600">
              {{APP_SUBHEADLINE}}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href="#pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Features</h2>
            <p className="mb-12 text-lg text-gray-600">
              Everything you need to {{APP_VALUE_PROP}}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {{#FEATURES}}
            <div className="rounded-lg border bg-white p-6">
              <h3 className="mb-2 text-xl font-semibold">{{FEATURE_NAME}}</h3>
              <p className="text-gray-600">{{FEATURE_DESCRIPTION}}</p>
            </div>
            {{/FEATURES}}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Simple, Transparent Pricing</h2>
            <p className="mb-12 text-lg text-gray-600">
              Choose the perfect plan for your needs
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {{#PRICING_TIERS}}
            <div className="rounded-lg border bg-white p-8">
              <h3 className="mb-2 text-2xl font-bold">{{TIER_NAME}}</h3>
              <p className="mb-4 text-4xl font-bold">
                ${{TIER_PRICE}}
                {{#IF_RECURRING}}
                <span className="text-base font-normal text-gray-600">/month</span>
                {{/IF_RECURRING}}
              </p>
              <ul className="mb-8 space-y-2">
                {{#TIER_FEATURES}}
                <li className="flex items-center">
                  <svg className="mr-2 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {{FEATURE}}
                </li>
                {{/TIER_FEATURES}}
              </ul>
              <Link href="/sign-up" className="w-full">
                <Button className="w-full" variant="{{TIER_VARIANT}}">
                  {{TIER_CTA}}
                </Button>
              </Link>
            </div>
            {{/PRICING_TIERS}}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
          <p className="mb-8 text-lg text-gray-600">
            Join thousands of satisfied customers using {{APP_NAME}}
          </p>
          <Link href="/sign-up">
            <Button size="lg">Start Your Free Trial</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-600">
              © 2024 {{APP_NAME}}. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}