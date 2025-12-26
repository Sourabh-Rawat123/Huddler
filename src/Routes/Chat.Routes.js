const express = require("express");
const router = express.Router();
const Async_handler = require("../Utils/Async_Handler");
const User = require("../Models/User.Model.js");
const Room = require("../Models/Room.Model.js");
const Message = require("../Models/Messages.Models.js");
const { VerifyAcessToken } = require("../MiddleWares/Auth.Middleware.js");
const { validateCreateRoom, validateJoinRoom } = require("../MiddleWares/Validation.Middleware.js");
const ApiError = require("../Utils/Api_Error.js");
const Secret_Code = require("../config/random_code.js");

// Home page - Shows user's rooms
router.get("/", VerifyAcessToken, Async_handler(async (req, res) => {
    let id = req.user._id;
    let user = await User.findById(id);
    if (!user) {
        throw new ApiError(401, "No User found");
    }

    // Get user's rooms
    const rooms = await Room.find({ participants: user._id })
        .populate('admin', 'username')
        .sort({ updatedAt: -1 })
        .limit(20);

    try {
        res.render("home/home_page.ejs", { User: user, rooms: rooms });
    } catch (error) {
        throw new ApiError(500, "Can not render the page");
    }
}));

// Show create room form
router.get("/create_room", VerifyAcessToken, Async_handler(async (req, res) => {
    res.render("Room/Create_room.ejs");
}));

// Create new room - Only admin added initially
router.post("/create-room", VerifyAcessToken, validateCreateRoom, Async_handler(async (req, res) => {
    const { roomName, roomType, roomDescription } = req.body;
    const Room_admin = req.user._id;

    const room_creation = await Room.create({
        name: roomName,
        type: roomType,
        description: roomDescription || '',
        admin: Room_admin,
        participants: [Room_admin],
        roomCode: Secret_Code(5)
    });

    req.flash('success', `Room "${roomName}" created successfully!`);
    res.redirect(`/chat/room/${room_creation._id}`);
}));

// Show join room form
router.get("/join_room", VerifyAcessToken, Async_handler(async (req, res) => {
    res.render("Room/Join_room.ejs");
}));

// Join room with code - Add user to participants
router.post("/join-room", VerifyAcessToken, validateJoinRoom, Async_handler(async (req, res) => {
    const { room_code } = req.body;

    const room = await Room.findOne({ roomCode: room_code });

    if (!room) {
        req.flash('error', "Invalid room code");
        return res.redirect("/chat/join_room?error=Invalid+room+code");
    }

    // Add user to participants if not already in room
    const isAlreadyParticipant = room.participants.some(
        p => p.toString() === req.user._id.toString()
    );

    if (!isAlreadyParticipant) {
        room.participants.push(req.user._id);
        await room.save();
        req.flash('success', `Joined room "${room.name}" successfully!`);
    }

    res.redirect(`/chat/room/${room._id}`);
}));

// Room chat page
router.get("/room/:roomId", VerifyAcessToken, Async_handler(async (req, res) => {
    const room = await Room.findById(req.params.roomId)
        .populate('admin', 'username email')
        .populate('participants', 'username email');

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    // Check if user is a participant
    const isParticipant = room.participants.some(
        p => p._id.toString() === req.user._id.toString()
    );

    // Block non-participants
    if (!isParticipant) {
        req.flash('error', "You are not a member of this room");
        return res.redirect("/chat/join_room");
    }

    // Get previous messages
    const messages = await Message.find({ Room_id: room._id })
        .populate('Sender', 'username')
        .sort({ createdAt: 1 })
        .limit(100);

    res.render("Room/Chat_room.ejs", {
        room: room,
        user: req.user,
        messages: messages
    });
}));

// Delete/End room (Admin only)
router.delete("/room/:roomId", VerifyAcessToken, Async_handler(async (req, res) => {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
        return res.status(404).json({ error: "Room not found" });
    }

    // Check if user is the admin
    if (room.admin.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Only room admin can delete the room" });
    }

    // Delete all messages in the room
    await Message.deleteMany({ Room_id: room._id });

    // Delete the room
    await Room.findByIdAndDelete(room._id);

    res.status(200).json("sucess", "Room deleted successfully" );
}));

module.exports = router;
