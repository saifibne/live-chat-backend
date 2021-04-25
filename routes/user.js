const express = require("express");
const { body } = require("express-validator");
const jwtVerify = require("../middlewares/jwtVerify");

const userController = require("../controllers/user");

const router = express.Router();

router.get("/email-check", userController.emailCheck);
router.get("/search", jwtVerify, userController.searchUser);
router.get("/add-user", jwtVerify, userController.addUser);
router.get("/auto-login", jwtVerify, userController.autoLogIn);
router.get("/user-data", jwtVerify, userController.getUserData);
router.get("/user-details", userController.getFriendDetails);
router.get("/account-details", jwtVerify, userController.getUserAccountData);
router.get("/friend-list", jwtVerify, userController.getFriendList);
router.get("/reject-request", jwtVerify, userController.rejectFriendRequest);
router.get(
  "/accept-user-request",
  jwtVerify,
  userController.acceptFriendRequest
);
router.post(
  "/sign-up",
  [
    body("name").isLength({ min: 4 }),
    body("email").isEmail(),
    body("password").trim().isLength({ min: 8 }),
  ],
  userController.postSignUp
);
router.post(
  "/log-in",
  [body("email").isEmail(), body("password").trim().isLength({ min: 8 })],
  userController.postLogIn
);
router.post(
  "/update-account-data/:userId",
  userController.updateUserAccountData
);
module.exports = router;
