FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable
RUN corepack prepare pnpm@8.14.0 --activate

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/
COPY blueprints/*/package.json ./blueprints/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/
COPY --from=deps /app/apps/*/node_modules ./apps/

# Copy source code
COPY . .

# Build all packages
RUN pnpm build

# Production image for layr-ui
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/layr-ui/public ./apps/layr-ui/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/layr-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/layr-ui/.next/static ./apps/layr-ui/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "apps/layr-ui/server.js"]