# Multi-stage Dockerfile for AmeriLend
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package and lockfiles and install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies. Use npm ci if package-lock.json exists; otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; else npm install --legacy-peer-deps; fi

# Copy source files
COPY . .

# Build production artifacts (Vite client + esbuild server bundle)
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy only production node_modules (if server depends only on runtime deps)
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the server
CMD ["node", "dist/index.js"]
