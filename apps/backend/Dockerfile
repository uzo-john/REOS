# ─── Multi-Stage Monorepo Builder ───
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy root workspace package lists
COPY package*.json ./
COPY tsconfig*.json ./

# Copy internal shared packages
COPY packages/ ./packages/

# Copy backend files
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/prisma/ ./apps/backend/prisma/

# Install all monorepo dependencies
RUN npm ci --legacy-peer-deps

# Copy backend code
COPY apps/backend/src/ ./apps/backend/src/

# Generate Prisma Client & Build
RUN ./node_modules/.bin/prisma generate --schema=apps/backend/prisma/schema.prisma
RUN npm run build --workspace=apps/backend

# ─── Production Runner ───
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ ./packages/
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/prisma/ ./apps/backend/prisma/

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps
RUN ./node_modules/.bin/prisma generate --schema=apps/backend/prisma/schema.prisma

# Copy compiled resources from builder stage
COPY --from=builder /usr/src/app/apps/backend/dist ./apps/backend/dist

EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

CMD ["node", "apps/backend/dist/main"]
