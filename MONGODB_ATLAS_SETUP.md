# MongoDB Atlas Setup Guide for Corp101

## 🚀 Quick Setup Steps

### Step 1: Login to MongoDB Atlas
1. Go to https://cloud.mongodb.com
2. Login with your credentials
3. Select your project/organization

### Step 2: Configure Network Access (CRITICAL!)
This is the most common cause of connection failures.

1. **Navigate to Network Access**:
   - In the left sidebar, click **"Network Access"**

2. **Add IP Address**:
   - Click the **"+ ADD IP ADDRESS"** button
   - You have three options:

   **Option A: Allow Access from Anywhere (Development Only)**
   - Click **"ALLOW ACCESS FROM ANYWHERE"**
   - This adds `0.0.0.0/0` (all IPs)
   - ⚠️ Use this for development only, not production!
   
   **Option B: Add Your Current IP**
   - Click **"ADD CURRENT IP ADDRESS"**
   - Atlas will detect and add your current IP
   - Note: You'll need to update this if your IP changes
   
   **Option C: Add Specific IP Range**
   - Enter your IP or IP range manually
   - Good for static IPs or corporate networks

3. **Confirm**:
   - Click **"Confirm"** button
   - Wait 1-2 minutes for changes to propagate

### Step 3: Verify Database User
1. **Navigate to Database Access**:
   - In the left sidebar, click **"Database Access"**

2. **Check User Exists**:
   - Verify user `corp1o1` exists
   - Password should be `sokol`

3. **If User Doesn't Exist**:
   - Click **"+ ADD NEW DATABASE USER"**
   - Username: `corp1o1`
   - Password: `sokol`
   - Database User Privileges: **"Read and write to any database"**
   - Click **"Add User"**

### Step 4: Get Your Connection String
1. **Navigate to Database**:
   - Click **"Database"** in the left sidebar

2. **Click "Connect"**:
   - Find your cluster (likely named `Cluster0`)
   - Click the **"Connect"** button

3. **Choose Connection Method**:
   - Select **"Connect your application"**
   - Driver: **Node.js**
   - Version: **5.5 or later**

4. **Copy Connection String**:
   - It should look like:
   ```
   mongodb+srv://corp1o1:<password>@cluster0.gojkk4r.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with `sokol`
   - Add database name after `.net/`: 
   ```
   mongodb+srv://corp1o1:sokol@cluster0.gojkk4r.mongodb.net/sokol?retryWrites=true&w=majority
   ```

### Step 5: Update Your .env File
Your `.env` file should have:
```env
MONGODB_URI=mongodb+srv://corp1o1:sokol@cluster0.gojkk4r.mongodb.net/sokol?retryWrites=true&w=majority
```

### Step 6: Test the Connection
1. **Restart your backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Look for success message**:
   ```
   📊 MongoDB connected successfully to: cluster0-xxxxx.mongodb.net
   📂 Database: sokol
   ```

## 🔧 Troubleshooting

### Error: `queryTxt ETIMEOUT cluster0.gojkk4r.mongodb.net`
**Cause**: DNS resolution failing
**Solution**: 
- Check your internet connection
- Try using Google DNS (8.8.8.8)
- Verify the cluster name is correct

### Error: `connect ECONNREFUSED`
**Cause**: Connection blocked
**Solution**: 
- **Most likely**: IP not whitelisted - Add `0.0.0.0/0` in Network Access
- Check firewall settings
- Verify MongoDB Atlas cluster is running (check Atlas dashboard)

### Error: `MongoServerError: bad auth`
**Cause**: Wrong username/password
**Solution**:
- Verify username is `corp1o1`
- Verify password is `sokol`
- Check Database Access in Atlas

### Error: `MongoNetworkError`
**Cause**: Network connectivity issue
**Solution**:
- Check IP whitelist (add `0.0.0.0/0` for testing)
- Check if you're behind a corporate firewall/VPN
- Try different network connection

## 🎯 Quick Checklist

- [ ] Logged into MongoDB Atlas
- [ ] Added IP to Network Access (`0.0.0.0/0` for dev)
- [ ] Verified database user `corp1o1` exists
- [ ] Connection string in `.env` is correct
- [ ] No typos in password (`sokol`)
- [ ] Cluster is active (check Atlas dashboard)
- [ ] Internet connection is stable

## 🚦 Expected Result

When everything is configured correctly, you'll see:

```
✅ Authentication configuration validated successfully
✅ OpenAI service initialized with advanced configuration
📊 MongoDB connected successfully to: cluster0-shard-00-01.gojkk4r.mongodb.net
📂 Database: sokol
🚀 Sokol server running on port 3001 in development mode
```

## 📝 Next Steps

Once connected:
1. **Test webhook**: Create a user in Clerk
2. **Check database**: User should appear in MongoDB
3. **Test assessments**: Create and take an assessment
4. **Verify linkage**: Assessment should be linked to user

## 🔒 Security Notes

- **Development**: Use `0.0.0.0/0` for IP whitelist
- **Production**: Use specific IP addresses only
- **Never commit**: Real passwords to git
- **Use environment variables**: For all secrets

## 📚 Resources

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Connection String URI Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Network Access Configuration](https://www.mongodb.com/docs/atlas/security/ip-access-list/)