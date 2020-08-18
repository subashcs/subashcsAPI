const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roleSchema = new Schema({
  role: { type: String, default: "Author" },
  authorities: { type: Array, default: [] },
});

module.exports = mongoose.model("Role", roleSchema);
