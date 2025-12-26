const express = require("express");
const router = express.Router();
const Async_handler = require("../Utils/Async_Handler.js");
const Api_Error = require("../Utils/Api_Error.js");
const Users = require("../Models/User.Model.js");
const { validateRegister, validateLogin, validateUpdateProfile } = require("../MiddleWares/Validation.Middleware.js");
const { VerifyAcessToken } = require("../MiddleWares/Auth.Middleware.js");
const passport = require("passport");
const bcrypt = require("bcrypt");
let arr = [];
///public routes 
router.get("/login", Async_handler((req, res) => {
    res.render("Auth/login.ejs");
}));
router.post("/login", validateLogin, Async_handler(async (req, res) => {
    const { email, password } = req.body;
    arr.push(password);
    const user = await Users.findOne({ email: email });
    if (!user) {
        throw new Api_Error(401, "Invalid Email or password");
    }
    const isPasswordValid = await user.Compare_Password(password);
    if (!isPasswordValid) {
        throw new Api_Error(401, "Invalid email or password");
    }
    const accessToken = user.Generate_Acess_Token();
    const refreshToken = user.Generate_Refresh_Token();
    user.RefreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    });
    req.flash('success', `Welcome ${user.username}`);
    // Redirect to chat/dashboard after successful login
    res.redirect("/chat");
}));
router.get("/signup", Async_handler((req, res) => {
    res.render("Auth/signup.ejs");
}));
router.post("/signup", validateRegister, Async_handler(async (req, res) => {
    const { username, email, password } = req.body;
    arr.push(password);

    let user_already_exist = await Users.findOne({ email: email });

    if (user_already_exist) {
        return res.redirect("/user/signup?error=User+already+exists");
    }

    const Saved_User = await Users.create({ username, email, password });

    if (!Saved_User) {
        throw new Api_Error(500, "User registration failed, please try again");
    }
    req.flash('success', `Signup Succesfull`);

    res.redirect("/user/login");
}));
// router.post("/refresh-token", refreshToken);
//google auth
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email",]
}));

// Google OAuth callback - CORRECT way
router.get("/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/user/login"
    }),
    (req, res) => {
        // Generate JWT tokens for the authenticated user
        const accessToken = req.user.Generate_Acess_Token();
        const refreshToken = req.user.Generate_Refresh_Token();

        req.user.RefreshToken = refreshToken;
        req.user.save({ validateBeforeSave: false });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        });
        req.flash('success', `Welcome ${req.user.username}`);
        res.redirect("/chat");
    }
);

// ============= PROTECTED ROUTES (Auth Required) =============

// Logout user
router.post("/logout", VerifyAcessToken, Async_handler(async (req, res) => {
    await Users.findByIdAndUpdate(req.user._id, {
        RefreshToken: null
    });
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.redirect("/user/login");
}));

// // Get current user profile
router.get("/profile", VerifyAcessToken, Async_handler(async (req, res) => {
    let User = await Users.findById(req.user._id);
    if (!User) {
        throw new Api_Error(404, "User not  found ");

    }
    res.render("home/profile_page.ejs", { User })
}));
// Update user profile
router.patch("/profile", VerifyAcessToken, validateUpdateProfile, Async_handler(async (req, res) => {
    const id = req.user._id;
    const { new_username, new_email, new_password } = req.body;
    const user = await Users.findById(id);
    if (!user) {
        throw new Api_Error(404, "User not found");
    }
    const updated_data = {
        username: new_username,
        email: new_email
    };
    if (new_password && new_password.trim() !== "") {
        const same_pass = await user.Compare_Password(new_password);
        if (same_pass) {
            req.flash('error', "Password can not be same");
            res.redirect("/user/profile");
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(new_password, salt);
        updated_data.password = hashed;
    }
    let gets_updated = await Users.findByIdAndUpdate(id, updated_data, { new: true, runValidators: true });
    if (!gets_updated) {
        throw new Api_Error(404, "Password not updated ");

    }
    req.flash('success', "Profile Updated Sucessfully");
    res.redirect("/chat");
}));

// router.post("/change-password", VerifyAcessToken, changePassword);
module.exports = router;