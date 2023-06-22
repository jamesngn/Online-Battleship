class GameModel {
  constructor() {
    this.gridSize = 10;
    this.numPlayer = 2;
    this.turnId = 0;
    this.boards = this.initializeBoards();
    this.ships = this.initializeShips();
    this.gameOver = false;
    this.winner = -1;
  }

  initializeBoards() {
    const boards = [];
    for (let i = 0; i < this.numPlayer; i++) {
      boards[i] = this.createEmptyBoard();
    }
    return boards;
  }

  createEmptyBoard() {
    const board = [];
    for (let i = 0; i < this.gridSize; i++) {
      const row = [];
      for (let j = 0; j < this.gridSize; j++) {
        row.push(this.createEmptyCell());
      }
      board.push(row);
    }
    return board;
  }

  createEmptyCell() {
    return { preview: false, shoot: false, hit: false, ship: "empty" };
  }

  initializeShips() {
    const shipTypes = [
      "carrier",
      "battleship",
      "cruiser",
      "submarine",
      "destroyer",
    ];
    const ships = [];
    for (let i = 0; i < this.numPlayer; i++) {
      ships[i] = this.createPlayerShips(shipTypes);
    }
    return ships;
  }

  createPlayerShips(shipTypes) {
    return shipTypes.map((type) => ({ type, placed: false, destroyed: false }));
  }
  showShipPreview(playerId, col, row, type, rotation) {
    this.hideShipPreview(playerId);
    const shipCells = this.getShipCoordinates(
      playerId,
      type,
      row,
      col,
      rotation
    );
    if (shipCells.length !== 0) {
      shipCells.forEach((cell) => {
        cell.preview = true;
      });
    }
  }
  hideShipPreview(playerId) {
    this.boards[playerId].forEach((row) => {
      row.forEach((cell) => {
        cell.preview = false;
      });
    });
  }

  placeShip(playerId, col, row, type, rotation) {
    const shipCells = this.getShipCoordinates(
      playerId,
      type,
      row,
      col,
      rotation
    );
    if (shipCells.length !== 0) {
      shipCells.forEach((cell) => {
        cell.ship = type;
      });
      const playerShips = this.ships[playerId];
      const placedShip = playerShips.find((ship) => ship.type === type);
      if (placedShip) {
        placedShip.placed = true;
      }
      return true;
    }
    return false;
  }

  getShipCoordinates(playerId, type, row, col, rotation) {
    const startRow = row;
    const startCol = col;
    switch (type) {
      case "carrier":
        return this.getCarrierCoordinates(
          playerId,
          startRow,
          startCol,
          rotation
        );
      case "battleship":
        return this.getOtherTypesCoordinates(
          playerId,
          startRow,
          startCol,
          rotation,
          5
        );
      case "cruiser":
        return this.getOtherTypesCoordinates(
          playerId,
          startRow,
          startCol,
          rotation,
          4
        );
      case "submarine":
        return this.getOtherTypesCoordinates(
          playerId,
          startRow,
          startCol,
          rotation,
          3
        );
      case "destroyer":
        return this.getOtherTypesCoordinates(
          playerId,
          startRow,
          startCol,
          rotation,
          2
        );
      default:
        return [];
    }
  }

  getCarrierCoordinates(playerId, startRow, startCol, rotation) {
    const cellNum = 6;
    const shipCells = [];
    const directions = [
      { rowDiff: 0, colDiff: 1, row2: -1, col2: 1 },
      { rowDiff: 1, colDiff: 0, row2: 1, col2: 1 },
      { rowDiff: 0, colDiff: -1, row2: 1, col2: -1 },
      { rowDiff: -1, colDiff: 0, row2: -1, col2: -1 },
    ];
    const direction = directions[rotation];

    for (let i = 0; i < cellNum; i++) {
      const m1 = i > 2 ? 1 : 0;
      const m2 = i > 2 ? i - 3 : i;
      const row = startRow + direction.rowDiff * m2 + direction.row2 * m1;
      const col = startCol + direction.colDiff * m2 + direction.col2 * m1;
      if (
        !this.isValidCell(row, col) ||
        this.isOccupiedCell(playerId, row, col)
      ) {
        return [];
      }
      shipCells.push(this.boards[playerId][row][col]);
    }

    return shipCells;
  }
  getOtherTypesCoordinates(playerId, startRow, startCol, rotation, cellNum) {
    const shipCells = [];
    const directions = [
      { rowDiff: 0, colDiff: 1 },
      { rowDiff: 1, colDiff: 0 },
      { rowDiff: 0, colDiff: -1 },
      { rowDiff: -1, colDiff: 0 },
    ];
    const direction = directions[rotation];

    for (let i = 0; i < cellNum; i++) {
      const row = startRow + direction.rowDiff * i;
      const col = startCol + direction.colDiff * i;
      if (
        !this.isValidCell(row, col) ||
        this.isOccupiedCell(playerId, row, col)
      ) {
        return [];
      }
      shipCells.push(this.boards[playerId][row][col]);
    }
    return shipCells;
  }

  isValidCell(row, col) {
    return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
  }

  isOccupiedCell(playerId, row, col) {
    return this.boards[playerId][row][col].ship !== "empty";
  }

  shoot(playerId, opponentId, row, col) {
    const result = { isValid: true, isHit: false };
    const shootCell = this.boards[opponentId][row][col];
    if (!shootCell.shoot) {
      shootCell.shoot = true;
    } else {
      result.isValid = false;
    }

    if (shootCell.ship !== "empty") {
      shootCell.hit = true;
      shootCell.ship = "empty";
      result.isHit = true;
      if (this.checkLose(opponentId)) {
        this.gameOver = true;
        this.winner = playerId;
      }
    }
    return result;
  }

  checkAllShipsPlaced(playerId) {
    const playerShips = this.ships[playerId];
    for (const ship of playerShips) {
      if (!ship.placed) {
        return false;
      }
    }
    return true;
  }

  checkLose(playerId) {
    return (
      this.checkShipDestroyed(playerId, "carrier") &&
      this.checkShipDestroyed(playerId, "battleship") &&
      this.checkShipDestroyed(playerId, "cruiser") &&
      this.checkShipDestroyed(playerId, "submarine") &&
      this.checkShipDestroyed(playerId, "destroyer")
    );
  }

  checkShipDestroyed(playerId, type) {
    for (const row of this.boards[playerId]) {
      for (const cell of row) {
        if (cell.ship === type) {
          return false;
        }
      }
    }
    return true;
  }

  getGameState() {
    return {
      gridSize: this.gridSize,
      boards: this.boards,
      ships: this.ships,
      gameOver: this.gameOver,
      turnId: this.turnId,
      winner: this.winner,
      allPlaced: [this.checkAllShipsPlaced(0), this.checkAllShipsPlaced(1)],
    };
  }
}

