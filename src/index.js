const express = require("express");
const http = require("http");
const Filter = require("bad-words");
const socketio = require("socket.io");
const {
  addUser,
  getUser,
  getUsersInRoom,
  removeUser
} = require('./utils/users')
const {
  generateMessage,
  generateLocation
} = require('./utils/messages')
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const server = http.createServer(app);
const io = socketio(server);
const pulicDirectory = path.join(__dirname, "../public");
app.use(express.static(pulicDirectory));
let count = 0;
let message = "Hello How are you?";


io.on("connection", (socket) => {
  console.log("New connection");
  // socket.emit("helloMessage", generateMessage("Welcome!"));
  // socket.broadcast.emit("helloMessage", generateMessage("Another user has joined"));


  socket.on('Join', (options, callback) => {
    const {
      error,
      user
    } = addUser({
      id: socket.id,
      ...options
    })
    if (error) {
      return callback(error)
    }
    socket.join(user.room)

    socket.emit("helloMessage", generateMessage('Admin', "Welcome!"));
    socket.broadcast.to(user.room).emit("helloMessage", generateMessage('Admin', `${user.username} has joined! `));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback()

    //socket.emit
    //io.emit
    //socket.broadcast.emit
    //io.to.emit, socket.broadcast.to.emit
  })

  socket.on("message", (message, callback) => {
    const user = getUser(socket.id)
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }
    io.to(user.room).emit("helloMessage", generateMessage(user.username, message));
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id)
    if (user) {
      io.to(user.room).emit("helloMessage", generateMessage('Admin', `${user.username} has left the room!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });

  socket.on("Location", (coords, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit(
      "sendLocation",
      generateLocation(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)

    );
    callback();
  });
  // socket.emit('countUpdated', count)

  // socket.on('increment', () => {
  //     count++;
  //     //socket.emit only sends to the current connection but io sends to all the connections
  //     // socket.emit('countUpdated', count)
  //     io.emit('countUpdated', count)
  // })
});
server.listen(port, () => {
  console.log("Up and running on " + port);
});