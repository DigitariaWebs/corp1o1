#!/bin/bash
set -euo pipefail

# AWS Configuration
AWS_ACCOUNT_ID="876493681859"
AWS_REGION="us-east-1"
ECR_REPOSITORY="corp1o1-frontend"
APP_NAME="corp1o1-frontend"
SERVICE_NAME="corp1o1-frontend-service"

# Backend API URL (update this with your backend App Runner URL)
BACKEND_API_URL="https://qyua5ihzzj.us-east-1.awsapprunner.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Corp1o1 Frontend Deployment to AWS...${NC}"
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "Backend API URL: $BACKEND_API_URL"

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
if [ ! -f "frontend/Dockerfile" ]; then
    echo -e "${RED}Error: frontend/Dockerfile not found. Please run this script from the project root directory.${NC}"
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

# Update Next.js configuration for standalone output
echo -e "${YELLOW}Ensuring Next.js standalone output is enabled...${NC}"
cd frontend

# Check if next.config.mjs has standalone output enabled
if ! grep -q "output: 'standalone'" next.config.mjs; then
    echo -e "${YELLOW}Updating next.config.mjs for standalone output...${NC}"
    # This is a simple check - you may need to manually update next.config.mjs
    echo -e "${RED}Please ensure next.config.mjs has 'output: 'standalone'' in the configuration.${NC}"
fi

# Load Clerk publishable key from .env file if available
if [ -f ".env" ]; then
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$(grep "^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" .env | cut -d '=' -f2- || true)
    if [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ] && [ -f ".env.local" ]; then
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$(grep "^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" .env.local | cut -d '=' -f2- || true)
    fi
fi

# Export for use in docker build
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Build Docker image with build args
echo -e "${YELLOW}Building Docker image with production environment variables...${NC}"
docker build \
    --build-arg NEXT_PUBLIC_API_URL=$BACKEND_API_URL \
    --build-arg NEXT_PUBLIC_API_BASE_URL=$BACKEND_API_URL/api \
    --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" \
    --build-arg NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in" \
    --build-arg NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up" \
    -t $ECR_REPOSITORY:latest .

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

# Check if .env.local file exists for frontend secrets
if [ -f "frontend/.env.local" ] || [ -f "frontend/.env" ]; then
    echo -e "${YELLOW}Reading environment variables from frontend/.env files...${NC}"
    
    # Try .env.local first, then .env
    ENV_FILE="frontend/.env.local"
    [ ! -f "$ENV_FILE" ] && ENV_FILE="frontend/.env"
    
    # Extract Clerk secret if present
    CLERK_SECRET_KEY=$(grep "^CLERK_SECRET_KEY=" $ENV_FILE 2>/dev/null | cut -d '=' -f2- || true)
    
    # Create secrets if values are found
    [ -n "$CLERK_SECRET_KEY" ] && create_or_update_secret "corp1o1/frontend-clerk-secret-key" "$CLERK_SECRET_KEY"
else
    echo -e "${YELLOW}Warning: frontend environment files not found. Secrets will need to be created manually if needed.${NC}"
fi

# Check if App Runner service exists
echo -e "${YELLOW}Checking if App Runner service exists...${NC}"
SERVICE_ARN=$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text 2>/dev/null)

if [ -z "$SERVICE_ARN" ]; then
    # Create App Runner service
    echo -e "${YELLOW}Creating App Runner service...${NC}"
    
    # Create service role if it doesn't exist
    ROLE_NAME="AppRunnerECRAccessRoleFrontend"
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
    
    # Create instance role for App Runner if using secrets
    INSTANCE_ROLE_NAME="AppRunnerInstanceRoleFrontend"
    INSTANCE_ROLE_ARN=""
    
    # Only create instance role if we have secrets to manage
    if [ -n "${CLERK_SECRET_KEY:-}" ]; then
        if ! aws iam get-role --role-name $INSTANCE_ROLE_NAME &>/dev/null; then
            echo "Creating IAM instance role for App Runner..."
            
            # Create trust policy for instance role
            cat > instance-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "tasks.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
            
            # Create instance role
            aws iam create-role --role-name $INSTANCE_ROLE_NAME --assume-role-policy-document file://instance-trust-policy.json
            
            # Create policy for Secrets Manager access
            cat > secrets-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:corp1o1/frontend-*"
      ]
    }
  ]
}
EOF
            
            # Create and attach the policy
            aws iam put-role-policy --role-name $INSTANCE_ROLE_NAME --policy-name SecretsManagerAccess --policy-document file://secrets-policy.json
            
            rm instance-trust-policy.json secrets-policy.json
            
            # Wait for role to be available
            sleep 10
        fi
        
        INSTANCE_ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/$INSTANCE_ROLE_NAME"
    fi
    
    # Create App Runner configuration
    if [ -n "$INSTANCE_ROLE_ARN" ]; then
        # Configuration with instance role and secrets
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
                    "HOSTNAME": "0.0.0.0",
                    "NEXT_PUBLIC_API_URL": "$BACKEND_API_URL",
                    "NEXT_PUBLIC_API_BASE_URL": "$BACKEND_API_URL/api"
                },
                "RuntimeEnvironmentSecrets": {
                    "CLERK_SECRET_KEY": "arn:aws:secretsmanager:$AWS_REGION:$AWS_ACCOUNT_ID:secret:corp1o1/frontend-clerk-secret-key"
                }
            },
            "ImageRepositoryType": "ECR"
        }
    },
    "HealthCheckConfiguration": {
        "Protocol": "HTTP",
        "Path": "/",
        "Interval": 20,
        "Timeout": 5,
        "HealthyThreshold": 1,
        "UnhealthyThreshold": 3
    },
    "InstanceConfiguration": {
        "Cpu": "0.5 vCPU",
        "Memory": "1 GB",
        "InstanceRoleArn": "$INSTANCE_ROLE_ARN"
    }
}
EOF
    else
        # Configuration without instance role (no secrets)
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
                    "HOSTNAME": "0.0.0.0",
                    "NEXT_PUBLIC_API_URL": "$BACKEND_API_URL",
                    "NEXT_PUBLIC_API_BASE_URL": "$BACKEND_API_URL/api"
                }
            },
            "ImageRepositoryType": "ECR"
        }
    },
    "HealthCheckConfiguration": {
        "Protocol": "HTTP",
        "Path": "/",
        "Interval": 20,
        "Timeout": 5,
        "HealthyThreshold": 1,
        "UnhealthyThreshold": 3
    },
    "InstanceConfiguration": {
        "Cpu": "0.5 vCPU",
        "Memory": "1 GB"
    }
}
EOF
    fi
    
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
echo -e "${GREEN}Frontend URL: https://$SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Test your frontend at: https://$SERVICE_URL"
echo "2. Update Clerk settings with the production URL if needed"
echo "3. Configure custom domain if desired"
echo "4. Monitor logs in CloudWatch"
echo ""
echo -e "${YELLOW}Important URLs:${NC}"
echo "Frontend: https://$SERVICE_URL"
echo "Backend API: $BACKEND_API_URL"