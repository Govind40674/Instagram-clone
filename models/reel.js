const mongoose = require("mongoose");
const { Schema } = mongoose;
const reelSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }

});
module.exports = mongoose.model("Reel", reelSchema);