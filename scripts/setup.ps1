# PowerShell setup script for Windows

Write-Host "🚀 Setting up Layr development environment..." -ForegroundColor Cyan

# Check for required tools
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js is required but not installed. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

$pnpmVersion = pnpm -v 2>$null
if (-not $pnpmVersion) {
    Write-Host "❌ pnpm is required but not installed. Run: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

# Check Node version
$version = [version]($nodeVersion -replace 'v', '')
if ($version.Major -lt 18) {
    Write-Host "❌ Node.js 18+ is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites checked" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pnpm install

# Build packages
Write-Host "🔨 Building packages..." -ForegroundColor Yellow
pnpm build

# Create .env.local if it doesn't exist
if (-not (Test-Path .env.local)) {
    Write-Host "📝 Creating .env.local from template..." -ForegroundColor Yellow
    Copy-Item .env.example .env.local
    Write-Host "⚠️  Please edit .env.local with your API keys" -ForegroundColor Yellow
}

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
pnpm test

Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env.local with your API keys"
Write-Host "2. Run 'pnpm dev' to start the development server"
Write-Host "3. Visit http://localhost:3000 to use the UI"
Write-Host "4. Or use the CLI: pnpm --filter @layr/cli run examples/subscription-projects.json"