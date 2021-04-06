const Chat = require("../models/chat");
const socket = require("../socket");
const User = require("../models/user");

exports.getChatChannels = async (req, res, next) => {
  if (!req.userId) {
    return res.status(202).json({
      message: "please attach the token",
      code: 202,
    });
  }
  const userId = req.userId;
  let chats;
  try {
    chats = await Chat.find(
      { "participents.userId": userId },
      { chats: { $slice: -1 } }
    ).populate({ path: "participents.userId", select: "name pictureUrl" });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  const filteredChats = chats.filter((eachChat) => eachChat.chats.length > 0);
  const editedChats = filteredChats.map((eachChat) => {
    if (eachChat.chats.length > 0) {
      const otherParticipent = eachChat.participents.find((eachParticipent) => {
        return eachParticipent.userId._id.toString() !== userId;
      });
      return {
        _id: eachChat._id,
        name: otherParticipent.userId.name,
        pictureUrl: otherParticipent.userId.pictureUrl,
        message: eachChat.chats[0].text,
        time: eachChat.chats[0].time,
      };
    }
  });
  res.status(200).json({
    message: "success",
    chatConnections: editedChats,
  });
};

exports.getChats = async (req, res, next) => {
  if (!req.userId) {
    return res.status(202).json({
      message: "please attach the token",
      code: 202,
    });
  }
  const userId = req.userId;
  const chatId = req.query.chatId;
  let chatConnection;
  try {
    chatConnection = await Chat.findOne(
      { _id: chatId },
      { chats: { $slice: -20 } }
    )
      .populate({
        path: "participents.userId",
        select: "name pictureUrl _id",
      })
      .populate({ path: "chats.userId", select: "pictureUrl _id" });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  const userDetails = chatConnection.participents.filter((eachParticipent) => {
    return eachParticipent.userId._id.toString() !== userId.toString();
  });
  const updatedChats = chatConnection.chats.map((eachChat) => {
    if (
      eachChat.userId._id.toString() === userDetails[0].userId._id.toString()
    ) {
      return { ...eachChat._doc, owner: false };
    } else {
      return { ...eachChat._doc, owner: true };
    }
  });
  res.status(200).json({
    message: "success",
    user: userDetails[0],
    chats: updatedChats,
  });
};

exports.addChat = async (req, res, next) => {
  if (!req.userId) {
    return res.status(202).json({
      message: "please attach the token",
      code: 202,
    });
  }
  const userId = req.userId;
  const groupId = req.query.groupId;
  const message = req.body.message;
  const time = new Date();
  let user;
  try {
    user = await User.findOne({ _id: userId });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  try {
    await Chat.updateOne(
      { _id: groupId },
      { $push: { chats: { text: message, userId: userId, time: time } } }
    );
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  console.log(socket.getIo);
  socket.getIo().emit(groupId, {
    connection: "active",
    data: {
      text: message,
      userId: userId,
      time: time,
      pictureUrl: user.pictureUrl,
    },
  });
  res.status(200).json({
    message: "success message",
    code: 200,
  });
};
