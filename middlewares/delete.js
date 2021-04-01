const path = require("path");
const fs = require("fs");

exports.deleteFile = (fileName) => {
  const exactFilePath = path.join(__dirname, "../", "images", fileName);
  fs.unlink(exactFilePath, (error) => {
    if (error) {
      console.log(error);
    }
  });
};
