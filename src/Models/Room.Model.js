const mongoose = require('mongoose');
const RoomSchema = new mongoose.Schema({
  name: { 
    type: String, 
    trim: true,
  },
  type: {
    type: String,
    enum: ['public', 'private', 'direct'],
    default: 'public'
  },
  description: {
    type: String,
    default: ''
  },
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  roomCode: {
    type: String,
    unique: true,
    required: true
}
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);