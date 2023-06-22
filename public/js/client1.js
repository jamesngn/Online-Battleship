const readyBtn = document.querySelector("#ready-button");
const messageBox = document.querySelector("#server-messages");
let ws;
let count = 5;

function startGameCountdown() {
  showMessage("Starting in " + count + "..");
  count--;

  if (count >= 0) {
    setTimeout(startGameCountdown, 1000); // Delay of 1 second
  }
  if (count == 0) {
    window.location.href = "/shipPlacement";
  }
}

function handleMessage(data) {
  const message = JSON.parse(data).type;
  let playerId = JSON.parse(data).playerIndex
    ? JSON.parse(data).playerIndex
    : null;
  console.log("Client side received data from server: " + message);
  if (message === "waiting") {
    showMessage("Waiting for another player");
  } else if (message === "game_in_progress") {
    showMessage("Game in progress...");
  } else if (message === "start") {
    localStorage.setItem("playerId", playerId);
    // startGameCountdown();
    window.location.href = "/shipPlacement";
  }
}

function showMessage(message) {
  const messageElement = document.createElement("p");
  messageElement.textContent = message;
  messageBox.appendChild(messageElement);
}

function init() {
  if (ws) {
    ws.onerror = ws.onopen = ws.onclose = null;
  }
  ws = new WebSocket("wss://online-battleship-a3a18b105d89.herokuapp.com/");
  // ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => {
    console.log("Connection opened!");
  };
  ws.onmessage = ({ data }) => handleMessage(data);
  ws.onclose = function () {
    ws = null;
  };
}

// Add event listeners or perform operations on each button
readyBtn.addEventListener("click", () => {
  if (!ws) {
    console.log("No WebSocket Connection :(");
    return;
  }
  let data;
  readyBtn.classList.toggle("ready");
  if (readyBtn.classList.contains("ready")) {
    readyBtn.textContent = "Ready";
    data = JSON.stringify({ type: "ready" });
  } else {
    readyBtn.textContent = "Not Ready";
    data = JSON.stringify({ type: "un-ready" });
  }
  ws.send(data);
});

init();
