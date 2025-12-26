const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const Message_Schema=new Schema({
   Room_id:
   {
     type:mongoose.Schema.Types.ObjectId,
     ref:"Room",
     required:true,
     index:true
   },
   Sender:
   {
     type:mongoose.Schema.Types.ObjectId,
     ref:"User",
     required:true,
   },
   content: { 
    type: String, 
    required: true 
  },
  type: {
    type: String,
    enum: ['text', 'image'], 
    default: 'text'
  },
  Read_by:[{
   type:mongoose.Schema.Types.ObjectId,
     ref:"User",
     required:true,
  }]
},{timestamps:true});
module.exports=mongoose.model("Message",Message_Schema);