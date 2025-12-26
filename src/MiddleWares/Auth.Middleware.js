const jwt = require("jsonwebtoken");
const ApiError = require("../Utils/Api_Error.js");
const Async_handler = require("../Utils/Async_Handler.js");

const User = require("../Models/User.Model.js");

const VerifyAcessToken = Async_handler(async (req, res, next) => {
    // Get token from header or cookies
    const token = req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized request - No token provided");
    }


    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);


    const user = await User.findById(decoded._id).select("-password -RefreshToken");

    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
});

const VerifyRefreshToken = Async_handler(async (req, res, next) => {
    const refresh_token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refresh_token) {
        throw new ApiError(401, "Refresh Token required");
    }
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if (!user || user.RefreshToken != refresh_token) {
        throw new ApiError(401, "Invalid refresh Token");
    }
    req.user = user;
    next();
})
module.exports = { VerifyAcessToken, VerifyRefreshToken };
