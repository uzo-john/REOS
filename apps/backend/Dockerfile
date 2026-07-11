# ─── Multi-Stage Monorepo Builder ───
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install openssl for Prisma compatibility on Alpine Linux
RUN apk add --no-cache openssl

# Copy root workspace package lists
COPY package*.json ./
COPY tsconfig*.json ./

# Copy internal shared packages
COPY packages/ ./packages/

# Copy backend files
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/prisma/ ./apps/backend/prisma/

# Install all monorepo dependencies (including devDependencies)
RUN npm ci --legacy-peer-deps

# Build internal shared packages first
RUN npm run build --workspace=@reos/types
RUN npm run build --workspace=@reos/validation
RUN npm run build --workspace=@reos/engineering

# Copy backend code
COPY apps/backend/src/ ./apps/backend/src/

# Generate Prisma Client & Build the application
RUN npm run prisma:generate --workspace=apps/backend
RUN npm run build --workspace=apps/backend

# Prune devDependencies to make node_modules production-only
RUN npm prune --production --legacy-peer-deps

# ─── Production Runner ───
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Copy package descriptors (needed for runtime workspace linking)
COPY package*.json ./
# Copy compiled internal shared packages from builder stage
COPY --from=builder /usr/src/app/packages ./packages
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/prisma/ ./apps/backend/prisma/

# Copy compiled production node_modules and dist folder from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist

EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

CMD ["node", "apps/backend/dist/main"]
