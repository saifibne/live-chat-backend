const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    required: true,
    type: String,
  },
  email: {
    required: true,
    type: String,
  },
  password: {
    required: true,
    type: String,
  },
  pendingRequests: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  friendList: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  notifications: [
    {
      message: String,
      imageUrl: String,
    },
  ],
  birthDate: String,
  phoneNo: String,
  address: String,
  pictureUrl: {
    type: String,
  },
  sessionKey: String,
  sessionExpireTime: Number,
  sessionExpireDuration: Number,
});

module.exports = mongoose.model("User", userSchema);
