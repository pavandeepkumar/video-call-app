const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors')
const app = express();
app.use(cors({
    origin: '*'
}))
const server = createServer(app);
const io = new Server(server, { cors: true });
const emailToSocketMap = new Map();
const socketToEmailMap = new Map();
io.on("connection", (socket) => {
    console.log(`socket ${socket.id} connected`);

    // send an event to the client
    socket.emit("foo", "bar");


    socket.on("room:join", (data) => {
        // an event was received from the client
        console.log("Data received from", data)
        const { roomId, email } = data
        emailToSocketMap.set(email, socket.id)
        io.to(roomId).emit("room:joined", { email, id: socket.id })
        socket.join(roomId)
        socketToEmailMap.set(socket.id, email)
        io.to(socket.id).emit("room:join", data)
    });


    socket.on("user:call", (data) => {
        console.log("User call  from frontend", data)
        const { offer, to } = data
        io.to(to).emit("incoming:call", { from: socket.id, offer })
    })

    socket.on("call:accepted", ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
    });

    socket.on("peer:nego:needed", ({ to, offer }) => {
        console.log("peer:nego:needed", offer);
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });

    socket.on("peer:nego:done", ({ to, ans }) => {
        console.log("peer:nego:done", ans);
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });

    // upon disconnection

});
app.get('/', (req, res) => {
    return res.json({
        status: "True",
        sucess: true
    })
})
const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Server listening on ${PORT}  `))

module.exports = server


