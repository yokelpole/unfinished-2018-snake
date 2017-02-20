import * as express from "express";
import {StartRequest, MoveRequest} from "../types/battlesnake"

const router = express.Router();

// Handle POST request to '/start'
router.post('/start', function (req: StartRequest, res: express.Response) {
  // NOTE: Do something here to start the game
  const requestData = req.body;

  // Response data
  const responseData = {
    color: "#DFFF00",
    name: "Trump Snake",
    head_url: "http://www.placecage.com/c/200/200", // optional, but encouraged!
    taunt: requestData.game_id // optional, but encouraged!
  };

  return res.json(responseData);
});

// Handle POST request to '/move'
router.post('/move', function (req: MoveRequest, res: express.Response) {
  // NOTE: Do something here to generate your move
  const requestData = req.body;

  // Response data
  const responseData = {
    move: 'up', // one of: ['up','down','left','right']
    taunt: requestData.you, // optional, but encouraged!
  };

  return res.json(responseData);
});

module.exports = router;
