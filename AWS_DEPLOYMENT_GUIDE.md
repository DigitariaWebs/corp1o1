# Corp101 AWS Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [Architecture Overview](#architecture-overview)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database Setup](#database-setup)
7. [Environment Variables Management](#environment-variables-management)
8. [Domain and SSL Setup](#domain-and-ssl-setup)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Cost Optimization](#cost-optimization)
12. [Security Best Practices](#security-best-practices)
13. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- AWS CLI installed and configured
- Node.js 18+ and npm 8+
- Git
- Docker (optional but recommended)
- Domain name (for production)

### AWS Services You'll Use
- **EC2** - Backend server hosting
- **S3** - Frontend static hosting
- **CloudFront** - CDN for frontend
- **RDS/DocumentDB** or **MongoDB Atlas** - Database
- **Route 53** - DNS management
- **Certificate Manager** - SSL certificates
- **Secrets Manager** - Environment variables
- **CloudWatch** - Monitoring
- **IAM** - Access management

## AWS Account Setup

### 1. Create AWS Account
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the registration process
4. Set up billing alerts:
   ```bash
   AWS Console → Billing → Billing preferences → Enable "Receive Billing Alerts"
   ```

### 2. Install AWS CLI
```bash
# macOS
brew install awscli

# Windows (using chocolatey)
choco install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 3. Configure AWS CLI
```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│    S3 Bucket    │     │   Route 53      │
│   (CDN)         │     │   (Frontend)    │     │   (DNS)         │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                                  │
         │                                                  │
         ▼                                                  ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Application     │────▶│    EC2/ECS      │────▶│ MongoDB Atlas/  │
│ Load Balancer   │     │   (Backend)     │     │ DocumentDB      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │ Secrets Manager │
                        │ (Env Variables) │
                        └─────────────────┘
```

## Backend Deployment

### Option 1: EC2 Deployment (Recommended for beginners)

#### Step 1: Launch EC2 Instance
```bash
# 1. Go to EC2 Dashboard
# 2. Click "Launch Instance"
# 3. Choose:
#    - Name: corp101-backend
#    - AMI: Amazon Linux 2023 or Ubuntu 22.04
#    - Instance type: t3.medium (for production) or t3.small (for testing)
#    - Key pair: Create new or use existing
#    - Network settings: 
#      - Allow SSH (port 22) from your IP
#      - Allow HTTP (port 80)
#      - Allow HTTPS (port 443)
#      - Allow Custom TCP (port 3001) for backend
#    - Storage: 20GB gp3
```

#### Step 2: Connect to EC2 Instance
```bash
# Download your .pem key file and set permissions
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ec2-user@your-ec2-public-ip
# Or for Ubuntu:
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

#### Step 3: Install Dependencies on EC2
```bash
# Update system
sudo yum update -y  # For Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # For Ubuntu

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -  # Amazon Linux
# OR
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -  # Ubuntu

sudo yum install -y nodejs  # Amazon Linux
# OR
sudo apt-get install -y nodejs  # Ubuntu

# Install Git
sudo yum install -y git  # Amazon Linux
# OR
sudo apt-get install -y git  # Ubuntu

# Install PM2 globally
sudo npm install -g pm2

# Install nginx (for reverse proxy)
sudo yum install -y nginx  # Amazon Linux
# OR
sudo apt-get install -y nginx  # Ubuntu
```

#### Step 4: Clone and Setup Backend
```bash
# Create app directory
sudo mkdir -p /var/www/corp101
sudo chown $USER:$USER /var/www/corp101
cd /var/www/corp101

# Clone repository
git clone https://github.com/your-username/corp1o1.git .
cd backend

# Install dependencies
npm install --production

# Create uploads and logs directories
mkdir -p uploads logs
```

#### Step 5: Configure Nginx
```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/corp101

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name your-domain.com api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/corp101 /etc/nginx/sites-enabled/
# OR for Amazon Linux:
sudo cp /etc/nginx/sites-available/corp101 /etc/nginx/conf.d/corp101.conf

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### Step 6: Setup PM2 Process Manager
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'corp101-backend',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

### Option 2: ECS Deployment (For Docker users)

#### Step 1: Create Dockerfile for Frontend
```bash
# Create frontend/Dockerfile
nano frontend/Dockerfile
```

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

#### Step 2: Build and Push Docker Images
```bash
# Build backend image
cd backend
docker build -t corp101-backend .

# Build frontend image
cd ../frontend
docker build -t corp101-frontend .

# Create ECR repositories
aws ecr create-repository --repository-name corp101-backend
aws ecr create-repository --repository-name corp101-frontend

# Login to ECR
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com

# Tag and push images
docker tag corp101-backend:latest your-account-id.dkr.ecr.your-region.amazonaws.com/corp101-backend:latest
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/corp101-backend:latest

docker tag corp101-frontend:latest your-account-id.dkr.ecr.your-region.amazonaws.com/corp101-frontend:latest
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/corp101-frontend:latest
```

## Frontend Deployment

### Step 1: Build Frontend Locally
```bash
cd frontend

# Create production .env
cp .env.local .env.production
nano .env.production
# Update NEXT_PUBLIC_API_URL to your backend URL
# NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Build the frontend
npm run build
```

### Step 2: Create S3 Bucket
```bash
# Create bucket
aws s3 mb s3://corp101-frontend-your-unique-name

# Enable static website hosting
aws s3 website s3://corp101-frontend-your-unique-name \
  --index-document index.html \
  --error-document error.html

# Create bucket policy file
nano bucket-policy.json
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::corp101-frontend-your-unique-name/*"
    }
  ]
}
```

```bash
# Apply bucket policy
aws s3api put-bucket-policy \
  --bucket corp101-frontend-your-unique-name \
  --policy file://bucket-policy.json
```

### Step 3: Deploy Frontend to S3
Since Next.js needs a Node.js server for SSR, we have two options:

#### Option A: Static Export (Limited features)
```bash
# Update next.config.mjs
nano next.config.mjs
```

```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // ... rest of your config
}
```

```bash
# Build and export
npm run build

# Sync to S3
aws s3 sync out/ s3://corp101-frontend-your-unique-name --delete
```

#### Option B: Deploy to Vercel/Amplify (Recommended for Next.js)
For full Next.js features, use AWS Amplify:

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize Amplify
amplify init
# Follow prompts

# Add hosting
amplify add hosting
# Choose: Hosting with Amplify Console
# Choose: Continuous deployment

# Push to Amplify
amplify push
```

### Step 4: Setup CloudFront CDN
```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name corp101-frontend-your-unique-name.s3-website-region.amazonaws.com \
  --default-root-object index.html
```

## Database Setup

### Option 1: MongoDB Atlas (Recommended)
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create account and cluster
3. Choose AWS as cloud provider
4. Select same region as your EC2
5. Whitelist your EC2 Elastic IP
6. Create database user
7. Get connection string

### Option 2: AWS DocumentDB
```bash
# Create DocumentDB cluster
aws docdb create-db-cluster \
  --db-cluster-identifier corp101-cluster \
  --engine docdb \
  --master-username admin \
  --master-user-password your-secure-password \
  --backup-retention-period 5 \
  --preferred-backup-window "07:00-09:00"
```

## Webhook Configuration for Clerk and MongoDB

### Clerk Webhook Setup on AWS

#### Step 1: Configure Clerk Webhook Endpoint
1. **Login to Clerk Dashboard**: https://dashboard.clerk.com
2. **Navigate to Webhooks**: Go to "Webhooks" in the left sidebar
3. **Create New Endpoint**:
   - Click "Add Endpoint"
   - **Endpoint URL**: `https://api.your-domain.com/api/webhooks/clerk`
   - **Events to listen**: Select these events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
4. **Copy the Signing Secret**: Save the `whsec_xxxxxxxxxxxxxxxxxx` secret

#### Step 2: Update AWS Secrets Manager
```bash
# Add Clerk webhook secret to your existing secrets
aws secretsmanager update-secret \
  --secret-id corp101/backend/production \
  --secret-string '{
    "NODE_ENV": "production",
    "PORT": "3001",
    "MONGODB_URI": "your-mongodb-connection-string",
    "JWT_SECRET": "your-super-secure-jwt-secret",
    "JWT_REFRESH_SECRET": "your-refresh-secret",
    "OPENAI_API_KEY": "your-openai-key",
    "CLERK_SECRET_KEY": "your-clerk-secret",
    "CLERK_WEBHOOK_SECRET": "whsec_your_actual_webhook_secret_here"
  }'
```

#### Step 3: Configure Security Groups for Webhooks
```bash
# Allow HTTPS traffic from Clerk's IP ranges
# Clerk uses these IP ranges for webhooks:
# - 3.5.140.0/22
# - 3.5.144.0/22
# - 52.70.0.0/15
# - 52.72.0.0/15

# Update your security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-your-security-group-id \
  --protocol tcp \
  --port 443 \
  --cidr 3.5.140.0/22

aws ec2 authorize-security-group-ingress \
  --group-id sg-your-security-group-id \
  --protocol tcp \
  --port 443 \
  --cidr 3.5.144.0/22

aws ec2 authorize-security-group-ingress \
  --group-id sg-your-security-group-id \
  --protocol tcp \
  --port 443 \
  --cidr 52.70.0.0/15

aws ec2 authorize-security-group-ingress \
  --group-id sg-your-security-group-id \
  --protocol tcp \
  --port 443 \
  --cidr 52.72.0.0/15
```

### MongoDB Atlas Webhooks and Change Streams

#### Option 1: MongoDB Atlas Webhooks (Recommended)
1. **Login to MongoDB Atlas**: https://cloud.mongodb.com
2. **Navigate to Data Services → Atlas Triggers**
3. **Create New Trigger**:
   - **Name**: `corp101-user-sync`
   - **Type**: Database Trigger
   - **Event Type**: Database
   - **Collection**: `users`
   - **Operation Type**: Insert, Update, Delete
   - **Function**:
   ```javascript
   exports = function(changeEvent) {
     const { operationType, fullDocument, documentKey } = changeEvent;
     
     // Send webhook to your AWS backend
     const webhookUrl = "https://api.your-domain.com/api/webhooks/mongodb";
     
     const payload = {
       operation: operationType,
       document: fullDocument,
       documentId: documentKey._id,
       timestamp: new Date().toISOString()
     };
     
     context.http.post({
       url: webhookUrl,
       headers: {
         "Content-Type": ["application/json"],
         "Authorization": ["Bearer your-webhook-secret"]
       },
       body: JSON.stringify(payload)
     });
   };
   ```

#### Option 2: MongoDB Change Streams (Application-level)
Create a change stream listener in your backend:

```bash
# Create change stream service
nano backend/services/changeStreamService.js
```

```javascript
const { MongoClient } = require('mongodb');

class ChangeStreamService {
  constructor() {
    this.client = null;
    this.db = null;
    this.changeStreams = new Map();
  }

  async initialize() {
    this.client = new MongoClient(process.env.MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db();
    console.log('✅ Change stream service initialized');
  }

  async startUserChangeStream() {
    const usersCollection = this.db.collection('users');
    
    const changeStream = usersCollection.watch([
      { $match: { operationType: { $in: ['insert', 'update', 'delete'] } } }
    ]);

    changeStream.on('change', async (change) => {
      console.log('📊 User change detected:', change.operationType);
      
      // Process the change
      await this.processUserChange(change);
    });

    changeStream.on('error', (error) => {
      console.error('❌ Change stream error:', error);
    });

    this.changeStreams.set('users', changeStream);
    console.log('👂 User change stream started');
  }

  async processUserChange(change) {
    try {
      const { operationType, fullDocument, documentKey } = change;
      
      // Send to external webhook if needed
      if (process.env.EXTERNAL_WEBHOOK_URL) {
        await this.sendWebhook({
          operation: operationType,
          document: fullDocument,
          documentId: documentKey._id,
          timestamp: new Date().toISOString()
        });
      }

      // Update analytics
      await this.updateAnalytics(change);
      
    } catch (error) {
      console.error('❌ Error processing user change:', error);
    }
  }

  async sendWebhook(payload) {
    const response = await fetch(process.env.EXTERNAL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }
  }

  async updateAnalytics(change) {
    // Update your analytics based on user changes
    console.log('📈 Analytics updated for user change');
  }

  async close() {
    for (const [name, stream] of this.changeStreams) {
      await stream.close();
      console.log(`🔇 ${name} change stream closed`);
    }
    
    if (this.client) {
      await this.client.close();
    }
  }
}

module.exports = new ChangeStreamService();
```

#### Step 4: Initialize Change Streams in Server
```bash
# Update server.js to include change streams
nano backend/server.js
```

Add this to your server.js after database connection:
```javascript
// Add after database connection
const changeStreamService = require('./services/changeStreamService');

// Initialize change streams after database connection
async function initializeChangeStreams() {
  try {
    await changeStreamService.initialize();
    await changeStreamService.startUserChangeStream();
    console.log('✅ Change streams initialized');
  } catch (error) {
    console.error('❌ Failed to initialize change streams:', error);
  }
}

// Call after database connection
initializeChangeStreams();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await changeStreamService.close();
  process.exit(0);
});
```

### Webhook Security on AWS

#### Step 1: Create Webhook Authentication Middleware
```bash
# Create webhook auth middleware
nano backend/middleware/webhookAuth.js
```

```javascript
const crypto = require('crypto');

// Verify webhook signatures
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !timestamp || !secret) {
    return res.status(401).json({ error: 'Missing webhook authentication' });
  }

  // Verify timestamp (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp);
  
  if (Math.abs(now - webhookTime) > 300) { // 5 minutes tolerance
    return res.status(401).json({ error: 'Webhook timestamp too old' });
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(timestamp + JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
};

module.exports = { verifyWebhookSignature };
```

#### Step 2: Create MongoDB Webhook Endpoint
```bash
# Create MongoDB webhook route
nano backend/routes/webhooks/mongodb.js
```

```javascript
const express = require('express');
const { verifyWebhookSignature } = require('../../middleware/webhookAuth');

const router = express.Router();

// MongoDB webhook endpoint
router.post('/mongodb', verifyWebhookSignature, async (req, res) => {
  try {
    const { operation, document, documentId, timestamp } = req.body;

    console.log(`📊 MongoDB webhook received: ${operation} for document ${documentId}`);

    // Process the change based on operation type
    switch (operation) {
      case 'insert':
        await handleDocumentInsert(document);
        break;
      case 'update':
        await handleDocumentUpdate(documentId, document);
        break;
      case 'delete':
        await handleDocumentDelete(documentId);
        break;
      default:
        console.log(`ℹ️ Unhandled operation: ${operation}`);
    }

    res.status(200).json({
      success: true,
      message: 'MongoDB webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ MongoDB webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

async function handleDocumentInsert(document) {
  // Handle new document creation
  console.log('📝 New document created:', document._id);
}

async function handleDocumentUpdate(documentId, document) {
  // Handle document updates
  console.log('✏️ Document updated:', documentId);
}

async function handleDocumentDelete(documentId) {
  // Handle document deletion
  console.log('🗑️ Document deleted:', documentId);
}

module.exports = router;
```

#### Step 3: Update Webhook Routes
```bash
# Update webhook index to include MongoDB routes
nano backend/routes/webhooks/index.js
```

```javascript
const express = require('express');
const clerkWebhookRouter = require('./clerk');
const mongodbWebhookRouter = require('./mongodb');

const router = express.Router();

// Clerk webhook routes
router.use('/', clerkWebhookRouter);

// MongoDB webhook routes
router.use('/', mongodbWebhookRouter);

module.exports = router;
```

### Testing Webhooks on AWS

#### Step 1: Test Clerk Webhook
```bash
# Test webhook endpoint
curl -X POST https://api.your-domain.com/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test-id" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test-signature" \
  -d '{"type": "user.created", "data": {"id": "test-user"}}'
```

#### Step 2: Test MongoDB Webhook
```bash
# Test MongoDB webhook endpoint
curl -X POST https://api.your-domain.com/api/webhooks/mongodb \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: your-signature" \
  -H "x-webhook-timestamp: $(date +%s)" \
  -d '{"operation": "insert", "document": {"_id": "test"}, "documentId": "test"}'
```

#### Step 3: Monitor Webhook Logs
```bash
# Check webhook logs on EC2
pm2 logs corp101-backend | grep webhook

# Or check CloudWatch logs
aws logs describe-log-groups --log-group-name-prefix corp101
```

### Why You Don't Need Ngrok on AWS

Unlike local development where you need ngrok to expose your local server to the internet, on AWS you have:

1. **Public IP Address**: Your EC2 instance has a public IP
2. **Domain Name**: You can use Route 53 to create a custom domain
3. **SSL Certificate**: AWS Certificate Manager provides free SSL
4. **Load Balancer**: Application Load Balancer handles traffic routing

**Local Development vs AWS Production:**

| Aspect | Local Development | AWS Production |
|--------|------------------|----------------|
| **URL** | `https://xxxxx.ngrok.io` | `https://api.your-domain.com` |
| **SSL** | Provided by ngrok | AWS Certificate Manager |
| **Stability** | Temporary, changes on restart | Permanent, stable |
| **Cost** | Free tier limited | Pay for resources used |
| **Security** | Basic | Enterprise-grade with WAF |

### Alternative to Ngrok for Development

If you need to test webhooks during development before deploying to AWS:

#### Option 1: AWS Application Load Balancer (Recommended)
```bash
# Create ALB for development testing
aws elbv2 create-load-balancer \
  --name corp101-dev-alb \
  --subnets subnet-12345 subnet-67890 \
  --security-groups sg-your-security-group

# Create target group
aws elbv2 create-target-group \
  --name corp101-dev-targets \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-your-vpc-id

# Register your local machine (if you have a public IP)
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:region:account:targetgroup/corp101-dev-targets \
  --targets Id=your-public-ip,Port=3001
```

#### Option 2: AWS API Gateway with Lambda
```bash
# Create API Gateway that forwards to your local development
# This is more complex but provides better control
```

#### Option 3: Use AWS Cloud9 for Development
```bash
# Create Cloud9 environment
aws cloud9 create-environment-ec2 \
  --name corp101-dev \
  --instance-type t3.micro \
  --automatic-stop-time-minutes 30

# This gives you a cloud-based development environment
# with a public URL that can receive webhooks
```

### Webhook URL Configuration Summary

**For Production on AWS:**
- **Clerk Webhook URL**: `https://api.your-domain.com/api/webhooks/clerk`
- **MongoDB Webhook URL**: `https://api.your-domain.com/api/webhooks/mongodb`

**For Development:**
- **Option 1**: Use ngrok temporarily: `https://xxxxx.ngrok.io/api/webhooks/clerk`
- **Option 2**: Deploy to AWS staging environment: `https://staging-api.your-domain.com/api/webhooks/clerk`
- **Option 3**: Use Cloud9 development environment: `https://xxxxx.vfs.cloud9.region.amazonaws.com/api/webhooks/clerk`

## Environment Variables Management

### Step 1: Create Secrets in AWS Secrets Manager
```bash
# Create backend secrets
aws secretsmanager create-secret \
  --name corp101/backend/production \
  --description "Corp101 Backend Production Secrets" \
  --secret-string '{
    "NODE_ENV": "production",
    "PORT": "3001",
    "MONGODB_URI": "your-mongodb-connection-string",
    "JWT_SECRET": "your-super-secure-jwt-secret",
    "JWT_REFRESH_SECRET": "your-refresh-secret",
    "OPENAI_API_KEY": "your-openai-key",
    "CLERK_SECRET_KEY": "your-clerk-secret",
    "CLERK_WEBHOOK_SECRET": "your-clerk-webhook-secret"
  }'
```

### Step 2: Create .env file on EC2
```bash
cd /var/www/corp101/backend

# Create .env file
nano .env

# Add all environment variables from your local .env
# But update values for production:
# - MONGODB_URI: Your production MongoDB connection
# - NODE_ENV: production
# - FRONTEND_URL: https://your-domain.com
# - Remove any test/development keys
```

### Step 3: Load Secrets in Application
```bash
# Install AWS SDK
npm install aws-sdk

# Create secrets loader
nano load-secrets.js
```

```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'your-region' });

async function loadSecrets() {
  try {
    const data = await secretsManager.getSecretValue({
      SecretId: 'corp101/backend/production'
    }).promise();
    
    const secrets = JSON.parse(data.SecretString);
    Object.assign(process.env, secrets);
  } catch (error) {
    console.error('Failed to load secrets:', error);
  }
}

module.exports = loadSecrets;
```

## Domain and SSL Setup

### Step 1: Register Domain
1. Use Route 53 or your preferred registrar
2. If using external registrar, update nameservers to Route 53

### Step 2: Create Route 53 Hosted Zone
```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name your-domain.com \
  --caller-reference $(date +%s)
```

### Step 3: Request SSL Certificate
```bash
# Request certificate for domain
aws acm request-certificate \
  --domain-name your-domain.com \
  --subject-alternative-names "*.your-domain.com" \
  --validation-method DNS
```

### Step 4: Configure SSL on Load Balancer
```bash
# Create Application Load Balancer
# 1. Go to EC2 → Load Balancers
# 2. Create Application Load Balancer
# 3. Configure:
#    - Name: corp101-alb
#    - Scheme: Internet-facing
#    - Listeners: HTTPS (443) and HTTP (80)
#    - Certificate: Select the one you created
#    - Target group: Your EC2 instances
```

## CI/CD Pipeline

### GitHub Actions Setup
```bash
# Create .github/workflows/deploy.yml
mkdir -p .github/workflows
nano .github/workflows/deploy.yml
```

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /var/www/corp101
            git pull origin main
            cd backend
            npm install --production
            pm2 restart corp101-backend

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
          
      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'frontend/out'
```

### Add GitHub Secrets
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:
   - `EC2_HOST`: Your EC2 public IP
   - `EC2_USER`: ec2-user or ubuntu
   - `EC2_SSH_KEY`: Your private key content
   - `S3_BUCKET`: Your S3 bucket name
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

## Monitoring and Logging

### Step 1: Setup CloudWatch
```bash
# Install CloudWatch agent on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### Step 2: Create CloudWatch Dashboard
```bash
# Create dashboard via AWS Console
# Monitor:
# - CPU utilization
# - Memory usage
# - Network traffic
# - Application logs
# - Error rates
# - Response times
```

### Step 3: Setup Alarms
```bash
# Create CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name corp101-high-cpu \
  --alarm-description "Alarm when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=InstanceId,Value=your-instance-id \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:region:account-id:topic-name
```

## Cost Optimization

### 1. Use AWS Free Tier
- EC2 t2.micro: 750 hours/month
- S3: 5GB storage
- CloudFront: 50GB transfer
- RDS: 750 hours db.t2.micro

### 2. Reserved Instances
For production, buy reserved instances for 1-3 years to save up to 72%

### 3. Auto Scaling
```bash
# Create Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name corp101-asg \
  --launch-template LaunchTemplateName=corp101-template \
  --min-size 1 \
  --max-size 5 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:region:account-id:targetgroup/corp101-tg
```

### 4. Use Spot Instances for Development
Save up to 90% on development environments

## Webhook Security Best Practices

### 1. Webhook Authentication
```bash
# Create webhook-specific IAM role
aws iam create-role \
  --role-name Corp101WebhookRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "ec2.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Attach policy for webhook secrets access
aws iam attach-role-policy \
  --role-name Corp101WebhookRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

### 2. Webhook Rate Limiting
```bash
# Create rate limiting middleware
nano backend/middleware/rateLimiter.js
```

```javascript
const rateLimit = require('express-rate-limit');

// Webhook-specific rate limiting
const webhookRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many webhook requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for webhook endpoints
const strictWebhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: {
    error: 'Webhook rate limit exceeded'
  }
});

module.exports = { webhookRateLimit, strictWebhookRateLimit };
```

### 3. Webhook IP Whitelisting
```bash
# Create IP whitelist middleware
nano backend/middleware/ipWhitelist.js
```

```javascript
// Whitelist known webhook IPs
const allowedIPs = [
  // Clerk webhook IPs (these are examples, get actual IPs from Clerk)
  '3.5.140.0/22',
  '3.5.144.0/22',
  '52.70.0.0/15',
  '52.72.0.0/15',
  // MongoDB Atlas IPs (if using Atlas webhooks)
  '0.0.0.0/0' // Be more specific in production
];

const ipWhitelist = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Check if IP is in whitelist
  const isAllowed = allowedIPs.some(allowedIP => {
    if (allowedIP.includes('/')) {
      // CIDR notation
      return isIPInCIDR(clientIP, allowedIP);
    } else {
      // Single IP
      return clientIP === allowedIP;
    }
  });

  if (!isAllowed) {
    console.log(`🚫 Blocked webhook request from IP: ${clientIP}`);
    return res.status(403).json({ error: 'IP not allowed' });
  }

  next();
};

// Helper function to check CIDR
function isIPInCIDR(ip, cidr) {
  // Implementation for CIDR checking
  // You can use a library like 'ip-cidr' for this
  return true; // Simplified for example
}

module.exports = { ipWhitelist };
```

### 4. Webhook Request Validation
```bash
# Create webhook validation middleware
nano backend/middleware/webhookValidation.js
```

```javascript
const Joi = require('joi');

// Clerk webhook validation schema
const clerkWebhookSchema = Joi.object({
  id: Joi.string().required(),
  object: Joi.string().valid('event').required(),
  type: Joi.string().valid('user.created', 'user.updated', 'user.deleted').required(),
  data: Joi.object({
    id: Joi.string().required(),
    email_addresses: Joi.array().items(Joi.object({
      email_address: Joi.string().email().required()
    })).optional(),
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional()
  }).required(),
  created_at: Joi.number().required()
});

// MongoDB webhook validation schema
const mongodbWebhookSchema = Joi.object({
  operation: Joi.string().valid('insert', 'update', 'delete').required(),
  document: Joi.object().optional(),
  documentId: Joi.string().required(),
  timestamp: Joi.string().isoDate().required()
});

const validateWebhook = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      console.log('❌ Webhook validation failed:', error.details);
      return res.status(400).json({
        error: 'Invalid webhook payload',
        details: error.details
      });
    }
    
    next();
  };
};

module.exports = {
  validateClerkWebhook: validateWebhook(clerkWebhookSchema),
  validateMongoDBWebhook: validateWebhook(mongodbWebhookSchema)
};
```

### 5. Webhook Logging and Monitoring
```bash
# Create webhook logging service
nano backend/services/webhookLogger.js
```

```javascript
const winston = require('winston');

// Create webhook-specific logger
const webhookLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'webhook' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/webhook-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/webhook-combined.log' 
    })
  ]
});

// Log webhook events
const logWebhookEvent = (eventType, data, success = true) => {
  const logData = {
    eventType,
    timestamp: new Date().toISOString(),
    success,
    data: success ? data : { error: data }
  };

  if (success) {
    webhookLogger.info('Webhook event processed', logData);
  } else {
    webhookLogger.error('Webhook event failed', logData);
  }
};

module.exports = { logWebhookEvent };
```

### 6. Webhook Retry and Dead Letter Queue
```bash
# Create webhook retry service
nano backend/services/webhookRetry.js
```

```javascript
const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

class WebhookRetryService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async processWebhookWithRetry(webhookData, endpoint) {
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      try {
        const response = await this.sendWebhook(webhookData, endpoint);
        
        if (response.ok) {
          console.log(`✅ Webhook sent successfully on attempt ${attempts + 1}`);
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        attempts++;
        console.log(`❌ Webhook attempt ${attempts} failed:`, error.message);
        
        if (attempts >= this.maxRetries) {
          // Send to dead letter queue
          await this.sendToDeadLetterQueue(webhookData, endpoint, error);
          throw error;
        }
        
        // Wait before retry
        await this.delay(this.retryDelay * attempts);
      }
    }
  }

  async sendWebhook(data, endpoint) {
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Corp101-Webhook/1.0'
      },
      body: JSON.stringify(data),
      timeout: 10000 // 10 second timeout
    });
  }

  async sendToDeadLetterQueue(webhookData, endpoint, error) {
    const message = {
      webhookData,
      endpoint,
      error: error.message,
      timestamp: new Date().toISOString(),
      attempts: this.maxRetries
    };

    // Send to SQS dead letter queue
    await sqs.sendMessage({
      QueueUrl: process.env.DEAD_LETTER_QUEUE_URL,
      MessageBody: JSON.stringify(message)
    }).promise();

    console.log('📮 Webhook sent to dead letter queue');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WebhookRetryService();
```

## Security Best Practices

### 1. IAM Roles and Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "secretsmanager:GetSecretValue",
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. Security Groups
- Backend: Only allow 3001 from ALB
- Database: Only allow 27017 from backend
- ALB: Allow 80/443 from anywhere

### 3. Enable AWS WAF
Protect against common web exploits

### 4. Regular Updates
```bash
# Create update script
nano /home/ec2-user/update.sh

#!/bin/bash
sudo yum update -y
cd /var/www/corp101/backend
npm audit fix
pm2 restart all
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Backend Not Starting
```bash
# Check logs
pm2 logs
tail -f /var/www/corp101/backend/logs/error.log

# Check port availability
sudo netstat -tlnp | grep 3001

# Check environment variables
pm2 env 0
```

#### 2. Database Connection Issues
```bash
# Test MongoDB connection
mongo "your-connection-string" --eval "db.adminCommand('ping')"

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxxx
```

#### 3. Frontend 404 Errors
```bash
# For SPA routing, create error page redirect
aws s3api put-bucket-website \
  --bucket your-bucket \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'
```

#### 4. SSL Certificate Issues
```bash
# Verify certificate
aws acm describe-certificate --certificate-arn your-cert-arn

# Check DNS validation
nslookup _validation-record.your-domain.com
```

### Health Checks
```bash
# Backend health check
curl https://api.your-domain.com/health

# Check all services
pm2 status
sudo systemctl status nginx
```

## Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] SSL certificates installed and working
- [ ] Backups configured (database and files)
- [ ] Monitoring and alerts set up
- [ ] Security groups properly configured
- [ ] Auto-scaling configured
- [ ] Load testing completed
- [ ] Disaster recovery plan in place
- [ ] Documentation updated
- [ ] Team trained on deployment procedures

## Support Resources

- AWS Documentation: https://docs.aws.amazon.com
- AWS Support: https://console.aws.amazon.com/support
- Community Forums: https://forums.aws.amazon.com
- Stack Overflow: https://stackoverflow.com/questions/tagged/amazon-web-services

## Next Steps

1. Set up staging environment
2. Implement blue-green deployments
3. Add ElasticSearch for better search
4. Implement Redis caching
5. Set up CDN for backend API
6. Add APM (Application Performance Monitoring)

Remember: Start small, test thoroughly, and scale gradually. Good luck with your deployment! 🚀