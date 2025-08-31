# Troubleshooting Guide for Corp1o1 AWS Deployment

This guide helps you resolve common issues encountered during deployment and operation.

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

### 1. Docker Build Failures

#### Issue: Build fails with dependency errors
**Symptoms:**
- `npm ci` fails
- Missing dependencies
- Version conflicts

**Solutions:**
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

#### Issue: Build fails with permission errors
**Symptoms:**
- Permission denied errors
- User creation failures

**Solutions:**
```bash
# Check Dockerfile user creation
# Ensure proper user setup in Dockerfile

# Build with different user if needed
docker build --build-arg USER_ID=1000 --build-arg GROUP_ID=1000 -t corp1o1-backend:latest .
```

### 2. ECR Push Failures

#### Issue: Authentication failed
**Symptoms:**
- `unauthorized: authentication required`
- Login token expired

**Solutions:**
```bash
# Re-login to ECR
aws ecr get-login-password --region $(aws configure get region) | \
docker login --username AWS --password-stdin \
$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$(aws configure get region).amazonaws.com

# Verify credentials
aws sts get-caller-identity
```

#### Issue: Repository doesn't exist
**Symptoms:**
- `repository not found`
- Push fails

**Solutions:**
```bash
# Create repository
aws ecr create-repository \
    --repository-name corp1o1-backend \
    --region $(aws configure get region)

# List repositories to verify
aws ecr describe-repositories
```

### 3. App Runner Deployment Issues

#### Issue: Service creation fails
**Symptoms:**
- Service creation timeout
- Invalid configuration errors

**Solutions:**
```bash
# Check service configuration
aws apprunner describe-service --service-name corp1o1-backend-service

# Verify image URI is correct
aws ecr describe-images --repository-name corp1o1-backend

# Check IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name $(aws sts get-caller-identity --query UserId --output text)
```

#### Issue: Service stuck in "Creating" state
**Symptoms:**
- Service never reaches "Running" state
- Long creation times

**Solutions:**
```bash
# Wait for service creation
aws apprunner wait service-created \
    --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-backend-service"

# Check for errors in CloudWatch
aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner"
```

### 4. Application Runtime Issues

#### Issue: Health check fails
**Symptoms:**
- Health endpoint returns errors
- Service marked as unhealthy

**Solutions:**
```bash
# Test health endpoint directly
curl https://your-backend-url/health

# Check application logs
aws logs filter-log-events \
    --log-group-name "/aws/apprunner/corp1o1-backend-service" \
    --filter-pattern "ERROR"

# Verify environment variables
aws apprunner describe-service --service-name corp1o1-backend-service
```

#### Issue: Database connection fails
**Symptoms:**
- MongoDB connection errors
- Database timeout errors

**Solutions:**
```bash
# Check MongoDB URI in secrets
aws secretsmanager get-secret-value --secret-id corp1o1/mongodb-uri

# Verify MongoDB Atlas connectivity
# Check IP whitelist in MongoDB Atlas
# Verify connection string format

# Test connection locally
mongosh "your_mongodb_connection_string"
```

#### Issue: Clerk webhook not working
**Symptoms:**
- Webhook events not received
- User data not syncing

**Solutions:**
```bash
# Verify webhook URL in Clerk dashboard
# Check webhook secret matches
# Test webhook endpoint directly

# Check webhook logs
aws logs filter-log-events \
    --log-group-name "/aws/apprunner/corp1o1-backend-service" \
    --filter-pattern "webhook"

# Verify webhook endpoint is accessible
curl -X POST https://your-backend-url/webhooks/clerk \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
```

### 5. Frontend Issues

#### Issue: Frontend not loading
**Symptoms:**
- White screen
- JavaScript errors
- Static assets not loading

**Solutions:**
```bash
# Check browser console for errors
# Verify environment variables are set
# Check API URL configuration

# Test API connectivity
curl https://your-backend-url/health

# Verify CORS configuration
curl -H "Origin: https://your-frontend-url" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: X-Requested-With" \
    -X OPTIONS https://your-backend-url/health
```

#### Issue: Authentication not working
**Symptoms:**
- Clerk components not loading
- Sign-in/sign-up fails

**Solutions:**
```bash
# Verify Clerk keys in secrets
aws secretsmanager get-secret-value --secret-id corp1o1/clerk-publishable-key

# Check Clerk dashboard configuration
# Verify domain is whitelisted
# Check API keys are correct
```

### 6. Performance Issues

#### Issue: Slow response times
**Symptoms:**
- High latency
- Timeout errors
- Slow page loads

**Solutions:**
```bash
# Check App Runner metrics
aws cloudwatch get-metric-statistics \
    --namespace "AWS/AppRunner" \
    --metric-name "CPUUtilization" \
    --dimensions Name=ServiceName,Value=corp1o1-backend-service \
    --start-time $(date -d '1 hour ago' --iso-8601=seconds) \
    --end-time $(date --iso-8601=seconds) \
    --period 300 \
    --statistics Average

# Check database performance
# Verify indexes are created
# Check query performance
```

#### Issue: High resource usage
**Symptoms:**
- High CPU/memory usage
- Service scaling issues

**Solutions:**
```bash
# Check current instance configuration
aws apprunner describe-service --service-name corp1o1-backend-service

# Scale up if needed
aws apprunner update-service \
    --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-backend-service" \
    --instance-configuration "{
        \"Cpu\": \"2048\",
        \"Memory\": \"4096\"
    }"
```

## 🛠️ Debugging Commands

### Service Status
```bash
# Check all App Runner services
aws apprunner list-services

# Get detailed service information
aws apprunner describe-service --service-name corp1o1-backend-service

# Check service logs
aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner"
```

### ECR Status
```bash
# List repositories
aws ecr describe-repositories

# List images in repository
aws ecr describe-images --repository-name corp1o1-backend

# Get image details
aws ecr describe-images --repository-name corp1o1-backend --image-ids imageTag=latest
```

### Secrets Status
```bash
# List secrets
aws secretsmanager list-secrets --filters Key=name,Values=corp1o1

# Get secret value (be careful with sensitive data)
aws secretsmanager get-secret-value --secret-id corp1o1/mongodb-uri
```

### CloudWatch Logs
```bash
# List log groups
aws logs describe-log-groups

# Filter logs for errors
aws logs filter-log-events \
    --log-group-name "/aws/apprunner/corp1o1-backend-service" \
    --filter-pattern "ERROR"

# Get recent log events
aws logs get-log-events \
    --log-group-name "/aws/apprunner/corp1o1-backend-service" \
    --log-stream-name "latest" \
    --limit 100
```

## 🔧 Configuration Fixes

### Environment Variables
```bash
# Update service with new environment variables
aws apprunner update-service \
    --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-backend-service" \
    --environment-variables "{
        \"NODE_ENV\": \"production\",
        \"PORT\": \"3000\"
    }"
```

### Secrets Integration
```bash
# Update service with new secrets
aws apprunner update-service \
    --service-arn "arn:aws:apprunner:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):service/corp1o1-backend-service" \
    --secrets "{
        \"MONGODB_URI\": {
            \"ValueFrom\": \"arn:aws:secretsmanager:$(aws configure get region):$(aws sts get-caller-identity --query Account --output text):secret:corp1o1/mongodb-uri\"
        }
    }"
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

**Remember:** Always test fixes in a development environment before applying to production. Keep backups of working configurations and document all changes made during troubleshooting.
