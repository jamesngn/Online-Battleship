// Retrieve the PlayerId  from localStorage
let ws;
const playerId = localStorage.getItem("playerId") - 1;
const boardBody = document.getElementById(`board-body`);
const shipOptions = document.querySelectorAll(".ship-option");
const proceedButton = document.querySelector("#proceed-button");
const serverMsg = document.querySelector("#server-message");
let selectedShip = null;
let shipRotation = 0;
let previousCellId = 0;

function init() {
  if (ws) {
    ws.onerror = ws.onopen = ws.onclose = null;
  }
  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => {
    console.log("Connection opened!");
    const objectToSend = { type: "in_game", action: "require_game_state" };
    ws.send(JSON.stringify(objectToSend));
  };
  ws.onmessage = ({ data }) => handleMessage(data);
  ws.onclose = function () {
    ws = null;
  };
  addShipOptionListener();
  addCellClickListener();
  addCellHoverListener();
  addShipRotationListener();
}
function handleMessage(data) {
  const type = JSON.parse(data).type;
  console.log("receiving type data: " + type);
  if (type === "game_state") {
    const ships = JSON.parse(data).gameState.ships[playerId];
    const board = JSON.parse(data).gameState.boards[playerId];
    const allPlaced = JSON.parse(data).gameState.allPlaced[playerId];
    renderBoard(board);
    renderShipSelection(ships);
    renderProceedButton(allPlaced);
  } else if (type === "reset_selected_ship") {
    selectedShip = null;
  } else if (type === "waiting") {
    const id = JSON.parse(data).playerId;
    console.log(id);
    if (playerId === id) {
      serverMsg.textContent = "Waiting for the other player";
    } else {
      serverMsg.textContent = "The other player is ready for the battleship";
    }
  } else if (type === "battle") {
    window.location.href = "/battleship";
  }
}

function renderBoard(board) {
  boardBody.innerHTML = "";
  for (let row = 0; row < board.length; row++) {
    // Create a new row element
    const newRow = document.createElement("tr");

    for (let col = 0; col < board[row].length; col++) {
      // Create a new cell element
      const newCell = document.createElement("td");
      newCell.setAttribute("id", `cell-${row}-${col}`);
      if (board[row][col].preview) {
        newCell.classList.add("ship-preview");
      }
      if (board[row][col].ship !== "empty") {
        newCell.classList.add("ship-placed");
      }
      newRow.appendChild(newCell);
    }
    // Append the row to the table body
    boardBody.appendChild(newRow);
  }
}
function renderShipSelection(ships) {
  ships.forEach((ship) => {
    shipOptions.forEach((shipOption) => {
      if (ship.type === shipOption.getAttribute("data-ship-type")) {
        if (ship.placed === true) {
          shipOption.classList.add("disabled");
          shipOption.classList.remove("selected");
        }
      }
    });
  });
}

function renderProceedButton(allPlaced) {
  console.log("rendering proceed button: allPlaced is " + allPlaced);
  allPlaced
    ? proceedButton.classList.remove("disabled")
    : proceedButton.classList.add("disabled");
}

function addShipOptionListener() {
  shipOptions.forEach((shipOption) => {
    shipOption.addEventListener("click", () => {
      // Remove the 'selected' class from all ship-options
      if (shipOption.classList.contains("selected")) {
        shipOptions.forEach((option) => option.classList.remove("selected"));
      } else {
        shipOptions.forEach((option) => option.classList.remove("selected"));
        // Add the 'selected' class to the clicked ship-option
        shipOption.classList.add("selected");
        console.log(shipOption);
        selectedShip = shipOption.getAttribute("data-ship-type");
        shipRotation = 0;
      }
    });
  });
}

function addCellClickListener() {
  boardBody.addEventListener("click", (event) => {
    if (event.target.tagName === "TD") {
      const cellId = event.target.getAttribute("id");
      const [row, column] = getRowAndColumnFromCellId(cellId);
      console.log(
        "selecting ship " + selectedShip + " and placing it on " + cellId
      );
      const objectToSend = {
        type: "in_game",
        action: "place_ship",
        info: {
          playerId: playerId,
          col: column,
          row: row,
          type: selectedShip,
          rotation: shipRotation,
        },
      };
      ws.send(JSON.stringify(objectToSend));
    }
  });
}
function addCellHoverListener() {
  boardBody.addEventListener("mouseover", (event) => {
    if (event.target.tagName === "TD") {
      const cellId = event.target.getAttribute("id");
      if (cellId !== previousCellId) {
        const [row, column] = getRowAndColumnFromCellId(cellId);
        previousCellId = cellId;
        const objectToSend = {
          type: "in_game",
          action: "preview_ship",
          info: {
            playerId,
            row,
            col: column,
            type: selectedShip,
            rotation: shipRotation,
          },
        };
        ws.send(JSON.stringify(objectToSend));
      }
    }
  });
  boardBody.addEventListener("mouseout", (event) => {
    const objectToSend = {
      type: "in_game",
      action: "hide_preview_ship",
      info: {
        playerId,
      },
    };
    ws.send(JSON.stringify(objectToSend));
  });
}
function addShipRotationListener() {
  boardBody.addEventListener("contextmenu", (event) => {
    if (event.target.tagName === "TD") {
      event.preventDefault();
      const cellId = event.target.getAttribute("id");
      const [row, column] = getRowAndColumnFromCellId(cellId);
      if (shipRotation !== null) {
        if (shipRotation === 3) {
          shipRotation = 0;
        } else {
          shipRotation++;
        }
      }
      const objectToSend = {
        type: "in_game",
        action: "preview_ship",
        info: {
          playerId,
          row,
          col: column,
          type: selectedShip,
          rotation: shipRotation,
        },
      };
      ws.send(JSON.stringify(objectToSend));
    }
  });
}

function getRowAndColumnFromCellId(cellId) {
  // Split the string by the "-" character
  const parts = cellId.split("-");

  // Parse the row and column numbers
  const row = parseInt(parts[1]);
  const column = parseInt(parts[2]);

  return [row, column];
}

init();
proceedButton.onclick = () => {
  const objectToSend = {
    type: "in_game",
    action: "proceed_battle",
    playerId: playerId,
  };
  ws.send(JSON.stringify(objectToSend));
};
