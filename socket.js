let io;

module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "PUT", "POST"],
      },
    });
    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error("io connection dont exist");
    }
    return io;
  },
};
