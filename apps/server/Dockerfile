# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package dependency descriptors
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig*.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/server/ ./apps/server/

# Build shared library and server
RUN npm run build --workspace=@bhabhi/shared
RUN npm run build --workspace=@bhabhi/server

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/drizzle ./apps/server/drizzle

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
