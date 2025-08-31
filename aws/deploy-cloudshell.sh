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
