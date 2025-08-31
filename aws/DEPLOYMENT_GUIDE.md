# AWS Deployment Guide for Corp1o1 Full-Stack Application

This guide provides step-by-step instructions for deploying your Corp1o1 application to AWS using App Runner and ECR.

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
