# ==============================================================================
# RescueRoom Production Containerization
# Multi-stage Docker build for hardened Node.js backend & Vite static assets
# ==============================================================================

# --- Stage 1: Build the React 19 Frontend ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies required for building
COPY package*.json ./
RUN npm ci

# Copy full application source and compile static distribution
COPY . .
RUN npm run build

# --- Stage 2: Hardened Production Server ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install production-only runtime dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend distribution from builder
COPY --from=builder /app/dist ./dist

# Copy backend server runtime and shared roster logic
COPY server/ ./server
COPY src/lib/roster.js ./src/lib/roster.js

# Ensure node user owns the runtime directory
RUN chown -R node:node /app

# Switch to non-privileged user for container security
USER node

# Healthcheck monitoring
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

EXPOSE 3001

CMD ["node", "server/index.js"]

