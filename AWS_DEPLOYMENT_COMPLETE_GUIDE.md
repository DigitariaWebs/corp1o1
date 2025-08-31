# Complete AWS Deployment Guide for Corp1o1 Full-Stack Application

This comprehensive guide contains everything you need to deploy your Corp1o1 application to AWS using App Runner and ECR.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   MongoDB       │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (Atlas)       │
│   App Runner    │    │   App Runner    │    │   External      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   ECR Frontend  │    │   ECR Backend   │
│   Repository    │    │   Repository    │
└─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CloudShell access
- Docker installed and running
- MongoDB Atlas cluster (or external MongoDB)
- Clerk account with webhook configuration
- Your application code ready for deployment

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Clone your repository to CloudShell:**
   ```bash
   git clone <your-repo-url>
   cd corp1o1
   ```

2. **Make the deployment script executable:**
   ```bash
   chmod +x aws/deploy-cloudshell.sh
   ```

3. **Run the deployment script:**
   ```bash
   ./aws/deploy-cloudshell.sh
   ```

### Option 2: Manual Step-by-Step Deployment

Follow the detailed steps below if you prefer manual control.

## 🔧 Manual Deployment Steps

### Step 1: AWS Configuration

1. **Set your AWS region:**
   ```bash
   aws configure set region us-east-1  # or your preferred region
   ```

2. **Verify AWS credentials:**
   ```bash
   aws sts get-caller-identity
   ```

### Step 2: Create ECR Repositories

1. **Create backend repository:**
   ```bash
   aws ecr create-repository \
       --repository-name corp1o1-backend \
       --image-scanning-configuration scanOnPush=true \
       --encryption-configuration encryptionType=AES256
   ```

2. **Create frontend repository:**
   ```bash
   aws ecr create-repository \
       --repository-name corp1o1-frontend \
       --image-scanning-configuration scanOnPush=true \
       --encryption-configuration encryptionType=AES256
   ```

### Step 3: Build and Push Docker Images

1. **Login to ECR:**
   ```bash
   aws ecr get-login-password --region $(aws configure get region) | \
   docker login --username AWS --password-stdin \
   $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com
   ```

2. **Build and push backend:**
   ```bash
   cd backend
   docker build -t corp1o1-backend:latest .
   docker tag corp1o1-backend:latest \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-backend:latest
   docker push \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-backend:latest
   ```

3. **Build and push frontend:**
   ```bash
   cd ../frontend
   docker build -t corp1o1-frontend:latest .
   docker tag corp1o1-frontend:latest \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-frontend:latest
   docker push \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-frontend:latest
   ```

### Step 4: Set Up AWS Secrets Manager

1. **Create secrets for your application:**
   ```bash
   # MongoDB connection string
   aws secretsmanager create-secret \
       --name "corp1o1/mongodb-uri" \
       --description "MongoDB connection string for Corp1o1" \
       --secret-string "your_actual_mongodb_connection_string"

   # Clerk secret key
   aws secretsmanager create-secret \
       --name "corp1o1/clerk-secret-key" \
       --description "Clerk secret key for Corp1o1" \
       --secret-string "your_actual_clerk_secret_key"

   # Clerk webhook secret
   aws secretsmanager create-secret \
       --name "corp1o1/clerk-webhook-secret" \
       --description "Clerk webhook secret for Corp1o1" \
       --secret-string "your_actual_webhook_secret"

   # Clerk publishable key
   aws secretsmanager create-secret \
       --name "corp1o1/clerk-publishable-key" \
       --description "Clerk publishable key for Corp1o1" \
       --secret-string "your_actual_publishable_key"

   # JWT secret
   aws secretsmanager create-secret \
       --name "corp1o1/jwt-secret" \
       --description "JWT secret for Corp1o1" \
       --secret-string "your_actual_jwt_secret"

   # OpenAI API key
   aws secretsmanager create-secret \
       --name "corp1o1/openai-api-key" \
       --description "OpenAI API key for Corp1o1" \
       --secret-string "your_actual_openai_api_key"
   ```

