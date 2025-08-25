# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    curl

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sokol -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs

# Set proper permissions
RUN chown -R sokol:nodejs /app
RUN chmod -R 755 /app

# Switch to non-root user
USER sokol

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]

# Multi-stage build for production optimization
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S sokol -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code (excluding dev files)
COPY --chown=sokol:nodejs ./config ./config
COPY --chown=sokol:nodejs ./controllers ./controllers
COPY --chown=sokol:nodejs ./middleware ./middleware
COPY --chown=sokol:nodejs ./models ./models
COPY --chown=sokol:nodejs ./routes ./routes
COPY --chown=sokol:nodejs ./services ./services
COPY --chown=sokol:nodejs ./utils ./utils
COPY --chown=sokol:nodejs ./jobs ./jobs
COPY --chown=sokol:nodejs ./seeders ./seeders
COPY --chown=sokol:nodejs server.js ./

# Create necessary directories
RUN mkdir -p uploads logs && chown -R sokol:nodejs uploads logs

# Switch to non-root user
USER sokol

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]