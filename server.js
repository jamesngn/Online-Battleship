const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");
const ejs = require("ejs");
const GameController = require("./controllers/gameController");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize the game controller
new GameController(wss);

// Set the views directory
app.set("views", path.join(__dirname, "/views"));
// Set the view engine
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/shipPlacement", (req, res) => {
  res.render("shipPlacement");
});
app.get("/battleship", (req, res) => {
  res.render("battleship");
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "/public")));

const port = process.env.PORT || 8080;

server.listen(port, () => {
  console.log(`Server is listening on ${port}!`);
});
