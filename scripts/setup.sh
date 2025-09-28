#!/bin/bash

echo "🚀 Setting up Layr development environment..."

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js 18+"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Run: npm install -g pnpm"; exit 1; }

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites checked"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build packages
echo "🔨 Building packages..."
pnpm build

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your API keys"
fi

# Run tests
echo "🧪 Running tests..."
pnpm test

echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your API keys"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Visit http://localhost:3000 to use the UI"
echo "4. Or use the CLI: pnpm --filter @layr/cli run examples/subscription-projects.json"