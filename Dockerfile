# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma client
WORKDIR /app/server
RUN npx prisma generate

# Build client and server
WORKDIR /app
RUN npm run build --workspace=client
RUN npm run build --workspace=server

# Production stage
FROM node:20-alpine AS production

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

WORKDIR /app

# Copy server built files and dependencies
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/prisma ./server/prisma

# Copy client built files
COPY --from=builder /app/client/dist ./client/dist

# Copy root package files for workspace structure
COPY --from=builder /app/package*.json ./

# Install production dependencies and tsx for seeding
WORKDIR /app/server
RUN npm ci --omit=dev && npm install tsx

# Generate Prisma client in production
RUN npx prisma generate

# Create data directory for SQLite
RUN mkdir -p data

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./data/prelude.db"

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run migrations, seed database, and start server
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/index.js"]
