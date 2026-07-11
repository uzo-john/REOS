# Base image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy configuration files
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Install dependencies (monorepo root workspace compatibility)
RUN npm ci

# Copy sources
COPY src ./src/

# Generate Prisma Client & compile NestJS application
RUN npx prisma generate
RUN npm run build

# ─── Production Runner ───
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps
RUN npx prisma generate

# Copy built resources from builder stage
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
