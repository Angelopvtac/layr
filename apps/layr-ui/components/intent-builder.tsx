'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Intent } from '@layr/core'

interface IntentBuilderProps {
  onComplete: (intent: Intent) => void
}

export function IntentBuilder({ onComplete }: IntentBuilderProps) {
  const [step, setStep] = useState(1)
  const { register, handleSubmit, watch, setValue } = useForm<Intent>()

  const capabilities = watch('capabilities') || []

  const onSubmit = (data: Intent) => {
    onComplete(data)
  }

  const toggleCapability = (capability: string) => {
    const current = capabilities
    if (current.includes(capability)) {
      setValue('capabilities', current.filter((c: string) => c !== capability))
    } else {
      setValue('capabilities', [...current, capability])
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to build?
            </label>
            <textarea
              {...register('goal', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="I want to build a subscription service for project management..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who is your target audience?
            </label>
            <select
              {...register('audience')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="business">Business</option>
              <option value="consumer">Consumer</option>
              <option value="internal">Internal Team</option>
              <option value="developer">Developers</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Next: Choose Features
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What features do you need?
            </label>
            <div className="space-y-2">
              {[
                { id: 'auth', label: '🔐 User Authentication' },
                { id: 'crud', label: '💾 Database & CRUD' },
                { id: 'payments', label: '💳 Payment Processing' },
                { id: 'email', label: '📧 Email Notifications' },
                { id: 'files', label: '📁 File Uploads' },
                { id: 'realtime', label: '⚡ Real-time Updates' },
                { id: 'search', label: '🔍 Search' },
                { id: 'analytics', label: '📊 Analytics' },
              ].map(feature => (
                <label key={feature.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={capabilities.includes(feature.id)}
                    onChange={() => toggleCapability(feature.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span>{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {capabilities.includes('auth') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authentication Type
              </label>
              <select
                {...register('auth')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="magic_link">Magic Link</option>
                <option value="email_password">Email & Password</option>
                <option value="oauth">Social Login (Google, GitHub)</option>
              </select>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
            >
              Generate App
            </button>
          </div>
        </div>
      )}
    </form>
  )
}