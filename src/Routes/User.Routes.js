const express = require("express");
const router = express.Router();
const { validateRegister, validateLogin, validateUpdateProfile } = require("../MiddleWares/Validation.Middleware.js");
const { VerifyAcessToken } = require("../MiddleWares/Auth.Middleware.js");
const user_controller=require("../Controllers/User.Controllers.js");
const passport = require("passport");
// Public routes 
router.get("/login",user_controller.Get_login);

router.post("/login", validateLogin,user_controller.Post_login);

router.get("/signup",user_controller.Get_Signup);

router.post("/signup", validateRegister,user_controller.Post_Signup);
// router.post("/refresh-token", refreshToken);
//google auth
router.get("/google",user_controller.get_google);

// Google OAuth callback - CORRECT way
router.get("/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/user/login"
    }),user_controller.Post_google);

router.post("/logout", VerifyAcessToken,user_controller.Post_Logout);

// // Get current user profile
router.get("/profile", VerifyAcessToken,user_controller.Get_Update);
// Update user profile
router.patch("/profile", VerifyAcessToken, validateUpdateProfile,user_controller.Patch_Update);

// router.post("/change-password", VerifyAcessToken, changePassword);
module.exports = router;