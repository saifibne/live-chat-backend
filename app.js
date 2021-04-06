const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
// const io = require("socket.io")(8000);

const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chats");
// const ioConnection = require("./socket");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./images");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const app = express();

// io.on("connection", (socket) => {
//   console.log("socket connected");
// });

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
    io.on("connection", (socket) => {
      console.log("socket connected");
    });
    // io.listen(5000);
  })
  .catch((error) => {
    console.log(error);
  });
