import type { Intent } from '@layr/core'

interface IntentPreviewProps {
  intent: Intent
}

export function IntentPreview({ intent }: IntentPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-gray-600 mb-2">Goal</h3>
        <p className="text-gray-900">{intent.goal}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-gray-600 mb-2">Target Audience</h3>
        <p className="text-gray-900 capitalize">{intent.audience || 'Not specified'}</p>
      </div>

      {intent.capabilities && intent.capabilities.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-gray-600 mb-2">Features</h3>
          <div className="flex flex-wrap gap-2">
            {intent.capabilities.map(cap => (
              <span
                key={cap}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      )}

      {intent.auth && intent.auth !== 'none' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-gray-600 mb-2">Authentication</h3>
          <p className="text-gray-900">{intent.auth.replace('_', ' ')}</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-gray-600 mb-2">JSON Schema</h3>
        <pre className="text-xs text-gray-700 overflow-auto">
          {JSON.stringify(intent, null, 2)}
        </pre>
      </div>
    </div>
  )
}