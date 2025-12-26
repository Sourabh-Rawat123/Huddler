const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const Schema = mongoose.Schema;

const User_Schema = new Schema
    ({
        username:
        {
            type: String,
            sparse: true,
            trim: true,
            required: function () {
                // Username not required for Google OAuth users
                return !this.googleId;
            },
            index: true
        },
        email:
        {
            type: String,
            required: true,
            unique: true,
            match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, "Please enter a valid Gmail address"]
        },
        password:
        {
            type: String,
            required: function () {
                // Password not required for Google OAuth users
                return !this.googleId;
            }
        },
        avatar: {
            type: String,
            default: "/icons8-user-96.png"
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true
        },
        displayName: {
            type: String
        },
        profilePicture: {
            type: String
        },
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local'
        },
        isOnline: {
            type: Boolean,
            default: false
        },
        socketId: {
            type: String,
            default: null
        },
        RefreshToken: {
            type: String,
        }
    }, { timestamps: true });
//save user password before saving to schema
User_Schema.pre("save", async function () {

    if (!this.isModified('password') || !this.password) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
//check the user password and hashed password
User_Schema.methods.Compare_Password = async function (user_password) {
    if (!this.password) return false;
    return await bcrypt.compare(user_password, this.password)

}
User_Schema.methods.Generate_Refresh_Token = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
User_Schema.methods.Generate_Acess_Token = function () {
    return jwt.sign(
        {
            _id: this._id,
            name: this.username,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    )
}

module.exports = mongoose.model("User", User_Schema);