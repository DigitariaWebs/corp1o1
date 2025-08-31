#!/bin/bash

# AWS Deployment Script for Corp1o1 Full-Stack Application
# This script deploys both backend and frontend to AWS using App Runner
# Run this script from AWS CloudShell

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="corp1o1"
AWS_REGION=$(aws configure get region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BACKEND_REPO="${PROJECT_NAME}-backend"
ECR_FRONTEND_REPO="${PROJECT_NAME}-frontend"
BACKEND_SERVICE_NAME="${PROJECT_NAME}-backend-service"
FRONTEND_SERVICE_NAME="${PROJECT_NAME}-frontend-service"

echo -e "${BLUE}🚀 Starting AWS Deployment for ${PROJECT_NAME}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"
echo -e "${BLUE}Account ID: ${AWS_ACCOUNT_ID}${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
log "Checking prerequisites..."

if ! command_exists docker; then
    error "Docker is not installed. Please install Docker first."
fi

if ! command_exists aws; then
    error "AWS CLI is not installed or not configured."
fi

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    error "AWS credentials are not configured or expired."
fi

log "Prerequisites check passed!"

# Create ECR repositories
log "Setting up ECR repositories..."

# Backend repository
if ! aws ecr describe-repositories --repository-names "$ECR_BACKEND_REPO" --region "$AWS_REGION" >/dev/null 2>&1; then
    log "Creating ECR repository for backend: $ECR_BACKEND_REPO"
    aws ecr create-repository \
        --repository-name "$ECR_BACKEND_REPO" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
else
    log "ECR repository for backend already exists: $ECR_BACKEND_REPO"
fi

# Frontend repository
if ! aws ecr describe-repositories --repository-names "$ECR_FRONTEND_REPO" --region "$AWS_REGION" >/dev/null 2>&1; then
    log "Creating ECR repository for frontend: $ECR_FRONTEND_REPO"
    aws ecr create-repository \
        --repository-name "$ECR_FRONTEND_REPO" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
else
    log "ECR repository for frontend already exists: $ECR_FRONTEND_REPO"
fi

# Get ECR login token
log "Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Build and push backend image
log "Building and pushing backend image..."

cd ../backend

# Build the image
log "Building backend Docker image..."
docker build -t "$ECR_BACKEND_REPO:latest" .

# Tag for ECR
docker tag "$ECR_BACKEND_REPO:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest"

# Push to ECR
log "Pushing backend image to ECR..."
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest"

BACKEND_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_BACKEND_REPO:latest"
log "Backend image pushed: $BACKEND_IMAGE_URI"

# Build and push frontend image
log "Building and pushing frontend image..."

cd ../frontend

# Build the image
log "Building frontend Docker image..."
docker build -t "$ECR_FRONTEND_REPO:latest" .

# Tag for ECR
docker tag "$ECR_FRONTEND_REPO:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest"

# Push to ECR
log "Pushing frontend image to ECR..."
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest"

FRONTEND_IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_FRONTEND_REPO:latest"
log "Frontend image pushed: $FRONTEND_IMAGE_URI"

# Create AWS Secrets Manager secrets (if they don't exist)
log "Setting up AWS Secrets Manager..."

# Function to create secret if it doesn't exist
create_secret_if_not_exists() {
    local secret_name="$1"
    local secret_value="$2"
    
    if ! aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" >/dev/null 2>&1; then
        log "Creating secret: $secret_name"
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "Secret for $PROJECT_NAME" \
            --secret-string "$secret_value" \
            --region "$AWS_REGION"
    else
        log "Secret already exists: $secret_name"
    fi
}

# Create secrets (you'll need to update these values)
create_secret_if_not_exists "corp1o1/mongodb-uri" "your_mongodb_connection_string_here"
create_secret_if_not_exists "corp1o1/clerk-secret-key" "your_clerk_secret_key_here"
create_secret_if_not_exists "corp1o1/clerk-webhook-secret" "your_clerk_webhook_secret_here"
create_secret_if_not_exists "corp1o1/clerk-publishable-key" "your_clerk_publishable_key_here"
create_secret_if_not_exists "corp1o1/jwt-secret" "your_jwt_secret_here"
create_secret_if_not_exists "corp1o1/openai-api-key" "your_openai_api_key_here"

# Deploy backend to App Runner
log "Deploying backend to App Runner..."

cd ../aws

# Check if backend service exists
if aws apprunner describe-service --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$BACKEND_SERVICE_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    log "Updating existing backend service..."
    
    # Update the service with new image
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
    
    # Wait for update to complete
    log "Waiting for backend service update to complete..."
    aws apprunner wait service-updated \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$BACKEND_SERVICE_NAME" \
        --region "$AWS_REGION"
else
    log "Creating new backend service..."
    
    # Create the service
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
    
    # Wait for service to be ready
    log "Waiting for backend service to be ready..."
    aws apprunner wait service-created \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$BACKEND_SERVICE_NAME" \
        --region "$AWS_REGION"
fi

# Get backend service URL
BACKEND_SERVICE_ARN=$(aws apprunner list-services --region "$AWS_REGION" --query "ServiceSummaryList[?ServiceName=='$BACKEND_SERVICE_NAME'].ServiceArn" --output text)
BACKEND_URL=$(aws apprunner describe-service --service-arn "$BACKEND_SERVICE_ARN" --region "$AWS_REGION" --query "Service.ServiceUrl" --output text)

log "Backend service deployed successfully!"
log "Backend URL: $BACKEND_URL"

# Deploy frontend to App Runner
log "Deploying frontend to App Runner..."

# Check if frontend service exists
if aws apprunner describe-service --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$FRONTEND_SERVICE_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    log "Updating existing frontend service..."
    
    # Update the service with new image
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
    
    # Wait for update to complete
    log "Waiting for frontend service update to complete..."
    aws apprunner wait service-updated \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$FRONTEND_SERVICE_NAME" \
        --region "$AWS_REGION"
else
    log "Creating new frontend service..."
    
    # Create the service
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
    
    # Wait for service to be ready
    log "Waiting for frontend service to be ready..."
    aws apprunner wait service-created \
        --service-arn "arn:aws:apprunner:$AWS_REGION:$AWS_ACCOUNT_ID:service/$FRONTEND_SERVICE_NAME" \
        --region "$AWS_REGION"
fi

# Get frontend service URL
FRONTEND_SERVICE_ARN=$(aws apprunner list-services --region "$AWS_REGION" --query "ServiceSummaryList[?ServiceName=='$FRONTEND_SERVICE_NAME'].ServiceArn" --output text)
FRONTEND_URL=$(aws apprunner describe-service --service-arn "$FRONTEND_SERVICE_ARN" --region "$AWS_REGION" --query "Service.ServiceUrl" --output text)

log "Frontend service deployed successfully!"
log "Frontend URL: $FRONTEND_URL"

# Update Clerk webhook URL
log "Updating Clerk webhook URL..."
log "IMPORTANT: You need to manually update your Clerk webhook URL to: $BACKEND_URL/webhooks/clerk"

# Create deployment summary
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo -e "  Backend Service: $BACKEND_SERVICE_NAME"
echo -e "  Backend URL: $BACKEND_URL"
echo -e "  Frontend Service: $FRONTEND_SERVICE_NAME"
echo -e "  Frontend URL: $FRONTEND_URL"
echo -e "  ECR Backend Repo: $ECR_BACKEND_REPO"
echo -e "  ECR Frontend Repo: $ECR_FRONTEND_REPO"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Update Clerk webhook URL to: $BACKEND_URL/webhooks/clerk"
echo -e "  2. Test the deployed services"
echo -e "  3. Configure custom domains if needed"
echo -e "  4. Set up monitoring and alerts"
echo ""

# Save deployment info to file
cat > deployment-info.txt << EOF
Deployment completed: $(date)
Backend URL: $BACKEND_URL
Frontend URL: $FRONTEND_URL
Webhook URL: $BACKEND_URL/webhooks/clerk
EOF

log "Deployment information saved to deployment-info.txt"
