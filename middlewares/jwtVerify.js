const jwt = require("jsonwebtoken");

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
  let verifiedToken;
  try {
    verifiedToken = jwt.verify(token, "someSuperSecret");
  } catch (error) {
    return res.status(401).json({
      message: "token verification error",
      code: 401,
    });
  }
  if (!verifiedToken) {
    return res.status(401).json({
      message: "token verification error",
      code: 401,
    });
  }
  req.userId = verifiedToken.id;
  req.expireTime = verifiedToken.expireTime;
  next();
};
