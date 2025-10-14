const mongoose = require("mongoose");
const path=require("path");


const inviteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: "/images/default.png" // 👈 path to your default image
  },
 bio:{
    type: String,
    default: "This is my bio"
 }
});

module.exports = mongoose.model("Profile", inviteSchema);
