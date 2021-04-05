const express = require("express");

const chatController = require("../controllers/chats");
const jwtVerify = require("../middlewares/jwtVerify");

const router = express.Router();

router.get("/get-chat-channels", jwtVerify, chatController.getChatChannels);
router.get("/get-chat", jwtVerify, chatController.getChats);

router.post("/add-message", jwtVerify, chatController.addChat);

module.exports = router;