module.exports = GameModel;

// class GameModel {
//   constructor() {
//     this.gridSize = 10;
//     this.boards = [];
//     this.numPlayer = 2;
//     this.turnId = 0;
//     for (let i = 0; i < this.numPlayer; i++) {
//       this.boards[i] = this.createEmptyBoard();
//     }
//     this.ships = [
//       [
//         { type: "carrier", placed: false, destroyed: false },
//         { type: "battleship", placed: false, destroyed: false },
//         { type: "cruiser", placed: false, destroyed: false },
//         { type: "submarine", placed: false, destroyed: false },
//         { type: "destroyer", placed: false, destroyed: false },
//       ],
//       [
//         { type: "carrier", placed: false, destroyed: false },
//         { type: "battleship", placed: false, destroyed: false },
//         { type: "cruiser", placed: false, destroyed: false },
//         { type: "submarine", placed: false, destroyed: false },
//         { type: "destroyer", placed: false, destroyed: false },
//       ],
//     ];
//     this.gameOver = false;
//     this.winner = -1;
//   }
//   createEmptyBoard() {
//     const board = [];
//     for (let i = 0; i < this.gridSize; i++) {
//       const row = [];
//       for (let j = 0; j < this.gridSize; j++) {
//         row.push({ shoot: false, hit: false, ship: "empty" });
//       }
//       board.push(row);
//     }
//     return board;
//   }
//   placeShip(playerId, col, row, type, rotation) {
//     const shipCells = this._getShipCoordinates({
//       playerId: playerId,
//       type: type,
//       rotation: rotation,
//       startCoordinates: { row: row, col: col },
//     });
//     if (shipCells.length !== 0) {
//       shipCells.forEach((cell) => {
//         cell.ship = type;
//       });
//       this.ships[playerId].forEach((ship) => {
//         if (ship.type === type) {
//           ship.placed = true;
//         }
//       });
//     }
//   }
//   shoot(playerId, opponentId, row, col) {
//     const shootCell = this.boards[opponentId][row][col];
//     shootCell.shoot = true;
//     if (shootCell.ship !== "empty") {
//       shootCell.hit = true;
//       shootCell.ship = "empty";
//       if (this._checkLose(opponentId)) {
//         this.gameOver = true;
//         this.winner = playerId;
//       }
//       return true;
//     }
//     return false;
//   }
//   getGameState() {
//     return {
//       gridSize: this.gridSize,
//       boards: this.boards,
//       ships: this.ships,
//       gameOver: this.gameOver,
//       turnId: this.turnId,
//       winner: this.winner,
//     };
//   }
//   _clearPreviewState(playerId) {
//     this.boards[playerId].forEach((row) => {
//       row.forEach((cell) => {
//         cell.preview = false;
//       });
//     });
//   }
//   _checkLose(id) {
//     return this._checkShipDestroyed(id, "carrier");
//   }
//   _checkShipDestroyed(id, type) {
//     for (const row of this.boards[id]) {
//       for (const cell of row) {
//         if (cell.ship === type) {
//           return false;
//         }
//       }
//     }
//     return true;
//   }

