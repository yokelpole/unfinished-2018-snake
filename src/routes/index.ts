import * as express from "express";
import {
  StartRequest, MoveRequest, StartResponse, MoveResponse, MoveResponseData,
  StartResponseData
} from "../types/battlesnake"

interface BattleSnakeRouter {
  post(route: "/start", cb: (req: StartRequest, res: StartResponse) => any): void;
  post(route: "/move", cb: (req: MoveRequest, res: MoveResponse) => any): void;
}

const router: BattleSnakeRouter = express.Router();

// Handle POST request to '/start'
router.post('/start', (req: StartRequest, res: StartResponse): StartResponse => {
  // NOTE: Do something here to start the game
  const requestData = req.body;

  // Response data
  const responseData: StartResponseData = {
    color: "#710bff",
    name: "Type Snake",
    head_url: "http://www.placecage.com/c/200/200", // optional, but encouraged!
    taunt: requestData.game_id // optional, but encouraged!
  };

  return res.json(responseData);
});

// Handle POST request to '/move'
router.post('/move', (req: MoveRequest, res: MoveResponse): MoveResponse => {
  // NOTE: Do something here to generate your move
  const requestData = req.body;

  // Response data
  const responseData: MoveResponseData = {
    move: "up", // one of: ['up','down','left','right']
    taunt: requestData.you // optional, but encouraged!
  };

  return res.json(responseData);
});

module.exports = router;
