const mongoose = require("mongoose");

const connectDB = async (retries = 5) => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in environment variables");
        }

        const connection_instance = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
         
        console.log(`✅ MongoDB connected: ${connection_instance.connection.host}`);
        
        // Handle connection errors after initial connection
        mongoose.connection.on('error', err => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
        });
        
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        
        if (retries > 0) {
            console.log(`🔄 Retrying connection... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectDB(retries - 1);
        }
        
        throw error; 
    }
};

module.exports = connectDB;