### Step 5: Deploy Backend to App Runner

1. **Create backend service:**
   ```bash
   aws apprunner create-service \
       --service-name "corp1o1-backend-service" \
       --source-configuration "{
           \"ImageRepository\": {
               \"ImageIdentifier\": \"$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-backend:latest\",
               \"ImageConfiguration\": {
                   \"Port\": \"3000\"
               },
               \"ImageRepositoryType\": \"ECR\"
           }
       }" \
       --instance-configuration "{
           \"Cpu\": \"1024\",
           \"Memory\": \"2048\"
       }"
   ```

2. **Wait for service to be ready:**
   ```bash
   aws apprunner wait service-created \
       --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-backend-service"
   ```

### Step 6: Deploy Frontend to App Runner

1. **Create frontend service:**
   ```bash
   aws apprunner create-service \
       --service-name "corp1o1-frontend-service" \
       --source-configuration "{
           \"ImageRepository\": {
               \"ImageIdentifier\": \"$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-frontend:latest\",
               \"ImageConfiguration\": {
                   \"Port\": \"3000\"
               },
               \"ImageRepositoryType\": \"ECR\"
           }
       }" \
       --instance-configuration "{
           \"Cpu\": \"1024\",
           \"Memory\": \"2048\"
       }"
   ```

2. **Wait for service to be ready:**
   ```bash
   aws apprunner wait service-created \
       --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-frontend-service"
   ```

### Step 7: Get Service URLs

1. **Get backend URL:**
   ```bash
   aws apprunner describe-service \
       --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-backend-service" \
       --query "Service.ServiceUrl" --output text
   ```

2. **Get frontend URL:**
   ```bash
   aws apprunner describe-service \
       --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-frontend-service" \
       --query "Service.ServiceUrl" --output text
   ```

### Step 8: Update Clerk Webhook URL

1. **Go to your Clerk dashboard**
2. **Navigate to Webhooks section**
3. **Update the webhook URL to:** `https://your-backend-url/webhooks/clerk`
4. **Save the changes**

## 🔍 Testing Your Deployment

### Test Backend Health Check

```bash
curl https://your-backend-url/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "corp1o1-backend"
}
```

### Test Frontend

1. **Open your frontend URL in a browser**
2. **Verify the application loads correctly**
3. **Test authentication flow**
4. **Verify API calls to backend work**

### Test Webhook

1. **Create a test user in Clerk**
2. **Check your backend logs for webhook events**
3. **Verify user data is synced to MongoDB**

## 🛠️ Configuration Files

### Backend Environment Variables

Create a `.env` file in your backend directory:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
MONGODB_URI=your_mongodb_connection_string
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
CORS_ORIGIN=https://your-frontend-domain
```

### Frontend Environment Variables

Create a `.env.local` file in your frontend directory:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_API_URL=https://your-backend-domain
NEXT_PUBLIC_ENVIRONMENT=production
```

## 🔧 Troubleshooting

### Common Issues

1. **Docker build fails:**
   - Check Docker is running
   - Verify Dockerfile syntax
   - Check for missing dependencies

2. **ECR push fails:**
   - Verify ECR login
   - Check AWS credentials
   - Verify repository exists

3. **App Runner deployment fails:**
   - Check image URI is correct
   - Verify port configuration
   - Check service logs

4. **Webhook not working:**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Verify backend is accessible

### Debugging Commands

1. **Check App Runner service status:**
   ```bash
   aws apprunner describe-service --service-name corp1o1-backend-service
   ```

2. **View service logs:**
   ```bash
   aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner"
   ```

3. **Check ECR repositories:**
   ```bash
   aws ecr describe-repositories
   ```

4. **Verify secrets:**
   ```bash
   aws secretsmanager list-secrets --filters Key=name,Values=corp1o1
   ```

## 📊 Monitoring and Maintenance

### CloudWatch Metrics

- **App Runner metrics:** CPU, memory, request count, response time
- **ECR metrics:** image push/pull counts, repository size
- **Custom metrics:** application-specific metrics

