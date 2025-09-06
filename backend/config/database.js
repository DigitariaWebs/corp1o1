const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    // Determine which database URI to use based on environment
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI not provided in environment variables');
    }

    // MongoDB connection options
    const options = {
      // Connection management
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,

      // Connection optimization
      maxIdleTimeMS: 30000,

      // Error handling
      retryWrites: true,
      w: 'majority',
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoURI, options);
    
    console.log(`📊 MongoDB connected successfully to: ${connection.connection.host}`);
    console.log(`📂 Database: ${connection.connection.name}`);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('📊 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('📊 Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📊 Mongoose connection closed through app termination');
      process.exit(0);
    });

    return connection;

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);

    // In development, we can continue without database for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Running in development mode without database connection');
      console.log('⚠️ Some features may not work correctly');
      return null;
    }

    // If in production, exit process on connection failure
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Database health check
const checkDatabaseHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return {
      status: 'healthy',
      message: 'Database connection is active',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Close database connection
const closeDatabaseConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('📊 Database connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
};

module.exports = {
  connectDatabase,
  checkDatabaseHealth,
  closeDatabaseConnection,
};