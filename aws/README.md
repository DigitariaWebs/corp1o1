# AWS Deployment for Corp1o1 Full-Stack Application

This directory contains all the necessary files and scripts to deploy your Corp1o1 application to AWS using App Runner and ECR.

## 📁 Directory Structure

```
aws/
├── README.md                           # This file - deployment overview
├── DEPLOYMENT_GUIDE.md                # Comprehensive deployment guide
├── POST_DEPLOYMENT_CHECKLIST.md       # Post-deployment verification checklist
├── TROUBLESHOOTING_GUIDE.md          # Common issues and solutions
├── deploy.sh                          # Full-featured deployment script
├── deploy-cloudshell.sh               # Simplified CloudShell deployment script
├── apprunner-backend.yaml             # App Runner configuration for backend
└── apprunner-frontend.yaml            # App Runner configuration for frontend
```

## 🚀 Quick Start

### Prerequisites
- AWS Account with appropriate permissions
- AWS CloudShell access
- Docker installed and running
- Your application code ready for deployment

### Automated Deployment (Recommended)

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

The script will:
- Create ECR repositories
- Build and push Docker images
- Set up AWS Secrets Manager
- Deploy services to App Runner
- Provide you with service URLs

## 📋 What Each File Does

### `deploy-cloudshell.sh`
- **Purpose:** Main deployment script optimized for AWS CloudShell
- **What it does:** Automates the entire deployment process
- **When to use:** For initial deployment and updates
- **Features:** Step-by-step progress, error handling, automatic cleanup

### `deploy.sh`
- **Purpose:** Full-featured deployment script with advanced features
- **What it does:** Comprehensive deployment with detailed logging and error handling
- **When to use:** For production deployments requiring detailed control
- **Features:** Color-coded output, comprehensive error handling, rollback support

### `apprunner-backend.yaml`
- **Purpose:** App Runner configuration template for backend service
- **What it does:** Defines how the backend service should be configured
- **When to use:** For custom App Runner configurations
- **Features:** Environment variables, secrets integration, resource allocation

### `apprunner-frontend.yaml`
- **Purpose:** App Runner configuration template for frontend service
- **What it does:** Defines how the frontend service should be configured
- **When to use:** For custom App Runner configurations
- **Features:** Environment variables, secrets integration, resource allocation

### `DEPLOYMENT_GUIDE.md`
- **Purpose:** Comprehensive step-by-step deployment instructions
- **What it does:** Provides detailed manual deployment steps
- **When to use:** When you need to understand each step or troubleshoot issues
- **Features:** Manual commands, troubleshooting tips, configuration examples

### `POST_DEPLOYMENT_CHECKLIST.md`
- **Purpose:** Verification checklist after deployment
- **What it does:** Ensures your application is working correctly
- **When to use:** After deployment to verify everything is working
- **Features:** Comprehensive checklist, testing procedures, monitoring setup

### `TROUBLESHOOTING_GUIDE.md`
- **Purpose:** Common issues and their solutions
- **What it does:** Helps you resolve deployment and runtime problems
- **When to use:** When you encounter issues during deployment or operation
- **Features:** Problem-solution pairs, debugging commands, emergency procedures

## 🔧 Manual Deployment Steps

If you prefer manual control or need to troubleshoot, follow the detailed steps in `DEPLOYMENT_GUIDE.md`.

## 🛠️ Configuration

### Environment Variables
The deployment scripts will prompt you to set up environment variables in AWS Secrets Manager:

