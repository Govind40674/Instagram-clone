const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const chatSchema=new Schema({
  sendername:{
type:String
  },
  receivername:{
    type:String
  },
  message:
  {
    type:String
  },
  date:{type:Date,default:Date.now},
});
module.exports=mongoose.model("Chat",chatSchema);