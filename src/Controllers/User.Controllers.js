const Async_handler = require("../Utils/Async_Handler.js");
const Api_Error = require("../Utils/Api_Error.js");
const Users = require("../Models/User.Model.js");
const passport = require("passport");
const bcrypt = require("bcrypt");
module.exports.Get_login=Async_handler((req, res) => {
    res.render("Auth/login.ejs");
});
module.exports.Post_login=Async_handler(async (req, res) => {
    const { email, password } = req.body;

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

    // Set cookies with security settings
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    req.flash('success', `Welcome ${user.username}`);
    res.redirect("/chat");
});
module.exports.Get_Signup=Async_handler((req, res) => {
    res.render("Auth/signup.ejs");
});
module.exports.Post_Signup= Async_handler(async (req, res) => {
    const { username, email, password } = req.body;

    let user_already_exist = await Users.findOne({ email: email });

    if (user_already_exist) {
        return res.redirect("/user/signup?error=User+already+exists");
    }

    const Saved_User = await Users.create({ username, email, password });

    if (!Saved_User) {
        throw new Api_Error(500, "User registration failed, please try again");
    }

    req.flash('success', `Signup Successful`);
    res.redirect("/user/login");
});
module.exports.get_google= passport.authenticate("google", {
    scope: ["profile", "email"],
     accessType: "offline",
    prompt: "consent"
});
module.exports.Post_google=Async_handler(async (req, res) => {  
        
        if(!req.user){
        req.flash('error', 'Google authentication failed');
        return res.redirect("/user/login");
        }
        try{
        // Generate JWT tokens for the authenticated user
        const accessToken = req.user.Generate_Acess_Token();
        const refreshToken = req.user.Generate_Refresh_Token();

        req.user.RefreshToken = refreshToken;
        await req.user.save({ validateBeforeSave: false });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        req.flash('success', `Welcome ${req.user.username}`);
        res.redirect("/chat");
    }
    catch(error){
         console.error('Google OAuth error:', error);
        req.flash('error', 'Failed to complete Google sign-in');
        res.redirect("/user/login");
    }
}   
);
module.exports.Post_Logout= Async_handler(async (req, res) => {
    await Users.findByIdAndUpdate(req.user._id, {
        RefreshToken: null
    });
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.redirect("/user/login");
});
module.exports.Get_Update=Async_handler(async (req, res) => {
    let User = await Users.findById(req.user._id);
    if (!User) {
        throw new Api_Error(404, "User not  found ");

    }
    res.render("home/profile_page.ejs", { User })
});
module.exports.Patch_Update=Async_handler(async (req, res) => {
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
});