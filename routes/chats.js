const express = require("express");

const chatController = require("../controllers/chats");
const jwtVerify = require("../middlewares/jwtVerify");

const router = express.Router();

router.get("/get-chats", jwtVerify, chatController.getChats);

module.exports = router;
