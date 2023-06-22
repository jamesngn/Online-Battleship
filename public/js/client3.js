let ws;
const playerId = localStorage.getItem("playerId") - 1;
const playerBoardCtn = document.querySelector(".player-board");
const opponentBoardCtn = document.querySelector(".opponent-board");
const turnMsgCtn = document.querySelector("#turn-message");
let myTurn = false;

function handleMessage(data) {
  const type = JSON.parse(data).type;
  console.log(type);
  if (type === "game_state") {
    const playerBoard = JSON.parse(data).gameState.boards[playerId];
    renderPlayerBoard(playerBoard);
    const opponentBoard =
      playerId - 1 === 0
        ? JSON.parse(data).gameState.boards[playerId - 1]
        : JSON.parse(data).gameState.boards[playerId + 1];
    renderOpponentBoard(opponentBoard);
    const gameOver = JSON.parse(data).gameState.gameOver;
    if (!gameOver) {
      const turnId = JSON.parse(data).gameState.turnId;
      if (playerId === turnId) {
        myTurn = true;
        turnMsgCtn.textContent = "YOUR TURN";
      } else {
        myTurn = false;
        turnMsgCtn.textContent = "OPPONENT TURN";
      }
    } else {
      const winner = JSON.parse(data).gameState.winner;
      if (winner === playerId) {
        turnMsgCtn.textContent = "YOU WIN";
      } else {
        turnMsgCtn.textContent = "YOU LOSE";
      }
      const objectToSend = { type: "game_over", action: "reset_game" };
      ws.send(JSON.stringify(objectToSend));
    }
  }
}

function init() {
  if (ws) {
    ws.onerror = ws.onopen = ws.onclose = null;
  }
  // ws = new WebSocket("wss://online-battleship-a3a18b105d89.herokuapp.com/");
  ws = new WebSocket("ws://localhost:8080");

  ws.onopen = () => {
    console.log("Connection opened!");
    const objectToSend = {
      type: "in_game",
      action: "render_boards_first_time",
    };
    ws.send(JSON.stringify(objectToSend));
  };
  ws.onmessage = ({ data }) => handleMessage(data);
  ws.onclose = function () {
    ws = null;
  };
  addOpponentCellClickListener();
}
function renderPlayerBoard(playerBoard) {
  playerBoardCtn.innerHTML = "";
  for (let row = 0; row < playerBoard.length; row++) {
    // Create a new row element
    const newRow = document.createElement("tr");

    for (let col = 0; col < playerBoard[row].length; col++) {
      // Create a new cell element
      const newCell = document.createElement("td");
      if (playerBoard[row][col].shoot) {
        if (playerBoard[row][col].hit) {
          newCell.classList.add("hit");
        } else {
          newCell.classList.add("missed");
        }
      }
      newCell.setAttribute("id", `cell-${row}-${col}`);
      if (playerBoard[row][col].ship !== "empty") {
        newCell.classList.add("ship-placed");
      }
      newRow.appendChild(newCell);
    }
    // Append the row to the table body
    playerBoardCtn.appendChild(newRow);
  }
}
function renderOpponentBoard(opponentBoard) {
  opponentBoardCtn.innerHTML = "";
  for (let row = 0; row < opponentBoard.length; row++) {
    // Create a new row element
    const newRow = document.createElement("tr");

    for (let col = 0; col < opponentBoard[row].length; col++) {
      // Create a new cell element
      const newCell = document.createElement("td");
      if (opponentBoard[row][col].shoot) {
        if (opponentBoard[row][col].hit) {
          newCell.classList.add("hit");
        } else {
          newCell.classList.add("missed");
        }
      }
      newCell.setAttribute("id", `cell-${row}-${col}`);

      newRow.appendChild(newCell);
    }
    // Append the row to the table body
    opponentBoardCtn.appendChild(newRow);
  }
}
function addOpponentCellClickListener() {
  opponentBoardCtn.onclick = (event) => {
    if (myTurn && event.target.tagName === "TD") {
      const cellId = event.target.getAttribute("id");
      const [row, column] = getRowAndColumnFromCellId(cellId);
      const opponentId = playerId - 1 === 0 ? playerId - 1 : playerId + 1;
      const objectToSend = {
        type: "in_game",
        action: "shoot_ship",
        info: {
          playerId: playerId,
          opponentId: opponentId,
          col: column,
          row: row,
        },
      };
      myTurn = false;
      ws.send(JSON.stringify(objectToSend));
    }
  };
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