### Logging

- **App Runner logs:** Application logs, access logs
- **CloudWatch Logs:** Centralized logging
- **Custom logging:** Application-specific logs

### Cost Optimization

- **App Runner:** Use appropriate instance sizes
- **ECR:** Clean up old images regularly
- **Secrets Manager:** Only store necessary secrets

## 🔄 Update Process

### Update Backend

1. **Build new image:**
   ```bash
   cd backend
   docker build -t corp1o1-backend:latest .
   ```

2. **Push to ECR:**
   ```bash
   docker tag corp1o1-backend:latest \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-backend:latest
   docker push \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-backend:latest
   ```

3. **Update App Runner service:**
   ```bash
   aws apprunner update-service \
       --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-backend-service" \
       --source-configuration "{
           \"ImageRepository\": {
               \"ImageIdentifier\": \"$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-backend:latest\",
               \"ImageConfiguration\": {
                   \"Port\": \"3000\"
               },
               \"ImageRepositoryType\": \"ECR\"
           }
       }"
   ```

### Update Frontend

Follow the same process as backend, but for the frontend service.

## 🚨 Security Considerations

1. **Secrets Management:** Use AWS Secrets Manager for sensitive data
2. **Network Security:** App Runner provides HTTPS by default
3. **Access Control:** Use IAM roles and policies
4. **Image Scanning:** Enable ECR image scanning
5. **Logging:** Enable CloudTrail for audit logs

## 📚 Additional Resources

