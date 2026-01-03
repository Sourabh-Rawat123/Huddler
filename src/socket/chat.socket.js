const Message = require('../Models/Messages.Models.js');
const User = require('../Models/User.Model.js');
const Room = require('../Models/Room.Model.js');

let activeUsers = {}; // { socketId: {username, userId, roomId, stream: 'audio'|'video'|'both'} }
let roomUsers = {};   // { roomId: [socketId, ...] }

module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log(`✅ User connected: ${socket.id}`);

        // User joins a room
        socket.on('join-room', async ({ roomId, username, userId }) => {
            try {
                // Verify user is a participant
                const room = await Room.findById(roomId);
                if (!room) {
                    socket.emit('error', { message: 'Room not found' });
                    return;
                }

                const isParticipant = room.participants.some(
                    p => p.toString() === userId
                );

                if (!isParticipant) {
                    socket.emit('error', { message: 'Not a participant' });
                    return;
                }

                socket.join(roomId);
                activeUsers[socket.id] = { username, userId, roomId, stream: null };

                if (!roomUsers[roomId]) {
                    roomUsers[roomId] = [];
                }
                roomUsers[roomId].push(socket.id);

                // Notify others that user joined
                socket.to(roomId).emit('user-joined', {
                    username,
                    socketId: socket.id
                });

                // Send current users list to new user
                const usersInRoom = roomUsers[roomId].map(id => ({
                    socketId: id,
                    username: activeUsers[id]?.username,
                    stream: activeUsers[id]?.stream
                }));
                socket.emit('existing-users', usersInRoom);
                io.to(roomId).emit('update-user-list', usersInRoom);
                console.log(`👤 ${username} joined room: ${roomId}`);
            } catch (error) {
                console.error('Error in join-room:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // ========== TEXT MESSAGING ==========
        socket.on('chat-message', async ({ roomId, message }) => {
            const userInfo = activeUsers[socket.id];

            if (!userInfo) return;

            try {
                // Save message to database
                const newMessage = await Message.create({
                    Room_id: roomId,
                    Sender: userInfo.userId,
                    content: message,
                    type: 'text'
                });

                const populatedMessage = await Message.findById(newMessage._id)
                    .populate('Sender', 'username');

                // Broadcast to all users in room
                io.to(roomId).emit('chat-message', {
                    messageId: newMessage._id,
                    username: populatedMessage.Sender.username,
                    content: message,
                    timestamp: newMessage.createdAt
                });
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Typing indicators
        socket.on('typing', ({ roomId }) => {
            const userInfo = activeUsers[socket.id];
            if (userInfo) {
                socket.to(roomId).emit('user-typing', { username: userInfo.username });
            }
        });

        socket.on('stop-typing', ({ roomId }) => {
            const userInfo = activeUsers[socket.id];
            if (userInfo) {
                socket.to(roomId).emit('user-stop-typing', { username: userInfo.username });
            }
        });

        // ========== WEBRTC SIGNALING (Audio/Video) ==========

        // User starts streaming (audio, video, or both)
        socket.on('start-stream', ({ roomId, streamType }) => {
            // streamType: 'audio', 'video', 'both'
            if (activeUsers[socket.id]) {
                activeUsers[socket.id].stream = streamType;
                socket.to(roomId).emit('user-stream-started', {
                    socketId: socket.id,
                    username: activeUsers[socket.id].username,
                    streamType
                });
            }
        });

        // User stops streaming
        socket.on('stop-stream', ({ roomId }) => {
            if (activeUsers[socket.id]) {
                activeUsers[socket.id].stream = null;
                socket.to(roomId).emit('user-stream-stopped', {
                    socketId: socket.id,
                    username: activeUsers[socket.id].username
                });
            }
        });

        // WebRTC Offer (initiating call)
        socket.on('webrtc-offer', ({ targetSocketId, offer, streamType }) => {
            socket.to(targetSocketId).emit('webrtc-offer', {
                senderSocketId: socket.id,
                senderUsername: activeUsers[socket.id]?.username,
                offer,
                streamType // 'audio', 'video', 'both'
            });
        });

        // WebRTC Answer (accepting call)
        socket.on('webrtc-answer', ({ targetSocketId, answer }) => {
            socket.to(targetSocketId).emit('webrtc-answer', {
                senderSocketId: socket.id,
                answer
            });
        });

        // ICE Candidate exchange (for connection establishment)
        socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
            socket.to(targetSocketId).emit('webrtc-ice-candidate', {
                senderSocketId: socket.id,
                candidate
            });
        });

        // Mute/unmute audio
        socket.on('toggle-audio', ({ roomId, isMuted }) => {
            socket.to(roomId).emit('user-audio-toggled', {
                socketId: socket.id,
                username: activeUsers[socket.id]?.username,
                isMuted
            });
        });

        // Toggle video on/off
        socket.on('toggle-video', ({ roomId, isVideoOff }) => {
            socket.to(roomId).emit('user-video-toggled', {
                socketId: socket.id,
                username: activeUsers[socket.id]?.username,
                isVideoOff
            });
        });

        // Screen sharing
        socket.on('start-screen-share', ({ roomId }) => {
            socket.to(roomId).emit('user-screen-share-started', {
                socketId: socket.id,
                username: activeUsers[socket.id]?.username
            });
        });

        socket.on('stop-screen-share', ({ roomId }) => {
            socket.to(roomId).emit('user-screen-share-stopped', {
                socketId: socket.id
            });
        });

        // ========== DISCONNECT ==========
        socket.on('disconnect', () => {
            const userInfo = activeUsers[socket.id];

            if (userInfo) {
                const roomId = userInfo.roomId;

                // Remove from active users
                delete activeUsers[socket.id];

                // Remove from room users
                if (roomUsers[roomId]) {
                    const userIndex = roomUsers[roomId].indexOf(socket.id);
                    if (userIndex !== -1) {
                        roomUsers[roomId].splice(userIndex, 1);
                    }

                    // Notify others
                    socket.to(roomId).emit('user-left', {
                        socketId: socket.id,
                        username: userInfo.username
                    });

                    // Update user list
                    const usersInRoom = roomUsers[roomId].map(id => ({
                        socketId: id,
                        username: activeUsers[id]?.username,
                        stream: activeUsers[id]?.stream
                    }));
                    io.to(roomId).emit('update-user-list', usersInRoom);
                     if (roomUsers[roomId].length === 0) {
                        delete roomUsers[roomId];
                    }
                }

                console.log(`👋 ${userInfo.username} disconnected`);
            }
        });
    });
};