//   _getShipCoordinates(shipInfo) {
//     var shipCells = [];
//     const playerId = shipInfo.playerId;
//     const type = shipInfo.type;
//     const rotation = shipInfo.rotation;
//     const startRow = shipInfo.startCoordinates.row;
//     const startCol = shipInfo.startCoordinates.col;
//     switch (type) {
//       case "carrier":
//         if (
//           rotation === 0 &&
//           this.boards[playerId][startRow - 1] &&
//           this.boards[playerId][startRow - 1][startCol + 3]
//         ) {
//           shipCells.push(this.boards[playerId][startRow][startCol]);
//           shipCells.push(this.boards[playerId][startRow][startCol + 1]);
//           shipCells.push(this.boards[playerId][startRow][startCol + 2]);
//           shipCells.push(this.boards[playerId][startRow - 1][startCol + 1]);
//           shipCells.push(this.boards[playerId][startRow - 1][startCol + 2]);
//           shipCells.push(this.boards[playerId][startRow - 1][startCol + 3]);
//           break;
//         } else if (
//           rotation === 1 &&
//           this.boards[playerId][startRow + 3] &&
//           this.boards[playerId][startRow + 3][startCol + 1]
//         ) {
//           shipCells.push(this.boards[playerId][startRow][startCol]);
//           shipCells.push(this.boards[playerId][startRow + 1][startCol]);
//           shipCells.push(this.boards[playerId][startRow + 2][startCol]);
//           shipCells.push(this.boards[playerId][startRow + 1][startCol + 1]);
//           shipCells.push(this.boards[playerId][startRow + 2][startCol + 1]);
//           shipCells.push(this.boards[playerId][startRow + 3][startCol + 1]);
//           break;
//         } else if (
//           rotation === 2 &&
//           this.boards[playerId][startRow + 1] &&
//           this.boards[playerId][startRow + 1][startCol - 3]
//         ) {
//           shipCells.push(this.boards[playerId][startRow][startCol]);
//           shipCells.push(this.boards[playerId][startRow][startCol - 1]);
//           shipCells.push(this.boards[playerId][startRow][startCol - 2]);
//           shipCells.push(this.boards[playerId][startRow + 1][startCol - 1]);
//           shipCells.push(this.boards[playerId][startRow + 1][startCol - 2]);
//           shipCells.push(this.boards[playerId][startRow + 1][startCol - 3]);
//           break;
//         } else if (
//           rotation === 3 &&
//           this.boards[playerId][startRow + 1] &&
//           this.boards[playerId][startRow - 3][startCol - 1]
//         ) {
//           shipCells.push(this.boards[playerId][startRow][startCol]);
//           shipCells.push(this.boards[playerId][startRow - 1][startCol]);
//           shipCells.push(this.boards[playerId][startRow - 2][startCol]);
//           shipCells.push(this.boards[playerId][startRow - 1][startCol - 1]);
//           shipCells.push(this.boards[playerId][startRow - 2][startCol - 1]);
//           shipCells.push(this.boards[playerId][startRow - 3][startCol - 1]);
//           break;
//         }
//       default:
//         break;
//     }
//     return shipCells;
//   }
// }
// module.exports = GameModel;