- [AWS App Runner Documentation](https://docs.aws.amazon.com/apprunner/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Clerk Webhooks Documentation](https://clerk.com/docs/webhooks)

## 🆘 Support

If you encounter issues:

1. **Check AWS CloudWatch logs**
2. **Verify configuration files**
3. **Test locally first**
4. **Check AWS service status**
5. **Review this guide for common solutions**

---

**Note:** This guide assumes you're deploying from AWS CloudShell. If deploying from a different environment, adjust the commands accordingly.

## 📁 Complete Project Structure

```
corp1o1/
├── backend/
│   ├── Dockerfile                    # Production-ready Dockerfile
│   ├── env.example                   # Environment variables template
│   ├── package.json                  # Dependencies and scripts
│   ├── server.js                     # Express.js server
│   ├── routes/
│   │   └── webhooks/
│   │       ├── index.js             # Webhook router
│   │       └── clerk.js             # Clerk webhook handler
│   ├── models/                       # MongoDB models
│   ├── controllers/                  # API controllers
│   ├── middleware/                   # Express middleware
│   ├── services/                     # Business logic services
│   └── config/                       # Configuration files
├── frontend/
│   ├── Dockerfile                    # Next.js production Dockerfile
│   ├── env.example                   # Frontend environment template
│   ├── package.json                  # Next.js dependencies
│   ├── next.config.mjs              # Next.js configuration
│   ├── app/                          # Next.js app directory
│   ├── components/                   # React components
│   ├── contexts/                     # React contexts
│   └── lib/                          # Utility libraries
└── aws/
    ├── deploy.sh                     # Full-featured deployment script
    ├── deploy-cloudshell.sh          # Simplified CloudShell script
    ├── apprunner-backend.yaml        # App Runner backend config
    ├── apprunner-frontend.yaml       # App Runner frontend config
    ├── DEPLOYMENT_GUIDE.md           # Detailed deployment guide
    ├── POST_DEPLOYMENT_CHECKLIST.md  # Post-deployment checklist
    ├── TROUBLESHOOTING_GUIDE.md      # Troubleshooting guide
    └── README.md                     # AWS deployment overview
```

## 🔧 Docker Configuration

### Backend Dockerfile

```dockerfile
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
```

### Frontend Dockerfile

```dockerfile
# Multi-stage build for Next.js frontend
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

## 🚀 Automated Deployment Scripts

### deploy-cloudshell.sh (Simplified)

```bash
#!/bin/bash

# AWS CloudShell Deployment Script for Corp1o1
# This script is optimized for AWS CloudShell environment

set -e

echo "🚀 Starting AWS Deployment for Corp1o1"
echo "========================================"

# Get AWS configuration
AWS_REGION=$(aws configure get region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Region: $AWS_REGION"
echo "Account ID: $AWS_ACCOUNT_ID"
echo ""

# Configuration
PROJECT_NAME="corp1o1"
ECR_BACKEND_REPO="${PROJECT_NAME}-backend"
ECR_FRONTEND_REPO="${PROJECT_NAME}-frontend"
BACKEND_SERVICE_NAME="${PROJECT_NAME}-backend-service"
FRONTEND_SERVICE_NAME="${PROJECT_NAME}-frontend-service"

# Step 1: Create ECR repositories
echo "📦 Step 1: Creating ECR repositories..."

# Backend repository
aws ecr create-repository \
    --repository-name "$ECR_BACKEND_REPO" \
    --region "$AWS_REGION" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 2>/dev/null || echo "Backend repository already exists"

# Frontend repository
aws ecr create-repository \
    --repository-name "$ECR_FRONTEND_REPO" \
    --region "$AWS_REGION" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 2>/dev/null || echo "Frontend repository already exists"

echo "✅ ECR repositories created"

# Step 2: Login to ECR
echo ""
echo "🔐 Step 2: Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Step 3: Build and push backend
echo ""
echo "🏗️ Step 3: Building and pushing backend..."
cd ../backend

echo "Building backend Docker image..."
docker build -t "$ECR_BACKEND_REPO:latest" .

echo "Tagging backend image for ECR..."
docker tag "$ECR_BACKEND_REPO:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest"

echo "Pushing backend image to ECR..."
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest"

BACKEND_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest"
echo "✅ Backend image pushed: $BACKEND_IMAGE_URI"

# Step 4: Build and push frontend
echo ""
echo "🏗️ Step 4: Building and pushing frontend..."
cd ../frontend

echo "Building frontend Docker image..."
docker build -t "$ECR_FRONTEND_REPO:latest" .

echo "Tagging frontend image for ECR..."
docker tag "$ECR_FRONTEND_REPO:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest"

echo "Pushing frontend image to ECR..."
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest"

FRONTEND_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest"
echo "✅ Frontend image pushed: $FRONTEND_IMAGE_URI"

# Step 5: Create secrets (you need to update these values)
echo ""
echo "🔒 Step 5: Setting up AWS Secrets Manager..."
echo "Note: You need to manually update the secret values with your actual credentials"

# Create secrets with placeholder values
aws secretsmanager create-secret \
    --name "corp1o1/mongodb-uri" \
    --description "MongoDB connection string for Corp1o1" \
    --secret-string "your_mongodb_connection_string_here" \
    --region "$AWS_REGION" 2>/dev/null || echo "MongoDB secret already exists"

aws secretsmanager create-secret \
    --name "corp1o1/clerk-secret-key" \
    --description "Clerk secret key for Corp1o1" \
    --secret-string "your_clerk_secret_key_here" \
    --region "$AWS_REGION" 2>/dev/null || echo "Clerk secret key already exists"

aws secretsmanager create-secret \
    --name "corp1o1/clerk-webhook-secret" \
    --description "Clerk webhook secret for Corp1o1" \
    --secret-string "your_clerk_webhook_secret_here" \
    --region "$AWS_REGION" 2>/dev/null || echo "Clerk webhook secret already exists"

aws secretsmanager create-secret \
    --name "corp1o1/clerk-publishable-key" \
    --description "Clerk publishable key for Corp1o1" \
    --secret-string "your_clerk_publishable_key_here" \
    --region "$AWS_REGION" 2>/dev/null || echo "Clerk publishable key already exists"

aws secretsmanager create-secret \
    --name "corp1o1/jwt-secret" \
    --description "JWT secret for Corp1o1" \
    --secret-string "your_jwt_secret_here" \
    --region "$AWS_REGION" 2>/dev/null || echo "JWT secret already exists"

aws secretsmanager create-secret \
    --name "corp1o1/openai-api-key" \
    --description "OpenAI API key for Corp1o1" \
    --secret-string "your_openai_api_key_here" \
    --region "$AWS_REGION" 2>/dev/null || echo "OpenAI API key already exists"

echo "✅ Secrets created (update values manually)"

# Step 6: Deploy backend to App Runner
echo ""
echo "🚀 Step 6: Deploying backend to App Runner..."

cd ../aws

# Check if backend service exists
if aws apprunner describe-service --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$BACKEND_SERVICE_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "Updating existing backend service..."
    
    aws apprunner update-service \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$BACKEND_SERVICE_NAME" \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageIdentifier\": \"$BACKEND_IMAGE_URI\",
                \"ImageConfiguration\": {
                    \"Port\": \"3000\"
                },
                \"ImageRepositoryType\": \"ECR\"
            }
        }" \
        --region "$AWS_REGION"
    
    echo "Waiting for backend service update..."
    aws apprunner wait service-updated \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$BACKEND_SERVICE_NAME" \
        --region "$AWS_REGION"
