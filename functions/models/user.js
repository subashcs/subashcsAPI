const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  age: Number,
  roleID: { type: mongoose.Schema.Types.ObjectId, ref: "role" },
  email: { type: String, unique: true, required: true, dropDups: true },
  password: String,
});

module.exports = mongoose.model("User", userSchema);
