const Chat = require("../models/chat");

exports.getChats = async (req, res, next) => {
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
