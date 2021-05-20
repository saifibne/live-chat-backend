require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chats");
const UserPresence = require("./models/userPresence");
const Chat = require("./models/chat");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", ["GET", "PUT", "POST"]);
  res.setHeader("Access-Control-Allow-Headers", [
    "Content-Type",
    "Authorization",
  ]);
  next();
});

app.use("/images", express.static(path.join(__dirname, "images")));

app.use(bodyParser.json());
app.use(multer({ storage: storage }).single("image"));

app.use(userRoutes);
app.use(chatRoutes);

mongoose
  .connect("mongodb://127.0.0.1:27017/chatting", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to Database");
    const server = app.listen(3000);
    const io = require("./socket").init(server);
    io.on("connection", async (socket) => {
      let user;
      try {
        user = await UserPresence.findOne({
          userId: socket.handshake.headers.userid,
        });
      } catch (error) {
        console.log(error);
      }
      if (user) {
        user.socketId = socket.id;
        user.status = "online";
        await user.save();
      } else {
        const newUser = new UserPresence({
          userId: socket.handshake.headers.userid,
          socketId: socket.id,
          status: "online",
        });
        await newUser.save();
      }
      let chatConnections;
      try {
        chatConnections = await Chat.find(
          { "participents.userId": socket.handshake.headers.userid },
          { _id: 1 }
        );
      } catch (error) {
        console.log(error);
      }
      if (chatConnections.length > 0) {
        for (let eachConnection of chatConnections) {
          io.emit(`${eachConnection._id}-status`, {
            userId: socket.handshake.headers.userid,
            status: "online",
          });
        }
      }
      socket.on("disconnect", async () => {
        let user;
        try {
          user = await UserPresence.findOne({
            socketId: socket.id,
          });
        } catch (error) {
          console.log(error);
        }
        user.status = "offline";
        await user.save();
        let chatConnections;
        try {
          chatConnections = await Chat.find(
            { "participents.userId": user.userId },
            { _id: 1 }
          );
        } catch (error) {
          console.log(error);
        }
        if (chatConnections.length > 0) {
          for (let eachConnection of chatConnections) {
            io.emit(`${eachConnection._id}-status`, {
              userId: user.userId,
              status: "offline",
            });
          }
        }
      });
    });
  })
  .catch((error) => {
    console.log(error);
  });
