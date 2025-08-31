# Production-optimized Dockerfile for AWS App Runner
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies only
RUN apk add --no-cache curl tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code from builder
COPY --from=builder --chown=nodejs:nodejs /app/config ./config
COPY --from=builder --chown=nodejs:nodejs /app/controllers ./controllers
COPY --from=builder --chown=nodejs:nodejs /app/middleware ./middleware
COPY --from=builder --chown=nodejs:nodejs /app/models ./models
COPY --from=builder --chown=nodejs:nodejs /app/routes ./routes
COPY --from=builder --chown=nodejs:nodejs /app/services ./services
COPY --from=builder --chown=nodejs:nodejs /app/utils ./utils
COPY --from=builder --chown=nodejs:nodejs /app/jobs ./jobs
COPY --from=builder --chown=nodejs:nodejs /app/seeders ./seeders
COPY --from=builder --chown=nodejs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nodejs:nodejs /app/server.js ./

# Create necessary directories with proper permissions
RUN mkdir -p uploads logs tmp && \
    chown -R nodejs:nodejs uploads logs tmp

# Set environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Use non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check with proper timeout for AWS
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["node", "server.js"]