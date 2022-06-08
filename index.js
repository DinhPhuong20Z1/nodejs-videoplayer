const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const fs = require("fs");

var screen

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/screen.html')
})
app.get('/r', (req, res) => {
    res.sendFile(__dirname + '/remote.html')
})

io.on('connection', (socket) => {
    console.log(`${socket.id} connected!`)
    socket.emit('hello', {hello: 'world'})
    socket.on('hello yourself', (data) => {
        console.log(data)
    })

    socket.on('registerScreen', (data) => {
        screen = {}
        screen.id = socket.id
    })

    socket.on('sendToScreen', (data) => {
        console.log('screen',screen)
        io.to(screen.id).emit('fromRemote', data)// relay from remote to screen!
    })

    socket.on('changeColor', () => {
        io.to(screen.id).emit('remoteWantsNewColor', socket.id)
    })

    socket.on('changeVideo', (data) => {
        io.to(screen.id).emit('remoteWantsVideo', data)
    })

    socket.on('disconnect', (data) => {
        console.log(`${socket.id} disconnected. :(`)
    })

    socket.on('thanks', (data) => {
        io.to(data).emit('thanks', socket.id)
    })
})

app.get("/video", function (req, res) {
    // Ensure there is a range given for the video
    const range = req.headers.range;
    if (!range) {
      res.status(400).send("Requires Range header");
    }
  
    // get video stats (about 61MB)
    const videoPath = "bigbuck.mp4";
    const videoSize = fs.statSync("bigbuck.mp4").size;
  
    // Parse Range
    // Example: "bytes=32324-"
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  
    // Create headers
    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    };
  
    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);
  
    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });
  
    // Stream the video chunk to the client
    videoStream.pipe(res);
  });

server.listen(3000)