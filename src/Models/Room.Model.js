const mongoose = require('mongoose');
const RoomSchema = new mongoose.Schema({
  name: { 
    type: String, 
    trim: true,
  },
  type: {
    type: String,
    enum: ['public', 'private', 'direct'],
    default: 'private'
  },
  description: {
    type: String,
    default: ''
  },
  participants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index:true
  }],
  admin: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  roomCode: {
    type: String,
    unique: true,
    required: true,
    index:true
}
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);