else
    echo "Creating new backend service..."
    
    aws apprunner create-service \
        --service-name "$BACKEND_SERVICE_NAME" \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageIdentifier\": \"$BACKEND_IMAGE_URI\",
                \"ImageConfiguration\": {
                    \"Port\": \"3000\"
                },
                \"ImageRepositoryType\": \"ECR\"
            }
        }" \
        --instance-configuration "{
            \"Cpu\": \"1024\",
            \"Memory\": \"2048\"
        }" \
        --region "$AWS_REGION"
    
    echo "Waiting for backend service to be ready..."
    aws apprunner wait service-created \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$BACKEND_SERVICE_NAME" \
        --region "$AWS_REGION"
fi

# Get backend service URL
BACKEND_SERVICE_ARN=$(aws apprunner list-services --region "$AWS_REGION" --query "ServiceSummaryList[?ServiceName=='$BACKEND_SERVICE_NAME'].ServiceArn" --output text)
BACKEND_URL=$(aws apprunner describe-service --service-arn "$BACKEND_SERVICE_ARN" --region "$AWS_REGION" --query "Service.ServiceUrl" --output text)

echo "✅ Backend service deployed: $BACKEND_URL"

# Step 7: Deploy frontend to App Runner
echo ""
echo "🚀 Step 7: Deploying frontend to App Runner..."

# Check if frontend service exists
if aws apprunner describe-service --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$FRONTEND_SERVICE_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "Updating existing frontend service..."
    
    aws apprunner update-service \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$FRONTEND_SERVICE_NAME" \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageIdentifier\": \"$FRONTEND_IMAGE_URI\",
                \"ImageConfiguration\": {
                    \"Port\": \"3000\"
                },
                \"ImageRepositoryType\": \"ECR\"
            }
        }" \
        --region "$AWS_REGION"
    
    echo "Waiting for frontend service update..."
    aws apprunner wait service-updated \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$FRONTEND_SERVICE_NAME" \
        --region "$AWS_REGION"
else
    echo "Creating new frontend service..."
    
    aws apprunner create-service \
        --service-name "$FRONTEND_SERVICE_NAME" \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageIdentifier\": \"$FRONTEND_IMAGE_URI\",
                \"ImageConfiguration\": {
                    \"Port\": \"3000\"
                },
                \"ImageRepositoryType\": \"ECR\"
            }
        }" \
        --instance-configuration "{
            \"Cpu\": \"1024\",
            \"Memory\": \"2048\"
        }" \
        --region "$AWS_REGION"
    
    echo "Waiting for frontend service to be ready..."
    aws apprunner wait service-created \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$FRONTEND_SERVICE_NAME" \
        --region "$AWS_REGION"
fi

# Get frontend service URL
FRONTEND_SERVICE_ARN=$(aws apprunner list-services --region "$AWS_REGION" --query "ServiceSummaryList[?ServiceName=='$FRONTEND_SERVICE_NAME'].ServiceArn" --output text)
FRONTEND_URL=$(aws apprunner describe-service --service-arn "$FRONTEND_SERVICE_ARN" --region "$AWS_REGION" --query "Service.ServiceUrl" --output text)

