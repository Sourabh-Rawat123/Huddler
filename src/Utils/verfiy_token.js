// verify_token.js only for non http call when useing socket.io
const jwt = require('jsonwebtoken');

const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};

module.exports = { verifyAccessToken, verifyRefreshToken };