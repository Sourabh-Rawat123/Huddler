require("dotenv").config();
const mongoose = require("mongoose");
const sample_user = require("./Sample_Users.js");
const user_model = require("../Models/User.Model.js");
const bcrypt = require("bcrypt");

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('connection successful');
}
const InitDb = async () => {
    try {
        await user_model.deleteMany({});
        const usersToInsert = await Promise.all(
            sample_user.map(async (user) => ({
                ...user,
                password: user.password ? await bcrypt.hash(user.password, 10) : undefined
            }))
        );
        const inserted_user = await user_model.insertMany(usersToInsert);
        console.log("Succesfully inserted", inserted_user.length);
    } catch (error) {
        console.log(error);
    }
    finally {
        process.exit(1);
    }
}
main()
    .then(InitDb)
    .catch((err) => {
        console.error('DB connection failed:', err);
        process.exit(1);
    })