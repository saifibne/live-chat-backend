const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userPresenceSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  socketId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("UserPresence", userPresenceSchema);