echo "✅ Frontend service deployed: $FRONTEND_URL"

# Step 8: Update secrets with actual values
echo ""
echo "🔒 Step 8: IMPORTANT - Update your secrets with actual values"
echo "Run these commands to update your secrets:"
echo ""
echo "aws secretsmanager update-secret --secret-id corp1o1/mongodb-uri --secret-string 'your_actual_mongodb_uri' --region $AWS_REGION"
echo "aws secretsmanager update-secret --secret-id corp1o1/clerk-secret-key --secret-string 'your_actual_clerk_secret_key' --region $AWS_REGION"
echo "aws secretsmanager update-secret --secret-id corp1o1/clerk-webhook-secret --secret-string 'your_actual_webhook_secret' --region $AWS_REGION"
echo "aws secretsmanager update-secret --secret-id corp1o1/clerk-publishable-key --secret-string 'your_actual_publishable_key' --region $AWS_REGION"
echo "aws secretsmanager update-secret --secret-id corp1o1/jwt-secret --secret-string 'your_actual_jwt_secret' --region $AWS_REGION"
echo "aws secretsmanager update-secret --secret-id corp1o1/openai-api-key --secret-string 'your_actual_openai_key' --region $AWS_REGION"

# Step 9: Update Clerk webhook URL
echo ""
echo "🔗 Step 9: Update Clerk webhook URL"
echo "IMPORTANT: Go to your Clerk dashboard and update the webhook URL to:"
echo "$BACKEND_URL/webhooks/clerk"

# Final summary
echo ""
echo "🎉 Deployment completed successfully!"
echo "====================================="
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "Webhook URL: $BACKEND_URL/webhooks/clerk"
echo ""
echo "Next steps:"
echo "1. Update your secrets with actual values"
echo "2. Update Clerk webhook URL"
echo "3. Test your deployed services"
echo "4. Configure custom domains if needed"
```

## 📋 Post-Deployment Checklist

### Pre-Deployment Verification
- [ ] AWS CloudShell is accessible and authenticated
- [ ] Docker is running and accessible
- [ ] Your application code is ready and tested locally
- [ ] MongoDB Atlas cluster is accessible
- [ ] Clerk account is configured with webhook endpoint
- [ ] All environment variables are documented

### Deployment Execution
- [ ] ECR repositories created successfully
- [ ] Backend Docker image built and pushed to ECR
- [ ] Frontend Docker image built and pushed to ECR
- [ ] AWS Secrets Manager secrets created
- [ ] Backend App Runner service deployed
- [ ] Frontend App Runner service deployed
- [ ] All services are in "Running" state

### Service Health Checks
- [ ] Backend service status is "Running"
- [ ] Health check endpoint responds: `GET /health`
- [ ] Frontend service status is "Running"
- [ ] Frontend loads without errors
- [ ] No console errors in browser developer tools

### Network and Connectivity
- [ ] Backend URL is accessible via HTTPS
- [ ] CORS is properly configured for frontend domain
- [ ] Frontend URL is accessible via HTTPS
- [ ] Frontend can communicate with backend API
- [ ] No CORS errors in browser console

### Authentication and Security
- [ ] Clerk publishable key is configured
- [ ] Sign-in page loads correctly
- [ ] Sign-up page loads correctly
- [ ] Authentication flow works end-to-end
- [ ] Clerk webhook URL is updated to production backend URL
- [ ] Webhook secret is properly configured

### Database and Data
- [ ] Connection string is correct and secure
- [ ] Database indexes are created
- [ ] User data is being synced from Clerk
- [ ] No connection errors in logs

## 🚨 Emergency Procedures

### Service Down
1. **Check App Runner service status:**
   ```bash
   aws apprunner describe-service --service-name corp1o1-backend-service
   aws apprunner describe-service --service-name corp1o1-frontend-service
   ```

2. **Restart service if needed:**
   ```bash
   aws apprunner update-service \
       --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-backend-service" \
       --source-configuration "same-as-before"
   ```

3. **Check CloudWatch logs for errors:**
   ```bash
   aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner"
   ```

## 🔍 Common Issues and Solutions

### Docker Build Failures
**Issue:** Build fails with dependency errors
**Solution:**
```bash
# Clear Docker cache
docker system prune -a

