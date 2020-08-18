const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: String,
  content: String,
  authorID: String,
  date: { type: Date, default: Date.now },
  claps: { type: Number, default: 0 },
});

module.exports = mongoose.model("Post", postSchema);
