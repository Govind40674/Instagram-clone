const mongoose=require("mongoose");
const inviteSchema=new mongoose.Schema({
   
    name:{
      type:String,
    },
    invitation:{
      type:Array,
      default:[]
    }
    
   
  });
  module.exports=mongoose.model("Invite",inviteSchema);
