'use client'

import { useState } from 'react'
import { IntentBuilder } from '@/components/intent-builder'
import { IntentPreview } from '@/components/intent-preview'
import { BlueprintSelector } from '@/components/blueprint-selector'
import { DeploymentStatus } from '@/components/deployment-status'
import type { Intent } from '@layr/core'

export default function Home() {
  const [intent, setIntent] = useState<Intent | null>(null)
  const [selectedBlueprint, setSelectedBlueprint] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null)

  const handleIntentComplete = (newIntent: Intent) => {
    setIntent(newIntent)
    // Auto-select blueprint based on intent
    const blueprint = selectBlueprintForIntent(newIntent)
    setSelectedBlueprint(blueprint)
  }

  const handleDeploy = async () => {
    if (!intent || !selectedBlueprint) return

    setIsDeploying(true)
    try {
      // In production, this would call the actual deployment API
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, blueprint: selectedBlueprint }),
      })

      const result = await response.json()
      if (result.success) {
        setDeploymentUrl(result.url)
      }
    } catch (error) {
      console.error('Deployment failed:', error)
    } finally {
      setIsDeploying(false)
    }
  }

  const selectBlueprintForIntent = (intent: Intent): string => {
    const caps = intent.capabilities || []
    if (caps.includes('payments')) return 'saas-starter'
    if (caps.includes('auth') && caps.includes('crud')) return 'community-mini'
    if (caps.includes('crud') && !caps.includes('auth')) return 'form-to-db'
    return 'static-landing'
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Build Your App with Natural Language
        </h1>
        <p className="text-xl text-gray-600">
          Describe what you want, and Layr will create it for you
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Describe Your App</h2>
            <IntentBuilder onComplete={handleIntentComplete} />
          </div>

          {intent && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Choose Blueprint</h2>
              <BlueprintSelector
                intent={intent}
                selected={selectedBlueprint}
                onSelect={setSelectedBlueprint}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {intent && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Intent Preview</h2>
              <IntentPreview intent={intent} />
            </div>
          )}

          {selectedBlueprint && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Deployment</h2>
              <DeploymentStatus
                isDeploying={isDeploying}
                deploymentUrl={deploymentUrl}
                onDeploy={handleDeploy}
              />
            </div>
          )}
        </div>
      </div>

      {!intent && (
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 border-2 border-gray-100">
            <h3 className="text-lg font-semibold mb-2">📱 SaaS Starter</h3>
            <p className="text-gray-600">
              Full-featured SaaS with payments, auth, and admin dashboard
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border-2 border-gray-100">
            <h3 className="text-lg font-semibold mb-2">👥 Community Platform</h3>
            <p className="text-gray-600">
              Social platform with posts, comments, and user profiles
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 border-2 border-gray-100">
            <h3 className="text-lg font-semibold mb-2">🛒 Marketplace</h3>
            <p className="text-gray-600">
              Two-sided marketplace with listings and transactions
            </p>
          </div>
        </div>
      )}
    </main>
  )
}