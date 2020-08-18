const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  content: String,
  images: { type: [String], default: undefined },
  replyTo: String,
  authorID: String,
  postID: String,
});

module.exports = mongoose.model("Comment", commentSchema);
