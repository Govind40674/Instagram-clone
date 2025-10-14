const mongoose=require('mongoose');
const chatSchema=new mongoose.Schema({
    name:String,
    followers:{
        type:Array,
        default:[]
    },
   

});
module.exports=mongoose.model("Member",chatSchema);