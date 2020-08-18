const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const likeSchema = new Schema({
  likerID: String,
  postID: String,
});

module.exports = mongoose.model("Like", likeSchema);
