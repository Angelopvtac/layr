import type { Intent } from '@layr/core'

interface BlueprintSelectorProps {
  intent: Intent
  selected: string | null
  onSelect: (blueprint: string) => void
}

const blueprints = [
  {
    id: 'saas-starter',
    name: 'SaaS Starter',
    description: 'Complete SaaS with payments, auth, and dashboard',
    capabilities: ['auth', 'crud', 'payments', 'email', 'analytics'],
    icon: '🚀',
  },
  {
    id: 'form-to-db',
    name: 'Form to Database',
    description: 'Simple form that saves to database',
    capabilities: ['crud', 'email'],
    icon: '📝',
  },
  {
    id: 'community-mini',
    name: 'Community Platform',
    description: 'Social platform with posts and comments',
    capabilities: ['auth', 'crud', 'search'],
    icon: '👥',
  },
  {
    id: 'marketplace-lite',
    name: 'Marketplace',
    description: 'Two-sided marketplace with transactions',
    capabilities: ['auth', 'crud', 'payments', 'search', 'files'],
    icon: '🛒',
  },
  {
    id: 'static-landing',
    name: 'Landing Page',
    description: 'Marketing page with waitlist',
    capabilities: ['email'],
    icon: '🌐',
  },
]

export function BlueprintSelector({ intent, selected, onSelect }: BlueprintSelectorProps) {
  const intentCaps = new Set(intent.capabilities || [])

  const scoredBlueprints = blueprints.map(bp => {
    const bpCaps = new Set(bp.capabilities)
    const intersection = new Set([...intentCaps].filter(x => bpCaps.has(x)))
    const union = new Set([...intentCaps, ...bpCaps])
    const score = intersection.size / union.size
    return { ...bp, score }
  }).sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-3">
      {scoredBlueprints.map(blueprint => (
        <div
          key={blueprint.id}
          onClick={() => onSelect(blueprint.id)}
          className={`cursor-pointer border-2 rounded-lg p-4 transition ${
            selected === blueprint.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{blueprint.icon}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{blueprint.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{blueprint.description}</p>
              {blueprint.score > 0 && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Match:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${blueprint.score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-700">
                      {Math.round(blueprint.score * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}