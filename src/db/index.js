const mongoose = require("mongoose");
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined");
        }

        const connection_instance = await mongoose.connect(process.env.MONGODB_URI);
         
        console.log(`MongoDB connected: ${connection_instance.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        throw error; 
    }
};

module.exports = connectDB;
