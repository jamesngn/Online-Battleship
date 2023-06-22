const GameModel = require("../models/model");

class GameController {
  constructor(wss) {
    this.wss = wss;
    this.gameState = {
      players: [],
      playersReadyToBattle: [],
      isGameStarted: false,
    };
    this.model = new GameModel();
    this.wss.on("connection", this.handlePlayerConnection.bind(this));
  }

  handlePlayerConnection(ws) {
    ws.on("message", (message) => {
      const data = JSON.parse(message);

      if (data.type === "ready") {
        this.handlePlayerJoin(ws);
      } else if (data.type === "un-ready") {
        this.handlePlayerNotJoin(ws);
      } else if (data.type === "in_game") {
        if (data.action === "place_ship") {
          this.handlePlaceShip(ws, data.info);
        } else if (data.action === "proceed_battle") {
          this.handleProceedBattle(ws, data.playerId);
        } else if (data.action === "shoot_ship") {
          this.handleShootShip(data.info);
        } else if (data.action === "preview_ship") {
          this.handlePreviewShip(data.info);
        } else if (data.action === "hide_preview_ship") {
          this.handleHidePreviewShip(data.info);
        }
        this.sendGameStateToAll();
      } else if (data.type === "game_over") {
        if (data.action === "reset_game") {
          this.handleResetGameState();
        }
      }
    });
  }

  handlePlayerNotJoin(ws) {
    this.gameState.players = this.gameState.players.filter(
      (player) => player !== ws
    );
  }

  handlePlayerJoin(ws) {
    if (this.gameState.isGameStarted) {
      ws.send(JSON.stringify({ type: "game_in_progress" }));
      return;
    }

    this.gameState.players.push(ws);

    if (this.gameState.players.length === 2) {
      this.startGame();
    } else {
      ws.send(JSON.stringify({ type: "waiting" }));
    }
  }

  startGame() {
    this.gameState.isGameStarted = true;
    this.gameState.players.forEach((player, index) => {
      player.send(JSON.stringify({ type: "start", playerIndex: index + 1 }));
    });

    this.handleResetGameState();
  }

  handleResetGameState() {
    this.gameState.players = [];
    this.gameState.isGameStarted = false;
    this.model = new GameModel();
  }

  handlePlaceShip(ws, info) {
    if (
      this.model.placeShip(
        info.playerId,
        info.col,
        info.row,
        info.type,
        info.rotation
      )
    ) {
      ws.send(JSON.stringify({ type: "reset_selected_ship" }));
    }
  }
  handlePreviewShip(info) {
    this.model.showShipPreview(
      info.playerId,
      info.col,
      info.row,
      info.type,
      info.rotation
    );
  }
  handleHidePreviewShip(info) {
    this.model.hideShipPreview(info.playerId);
  }

  handleProceedBattle(ws, playerId) {
    this.gameState.playersReadyToBattle.push(ws);
    if (this.gameState.playersReadyToBattle.length === 2) {
      this.sendGameMessageToAll({ type: "battle" });
    } else {
      this.sendGameMessageToAll({ type: "waiting", playerId });
    }
  }

  handleShootShip(info) {
    const { isValid, isHit } = this.model.shoot(
      info.playerId,
      info.opponentId,
      info.row,
      info.col
    );
    if (!isValid) {
      this.model.turnId = info.playerId;
    } else {
      if (isHit) {
        this.model.turnId = info.playerId;
      } else {
        this.model.turnId = info.opponentId;
      }
    }
  }

  sendGameStateToAll() {
    const gameState = this.model.getGameState();
    this.sendGameMessageToAll({
      type: "game_state",
      action: "render_board",
      gameState,
    });
  }

  sendGameMessageToAll(message) {
    this.wss.clients.forEach((ws) => {
      ws.send(JSON.stringify(message));
    });
  }
}

module.exports = GameController;
