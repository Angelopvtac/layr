interface DeploymentStatusProps {
  isDeploying: boolean
  deploymentUrl: string | null
  onDeploy: () => void
}

export function DeploymentStatus({ isDeploying, deploymentUrl, onDeploy }: DeploymentStatusProps) {
  if (deploymentUrl) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-semibold">Deployment Successful!</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-2">Your app is live at:</p>
          <a
            href={deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline break-all"
          >
            {deploymentUrl}
          </a>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700">Next Steps:</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Visit your app and test the functionality</li>
            <li>Configure environment variables if needed</li>
            <li>Connect your custom domain</li>
            <li>Set up monitoring and analytics</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isDeploying ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-800">Deploying your application...</span>
            </div>
          </div>

          <div className="space-y-2">
            <DeploymentStep status="complete" label="Initializing project" />
            <DeploymentStep status="active" label="Provisioning backends" />
            <DeploymentStep status="pending" label="Configuring environment" />
            <DeploymentStep status="pending" label="Building application" />
            <DeploymentStep status="pending" label="Deploying to production" />
            <DeploymentStep status="pending" label="Running smoke tests" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">
            Ready to deploy your app? This will:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Provision necessary backend services</li>
            <li>Configure authentication and database</li>
            <li>Set up payment processing (if needed)</li>
            <li>Deploy to Vercel with a preview URL</li>
            <li>Run automated tests to verify everything works</li>
          </ul>

          <button
            onClick={onDeploy}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition font-semibold"
          >
            Deploy to Production
          </button>

          <p className="text-xs text-gray-500 text-center">
            Deployment typically takes 2-3 minutes
          </p>
        </div>
      )}
    </div>
  )
}

function DeploymentStep({ status, label }: { status: 'pending' | 'active' | 'complete', label: string }) {
  return (
    <div className="flex items-center space-x-3">
      {status === 'complete' && (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
      {status === 'active' && (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      )}
      {status === 'pending' && (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
      )}
      <span className={`text-sm ${
        status === 'complete' ? 'text-green-700' :
        status === 'active' ? 'text-blue-700' :
        'text-gray-500'
      }`}>
        {label}
      </span>
    </div>
  )
}