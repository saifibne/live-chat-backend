const jwt = require("jsonwebtoken");
const redisClient = require("../app");

const User = require("../models/user");

module.exports = (req, res, next) => {
  const bearerToken = req.get("Authorization");
  if (!bearerToken) {
    return res.status(403).json({
      message: "please attach the bearer token",
      code: 403,
    });
  }
  const token = bearerToken.split(" ")[1];
  if (!token) {
    return res.status(402).json({
      message: "please attach the token",
      code: 402,
    });
  }
  // let verifiedToken;
  // try {
  //   verifiedToken = jwt.verify(token, "someSuperSecret");
  // } catch (error) {
  //   return res.status(401).json({
  //     message: "token verification error",
  //     code: 401,
  //   });
  // }
  // if (!verifiedToken) {
  //   return res.status(401).json({
  //     message: "token verification error",
  //     code: 401,
  //   });
  // }
  redisClient.redisClient.get(token, async (err, data) => {
    if (!data) {
      let user;
      try {
        user = await User.findOne({ sessionKey: token });
      } catch (error) {
        return res.status(500).json({
          message: "some database error",
          code: 500,
        });
      }
      if (!user) {
        return res.status(400).json({
          message: "Session key overwritten or expired",
        });
      }
      if (user.sessionKey === token && user.sessionExpireTime > Date.now()) {
        return res.status(401).json({
          message: "token expired or deleted",
        });
      }
    } else {
      req.userId = data;
      // req.expireTime = verifiedToken.expireTime;
      next();
    }
  });
};