- `MONGODB_URI` - Your MongoDB connection string
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Your Clerk webhook secret
- `CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `JWT_SECRET` - Your JWT secret
- `OPENAI_API_KEY` - Your OpenAI API key (if applicable)

### AWS Services Used
- **ECR (Elastic Container Registry):** Stores your Docker images
- **App Runner:** Hosts your containerized applications
- **Secrets Manager:** Securely stores sensitive configuration
- **CloudWatch:** Provides logging and monitoring
- **IAM:** Manages permissions and access control

## 📊 Monitoring and Maintenance

### Health Checks
- Backend health endpoint: `GET /health`
- Frontend health check: Automatic App Runner health checks

### Logs
- App Runner logs are automatically sent to CloudWatch
- Access logs and application logs are available
- Use the troubleshooting guide for log analysis

### Updates
To update your application:

1. **Build new images:**
   ```bash
   cd backend && docker build -t corp1o1-backend:latest .
   cd ../frontend && docker build -t corp1o1-frontend:latest .
   ```

2. **Push to ECR:**
   ```bash
   # Tag and push backend
   docker tag corp1o1-backend:latest \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-backend:latest
   docker push \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-backend:latest

   # Tag and push frontend
   docker tag corp1o1-frontend:latest \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-frontend:latest
   docker push \
       $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-frontend:latest
   ```

3. **Update App Runner services:**
   ```bash
   # Update backend
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

   # Update frontend
   aws apprunner update-service \
       --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-frontend-service" \
       --source-configuration "{
           \"ImageRepository\": {
               \"ImageIdentifier\": \"$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com/corp1o1-frontend:latest\",
               \"ImageConfiguration\": {
                   \"Port\": \"3000\"
               },
               \"ImageRepositoryType\": \"ECR\"
           }
       }"
   ```

## 🔐 Security Considerations

### Secrets Management
- All sensitive data is stored in AWS Secrets Manager
- Secrets are automatically rotated and encrypted
- Access to secrets is controlled via IAM policies

### Network Security
- App Runner provides HTTPS by default
- CORS is configured for production domains only
- Rate limiting is enabled to prevent abuse

### Access Control
- Use IAM roles with minimal required permissions
- Enable CloudTrail for audit logging
- Regularly review and update access policies

## 💰 Cost Optimization

### App Runner
- Choose appropriate instance sizes (start with 1 vCPU, 2GB RAM)
- Monitor usage and scale as needed
- Use auto-scaling for variable workloads

### ECR
- Clean up old images regularly
- Use image lifecycle policies
- Monitor storage costs

### Secrets Manager
- Only store necessary secrets
- Use appropriate rotation schedules
- Monitor API call costs

## 🆘 Getting Help

### Documentation
- **AWS App Runner:** [docs.aws.amazon.com/apprunner](https://docs.aws.amazon.com/apprunner/)
- **AWS ECR:** [docs.aws.amazon.com/ecr](https://docs.aws.amazon.com/ecr/)
- **AWS Secrets Manager:** [docs.aws.amazon.com/secretsmanager](https://docs.aws.amazon.com/secretsmanager/)

### Support
- **AWS Support:** Use the AWS Console Support Center
- **Community:** AWS Developer Forums and Stack Overflow
- **Issues:** Check the troubleshooting guide first

### Emergency Procedures
If your application is down:

1. **Check service status:**
   ```bash
   aws apprunner describe-service --service-name corp1o1-backend-service
   aws apprunner describe-service --service-name corp1o1-frontend-service
   ```

2. **Check logs for errors:**
   ```bash
   aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner"
   ```

3. **Restart services if needed:**
   ```bash
   # The deployment scripts include restart procedures
   ./aws/deploy-cloudshell.sh
   ```

## 📝 Notes

- **Region:** The deployment scripts use your configured AWS region
- **Account ID:** Automatically detected from your AWS credentials
- **Service Names:** Follow the pattern `corp1o1-backend-service` and `corp1o1-frontend-service`
- **Repository Names:** Follow the pattern `corp1o1-backend` and `corp1o1-frontend`

## 🔄 Version History

- **v1.0.0:** Initial deployment configuration
- **v1.1.0:** Added troubleshooting guide and post-deployment checklist
- **v1.2.0:** Enhanced deployment scripts with better error handling

---

**Remember:** Always test your deployment in a development environment first. Keep backups of working configurations and document any customizations you make.
