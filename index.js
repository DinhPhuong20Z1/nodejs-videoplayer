const app = require("express")();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const fs = require("fs");

var videoPhone;
var videoTv;
var checkPhone = false;
var checkTv = false;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/videoTv.html");
});
app.get("/r", (req, res) => {
  res.sendFile(__dirname + "/videoPhone.html");
});

var mConn = new Map();

io.on("connection", (socket) => {
  mConn.set(socket.id, socket);
  // console.log("MapData: " + JSON.stringify(mConn));
  // mConn.forEach((s, id) => {
  //     console.log("S: " + s + " - ID: ", id);
  // })
  console.log(`${socket.id} connected!`);
  socket.emit("hello", { hello: "world" });
  socket.on("hello yourself", (data) => {
    console.log(data);
  });

  socket.on("registerScreen", (data) => {
    videoPhone = {};
    videoPhone.id = socket.id;
  });

  //   socket.on("sendToScreen", (data) => {
  //     io.to(videoPhone.id).emit("fromRemote", data); // relay from remote to videoPhone!
  //   });

  socket.on("changePhone", () => {
    videoTv = socket.id;

    // io.to(videoPhone.id).emit("remoteWantsNewColor", socket.id);
  });

  socket.on("ClickPlayPhone", (data) => {
    io.to(videoPhone.id).emit(
      "ClickPlayPhone",
      data,
      (checkTv = false),
      (checkPhone = true)
    );
    io.to(videoPhone.id).emit("CheckPlayPhone", (checkPhone = false));
  });

  socket.on("ClickPlayTv", (data) => {
    io.to(videoTv).emit(
      "ClickPlayTv",
      data,
      (checkTv = true),
      (checkPhone = false)
    );

    if (socket[videoTv]) {
      socket[videoTv].disconnect();
    }

    io.to(videoTv).emit("CheckPlayTV", (checkTv = false));
  });

  socket.on("ClickSeekPhone", (data) => {
    io.to(videoPhone.id).emit("ClickSeekPhone", data);
  });

  socket.on("ClickSeekTv", (data) => {
    io.to(videoTv).emit("ClickSeekTv", data);
  });

  socket.on("disconnect", (data) => {
    // mConn.delete(socket.id);
    // mConn.forEach((s, id) => {
    //     console.log("S: " + s + " - ID: ", id);
    // })
    console.log(`${socket.id} disconnected. :(`);
  });

  io.on('connection', (socket) => {
    socket.on('error', (error) => {
      console.log(`${error}  :(`);
    });
  });
});

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

server.listen(3000);
