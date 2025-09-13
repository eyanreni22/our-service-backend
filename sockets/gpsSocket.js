const setupGPSSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("📍 GPS Socket connected:", socket.id);

    socket.on("updateLocation", (location) => {
      io.emit("locationUpdate", location);
    });

    socket.on("disconnect", () => {
      console.log("📍 GPS Socket disconnected:", socket.id);
    });
  });
};

module.exports = setupGPSSocket;
