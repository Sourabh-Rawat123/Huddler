const express = require("express");
const router = express.Router();
const { VerifyAcessToken } = require("../MiddleWares/Auth.Middleware.js");
const { validateCreateRoom, validateJoinRoom } = require("../MiddleWares/Validation.Middleware.js");
const Chat_controller=require("../Controllers/Chat.Controller.js");
// Home page - Shows user's rooms
router.get("/", VerifyAcessToken,Chat_controller.Home_Page);
// Show create room form
router.get("/create_room", VerifyAcessToken,Chat_controller.Create_Room);

// Create new room - Only admin added initially
router.post("/create-room", VerifyAcessToken, validateCreateRoom,Chat_controller.Post_Room);

// Show join room form
router.get("/join_room", VerifyAcessToken,Chat_controller.Get_Join_Room);

router.post("/join-room", VerifyAcessToken, validateJoinRoom,Chat_controller.Post_Join_Room);

// Room chat page
router.get("/room/:roomId", VerifyAcessToken,Chat_controller.Get_Chat_Room);

// Delete/End room (Admin only)
router.delete("/room/:roomId", VerifyAcessToken,Chat_controller.Delete_Room);

module.exports = router;
