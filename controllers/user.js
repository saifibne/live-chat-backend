const User = require("../models/user");
const Chat = require("../models/chat");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const deleteMiddleware = require("../middlewares/delete");
const { update } = require("../models/user");

exports.postSignUp = async (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const imageUrl = req.body.imageUrl;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "some validation error",
      code: 400,
    });
  }
  const image = req.file;
  let imagePath;

  if (image) {
    if (
      image.mimetype === "image/jpg" ||
      image.mimetype === "image/jpeg" ||
      image.mimetype === "image/png" ||
      image.mimetype === "image/webp"
    ) {
      imagePath = image.path;
    } else {
      deleteMiddleware.deleteFile(image.filename);
      return res.status(202).json({
        message: "unsupported image format",
        code: 202,
      });
    }
  }

  const existingUser = await User.findOne({ email: email });

  if (existingUser) {
    if (image) {
      deleteMiddleware.deleteFile(image.filename);
    }
    return res.status(203).json({
      message: "user already exists",
      code: 203,
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  let user;

  if (imageUrl) {
    user = new User({
      name: name,
      email: email,
      password: hashedPassword,
      pendingRequests: [],
      chatConnections: [],
      pictureUrl: imageUrl,
    });
  } else {
    user = new User({
      name: name,
      email: email,
      password: hashedPassword,
      pendingRequests: [],
      chatConnections: [],
      pictureUrl: imagePath,
    });
  }
  const newUser = await user.save();
  if (!newUser) {
    return res.status(500).json({
      message: "some problem with the database",
      code: 500,
    });
  }
  res.status(200).json({ message: "success", code: 200, user: newUser });
};

exports.emailCheck = async (req, res, next) => {
  const email = req.query.email;
  const user = await User.findOne({ email: email });
  if (user) {
    return res.status(201).json({
      message: "email already exists",
      code: 201,
    });
  }
  res.status(200).json({
    message: "success",
    code: 200,
  });
};

exports.postLogIn = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(203).json({
      message: "some validation error",
      code: 203,
    });
  }

  let user;

  try {
    user = await User.findOne({ email: email });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  if (!user) {
    return res.status(201).json({
      message: "user doesn't exists",
      code: 201,
    });
  }
  const matchedPassword = await bcrypt.compare(password, user.password);
  if (!matchedPassword) {
    return res.status(202).json({
      message: "password doesn't match",
      code: 202,
    });
  }
  const token = jwt.sign(
    { id: user._id, email: user.email },
    "someSuperSecret",
    {
      expiresIn: "1h",
    }
  );
  res.status(200).json({
    message: "successfully login",
    token: token,
    code: 200,
  });
};

exports.autoLogIn = async (req, res, next) => {
  if (!req.userId) {
    return res.status(202).json({
      message: "attach token",
      code: 202,
    });
  }
  const userId = req.userId;
  let user;
  try {
    user = await User.findOne({ _id: userId });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  if (!user) {
    return res.status(400).json({
      message: "couldn't find user",
      code: 400,
    });
  }
  const token = jwt.sign(
    { id: user._id, email: user.email },
    "someSuperSecret",
    { expiresIn: "1h" }
  );
  res.status(200).json({
    message: "success",
    token: token,
    code: 200,
  });
};

exports.searchUser = async (req, res, next) => {
  const userName = req.query.user;
  if (!userName) {
    return res.status(201).json({
      message: "please provide name",
      code: 201,
    });
  }
  await User.collection.createIndex({ name: "text" });
  let users;
  try {
    users = await User.find({ $text: { $search: userName } });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  res.status(200).json({
    message: "success",
    users: users,
  });
};

exports.addUser = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({
      message: "please attach the token",
      code: 302,
    });
  }
  const userId = req.query.user;
  const ownerUserId = req.userId;
  let user;
  try {
    user = await User.findOne({ _id: userId });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  if (!user) {
    return res.status(500).json({
      message: "couldn't find user",
      code: 500,
    });
  }
  const existingUser = user.pendingRequests.findIndex((eachRequest) => {
    return eachRequest.userId.toString() === ownerUserId.toString();
  });
  if (existingUser !== -1) {
    return res.status(202).json({
      message: "you already sented request",
      code: 202,
    });
  }
  if (user._id.toString() === ownerUserId) {
    return res.status(202).json({
      message: "you can't send request to you",
      code: 202,
    });
  }
  try {
    await User.updateOne(
      { _id: userId },
      { $push: { pendingRequests: { userId: ownerUserId } } }
    );
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  res.status(200).json({
    message: "success",
    code: 200,
  });
};

exports.getUserData = async (req, res, next) => {
  if (!req.userId) {
    return res.status(202).json({
      message: "attach token",
      code: 202,
    });
  }
  const userId = req.userId;
  let user;
  try {
    user = await User.findOne({ _id: userId }).populate({
      path: "pendingRequests.userId",
      select: "name pictureUrl",
    });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  if (!user) {
    return res.status(500).json({
      message: "couldn't find user",
      code: 500,
    });
  }
  res.status(200).json({
    message: "success",
    notifications: user.notifications,
    pendingRequests: user.pendingRequests,
    code: 200,
  });
};

exports.acceptFriendRequest = async (req, res, next) => {
  if (!req.userId) {
    return res.status(202).json({
      message: "attach token",
      code: 202,
    });
  }
  const ownerUserId = req.userId;
  const userId = req.query.userId;
  let senderUser;
  let receiverUser;
  try {
    receiverUser = await User.findOne({ _id: ownerUserId });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  try {
    senderUser = await User.findOne({ _id: userId });
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  receiverUser.friendList.push({ userId: senderUser._id });
  const updatedRecieverPendingRequests = receiverUser.pendingRequests.filter(
    (eachUser) => {
      return eachUser.userId.toString() !== senderUser._id.toString();
    }
  );
  receiverUser.pendingRequests = updatedRecieverPendingRequests;
  try {
    await receiverUser.save();
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  senderUser.notifications.push({
    message: `${receiverUser.name} accepted your friend request`,
    imageUrl: receiverUser.pictureUrl,
  });
  senderUser.friendList.push({ userId: receiverUser._id });
  try {
    await senderUser.save();
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  const createChat = new Chat({
    participents: [
      {
        userId: senderUser._id,
      },
      { userId: receiverUser._id },
    ],
    chats: [],
  });
  try {
    await createChat.save();
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  res.status(200).json({
    message: "success",
    code: 200,
  });
};

exports.rejectFriendRequest = async (req, res, next) => {
  if (!req.userId) {
    return res.status(202).json({
      message: "attach token",
      code: 202,
    });
  }
  const ownerUserId = req.userId;
  const userId = req.query.userId;
  // let user;
  // try {
  //   user = await User.findOne({ _id: ownerUserId });
  // } catch (error) {
  //   return res.status(500).json({
  //     message: "some database error",
  //     code: 500,
  //   });
  // }
  try {
    await User.updateOne(
      { _id: ownerUserId },
      { $pull: { pendingRequests: { userId: userId } } }
    );
  } catch (error) {
    return res.status(500).json({
      message: "some database error",
      code: 500,
    });
  }
  res.status(200).json({
    message: "success",
    code: 200,
  });
};
