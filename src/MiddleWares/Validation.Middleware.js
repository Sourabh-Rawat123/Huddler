const ApiError = require("../Utils/Api_Error");

const validateRegister = (req, res, next) => {
    const { username, email, password } = req.body;

    // Check required fields
    if (!username) {
        return next(new ApiError(400, "Username is required"));
    }
    if (!email) {
        return next(new ApiError(400, "Email is required"));
    }
    if (!password) {
        return next(new ApiError(400, "Password is required"));
    }

    // Validate username format
    if (username.length < 3) {
        return next(new ApiError(400, "Username must be at least 3 characters"));
    }

    // Validate email format (Gmail only as per your schema)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
        return next(new ApiError(400, "Please enter a valid Gmail address"));
    }

    // Validate password strength
    if (password.length < 6) {
        return next(new ApiError(400, "Password must be at least 6 characters"));
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email) {
        return next(new ApiError(400, "Email is required"));
    }
    if (!password) {
        return next(new ApiError(400, "Password is required"));
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
        return next(new ApiError(400, "Please enter a valid Gmail address"));
    }

    next();
};

const validateUpdateProfile = (req, res, next) => {
    const { new_username, new_email } = req.body;

    // Both fields are optional, but if provided, validate them
    if (new_username !== undefined) {
        if (typeof new_username !== 'string' || new_username.trim().length < 3) {
            return next(new ApiError(400, "Username must be at least 3 characters"));
        }
    }
    //  if (avatar !== undefined) {
    //     if (typeof avatar !== 'string' || avatar.trim() === '') {
    //         return next(new ApiError(400, "Avatar must be a valid URL or path"));
    //     }
    // }
    if (new_email !== undefined) {
        if (typeof new_email !== 'string' || new_email.trim() === '') {
            return next(new ApiError(400, "Email is required"));
        }
        // Validate email format (Gmail only)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(new_email)) {
            return next(new ApiError(400, "Please enter a valid Gmail address"));
        }
    }

    // At least one field should be provided
    if (!new_username && !new_email) {
        return next(new ApiError(400, "Provide at least username or email to update"));
    }

    next();
};

const validateCreateRoom = (req, res, next) => {
    const { roomName, roomType, roomDescription } = req.body;

    // Validate Room Name
    if (!roomName || typeof roomName !== 'string' || roomName.trim().length < 3) {
        return next(new ApiError(400, "Room name must be at least 3 characters"));
    }

    if (roomName.length > 50) {
        return next(new ApiError(400, "Room name must not exceed 50 characters"));
    }

    // Validate Room Type
    const validTypes = ['public', 'private', 'direct'];
    if (!roomType || !validTypes.includes(roomType)) {
        return next(new ApiError(400, "Room type must be 'public', 'private', or 'direct'"));
    }

    // Validate Room Description (optional but if provided should be valid)
    if (roomDescription && typeof roomDescription === 'string' && roomDescription.length > 200) {
        return next(new ApiError(400, "Room description must not exceed 200 characters"));
    }

    next();
};

const validateJoinRoom = (req, res, next) => {
    const { room_code } = req.body;

    if (!room_code || typeof room_code !== 'string' || room_code.trim().length < 3) {
        return next(new ApiError(400, "Please enter a valid room code"));
    }

    if (room_code.length > 10) {
        return next(new ApiError(400, "Invalid room code format"));
    }

    // Sanitize: remove spaces and convert to uppercase
    req.body.room_code = room_code.trim().toUpperCase();

    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateUpdateProfile,
    validateCreateRoom,
    validateJoinRoom
};