# Check package.json for conflicts
cd backend
npm audit fix
npm install

# Rebuild with no cache
docker build --no-cache -t corp1o1-backend:latest .
```

### ECR Push Failures
**Issue:** Authentication failed
**Solution:**
```bash
# Re-login to ECR
aws ecr get-login-password --region $(aws configure get region) | \
docker login --username AWS --password-stdin \
$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com

# Verify credentials
aws sts get-caller-identity
```

### App Runner Deployment Issues
**Issue:** Service creation fails
**Solution:**
```bash
# Check service configuration
aws apprunner describe-service --service-name corp1o1-backend-service

# Verify image URI is correct
aws ecr describe-images --repository-name corp1o1-backend

# Check IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name $(aws sts get-caller-identity --query UserId --output text)
```

### Webhook Issues
**Issue:** Clerk webhook not working
**Solution:**
```bash
# Check webhook logs
aws logs filter-log-events \
    --log-group-name "/aws/apprunner/corp1o1-backend-service" \
    --filter-pattern "webhook"

# Verify webhook endpoint is accessible
curl -X POST https://your-backend-url/webhooks/clerk \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
```

## 📊 Monitoring and Alerts

### Set Up CloudWatch Alarms
```bash
# Create CPU utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "corp1o1-backend-cpu-high" \
    --alarm-description "High CPU utilization for backend service" \
    --metric-name "CPUUtilization" \
    --namespace "AWS/AppRunner" \
    --statistic "Average" \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator "GreaterThanThreshold" \
    --dimensions Name=ServiceName,Value=corp1o1-backend-service

# Create error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "corp1o1-backend-errors" \
    --alarm-description "High error rate for backend service" \
    --metric-name "ErrorRate" \
    --namespace "AWS/AppRunner" \
    --statistic "Sum" \
    --period 300 \
    --evaluation-periods 1 \
    --threshold 5 \
    --comparison-operator "GreaterThanThreshold" \
    --dimensions Name=ServiceName,Value=corp1o1-backend-service
```

## 🚨 Emergency Rollback

### Rollback to Previous Version
```bash
# Get previous image
aws ecr describe-images --repository-name corp1o1-backend --query 'imageDetails[?imageTags[?contains(@, `v1.0.0`)]].imageDigest' --output text

# Update service to previous image
aws apprunner update-service \
    --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-backend-service" \
    --source-configuration "{
        \"ImageRepository\": {
            \"ImageIdentifier\": \"$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-backend:v1.0.0\",
            \"ImageConfiguration\": {
                \"Port\": \"3000\"
            },
            \"ImageRepositoryType\": \"ECR\"
        }
    }"
```

## 📞 Support Contacts

### AWS Support
- **Basic Support:** AWS Console → Support Center
- **Developer Support:** aws.amazon.com/support
- **Emergency:** AWS Console → Support → Create Case

### Clerk Support
- **Documentation:** clerk.com/docs
- **Support:** support@clerk.com
- **Community:** discord.gg/clerk

### MongoDB Support
- **Documentation:** docs.mongodb.com
- **Support:** cloud.mongodb.com/support
- **Community:** community.mongodb.com

## 📝 Issue Reporting Template

When reporting issues, include:

```
**Issue Description:**
[Describe the problem]

**Environment:**
- AWS Region: [region]
- Service Names: [backend/frontend service names]
- Deployment Date: [date]

**Error Messages:**
[Copy error messages from logs/console]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Additional Information:**
[Any other relevant details]
```

---

**Remember:** Always test your deployment in a development environment first. Keep backups of working configurations and document all changes made during troubleshooting.
