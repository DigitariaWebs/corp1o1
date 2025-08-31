#!/bin/bash
set -euo pipefail

# AWS Configuration
AWS_ACCOUNT_ID="876493681859"
AWS_REGION="us-east-1"
ECR_REPOSITORY="corp1o1-backend"
APP_NAME="corp1o1-backend"
SERVICE_NAME="corp1o1-backend-service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Corp1o1 Backend Deployment to AWS...${NC}"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"

# Check AWS CLI installation
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Please install Docker first.${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "backend/Dockerfile" ]; then
    echo -e "${RED}Error: backend/Dockerfile not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

# Configure AWS credentials (if not already configured)
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Create ECR repository if it doesn't exist
echo -e "${YELLOW}Creating ECR repository if it doesn't exist...${NC}"
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# Get ECR login token
echo -e "${YELLOW}Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
cd backend
docker build -t $ECR_REPOSITORY:latest .

# Tag image for ECR
echo -e "${YELLOW}Tagging image for ECR...${NC}"
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Push image to ECR
echo -e "${YELLOW}Pushing image to ECR...${NC}"
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Create secrets in AWS Secrets Manager if they don't exist
echo -e "${YELLOW}Setting up secrets in AWS Secrets Manager...${NC}"
cd ..

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if aws secretsmanager describe-secret --secret-id $secret_name --region $AWS_REGION &>/dev/null; then
        echo "Updating secret: $secret_name"
        aws secretsmanager update-secret --secret-id $secret_name --secret-string "$secret_value" --region $AWS_REGION
    else
        echo "Creating secret: $secret_name"
        aws secretsmanager create-secret --name $secret_name --secret-string "$secret_value" --region $AWS_REGION
    fi
}

# Check if .env file exists
if [ -f "backend/.env" ]; then
    echo -e "${YELLOW}Reading environment variables from backend/.env...${NC}"
    
    # Extract required secrets from .env file
    MONGODB_URI=$(grep "^MONGODB_URI=" backend/.env | cut -d '=' -f2-)
    JWT_SECRET=$(grep "^JWT_SECRET=" backend/.env | cut -d '=' -f2-)
    OPENAI_API_KEY=$(grep "^OPENAI_API_KEY=" backend/.env | cut -d '=' -f2-)
    CLERK_SECRET_KEY=$(grep "^CLERK_SECRET_KEY=" backend/.env | cut -d '=' -f2-)
    CLERK_WEBHOOK_SECRET=$(grep "^CLERK_WEBHOOK_SECRET=" backend/.env | cut -d '=' -f2-)
    
    # Create secrets if values are found
    [ -n "$MONGODB_URI" ] && create_or_update_secret "corp1o1/mongodb-uri" "$MONGODB_URI"
    [ -n "$JWT_SECRET" ] && create_or_update_secret "corp1o1/jwt-secret" "$JWT_SECRET"
    [ -n "$OPENAI_API_KEY" ] && create_or_update_secret "corp1o1/openai-api-key" "$OPENAI_API_KEY"
    [ -n "$CLERK_SECRET_KEY" ] && create_or_update_secret "corp1o1/clerk-secret-key" "$CLERK_SECRET_KEY"
    [ -n "$CLERK_WEBHOOK_SECRET" ] && create_or_update_secret "corp1o1/clerk-webhook-secret" "$CLERK_WEBHOOK_SECRET"
else
    echo -e "${YELLOW}Warning: backend/.env file not found. Please create secrets manually in AWS Secrets Manager.${NC}"
fi

# Check if App Runner service exists
echo -e "${YELLOW}Checking if App Runner service exists...${NC}"
SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text 2>/dev/null)

if [ -z "$SERVICE_ARN" ]; then
    # Create App Runner service
    echo -e "${YELLOW}Creating App Runner service...${NC}"
    
    # Create service role if it doesn't exist
    ROLE_NAME="AppRunnerECRAccessRole"
    if ! aws iam get-role --role-name $ROLE_NAME &>/dev/null; then
        echo "Creating IAM role for App Runner..."
        
        # Create trust policy
        cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        # Create role
        aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://trust-policy.json
        
        # Attach ECR access policy
        aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
        
        rm trust-policy.json
    fi
    
    # Create App Runner configuration
    cat > apprunner-config.json <<EOF
{
    "ServiceName": "$SERVICE_NAME",
    "SourceConfiguration": {
        "AuthenticationConfiguration": {
            "AccessRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/$ROLE_NAME"
        },
        "AutoDeploymentsEnabled": true,
        "ImageRepository": {
            "ImageIdentifier": "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest",
            "ImageConfiguration": {
                "Port": "3000",
                "RuntimeEnvironmentVariables": {
                    "NODE_ENV": "production",
                    "PORT": "3000",
                    "HOST": "0.0.0.0"
                },
                "RuntimeEnvironmentSecrets": {
                    "MONGODB_URI": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:corp1o1/mongodb-uri",
                    "JWT_SECRET": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:corp1o1/jwt-secret",
                    "OPENAI_API_KEY": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:corp1o1/openai-api-key",
                    "CLERK_SECRET_KEY": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:corp1o1/clerk-secret-key",
                    "CLERK_WEBHOOK_SECRET": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:corp1o1/clerk-webhook-secret"
                }
            },
            "ImageRepositoryType": "ECR"
        }
    },
    "HealthCheckConfiguration": {
        "Protocol": "HTTP",
        "Path": "/health",
        "Interval": 30,
        "Timeout": 10,
        "HealthyThreshold": 1,
        "UnhealthyThreshold": 3
    },
    "InstanceConfiguration": {
        "Cpu": "0.5 vCPU",
        "Memory": "1 GB"
    }
}
EOF
    
    # Create the service
    aws apprunner create-service --cli-input-json file://apprunner-config.json --region $AWS_REGION
    
    rm apprunner-config.json
    
    echo -e "${GREEN}App Runner service created successfully!${NC}"
else
    # Update existing service
    echo -e "${YELLOW}Updating existing App Runner service...${NC}"
    
    # Start deployment
    aws apprunner start-deployment --service-arn $SERVICE_ARN --region $AWS_REGION
    
    echo -e "${GREEN}Deployment started for existing service!${NC}"
fi

# Wait for service to be ready
echo -e "${YELLOW}Waiting for service to be ready...${NC}"
if [ -z "$SERVICE_ARN" ]; then
    # Get the newly created service ARN
    SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text)
fi

# Check service status
while true; do
    STATUS=$(aws apprunner describe-service --service-arn $SERVICE_ARN --region $AWS_REGION --query "Service.Status" --output text)
    if [ "$STATUS" = "RUNNING" ]; then
        break
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "DELETE_FAILED" ]; then
        echo -e "${RED}Service deployment failed!${NC}"
        exit 1
    fi
    echo "Current status: $STATUS. Waiting..."
    sleep 30
done

# Get service URL
SERVICE_URL=$(aws apprunner describe-service --service-arn $SERVICE_ARN --region $AWS_REGION --query "Service.ServiceUrl" --output text)

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Service URL: https://$SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your frontend NEXT_PUBLIC_API_URL to: https://$SERVICE_URL"
echo "2. Configure CORS settings in App Runner if needed"
echo "3. Set up custom domain if desired"
echo "4. Monitor logs in CloudWatch"
echo ""
echo -e "${YELLOW}To check service health:${NC}"
echo "curl https://$SERVICE_URL/health"