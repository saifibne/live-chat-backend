const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatSchema = new Schema(
  {
    participents: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    chats: [
      {
        text: String,
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        time: Date,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chats", chatSchema);
