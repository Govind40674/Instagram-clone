const mongoose=require('mongoose');
const postSchema=new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    image:{
      type:String,
    },
    caption:{
      type:String,
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
    
module.exports=mongoose.model("Post",postSchema);