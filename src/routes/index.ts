import * as express from "express";
import * as _ from "lodash";
import * as snakeLibs from "../libs/snakeLibs";
import { getScoredDirections } from "../libs/getScoredDirections";
import { getPossibleSnakeMoves } from '../libs/getPossibleSnakeMoves';
import {
  StartRequest,
  MoveRequest,
  StartResponse,
  MoveResponse,
  MoveResponseData,
  StartResponseData,
  Snake,
  ScoredDirections
} from "../types/battlesnake";

interface BattleSnakeRouter {
  post(
    route: "/start",
    cb: (req: StartRequest, res: StartResponse) => any
  ): void;
  post(route: "/move", cb: (req: MoveRequest, res: MoveResponse) => any): void;
  post(route: "/end", cb: (req, res) => any): void;
  post(route: "/ping", cb: (req, res) => any): void;
}

const router: BattleSnakeRouter = express.Router();

// Handle POST request to '/start'
router.post(
  "/start",
  (req: StartRequest, res: StartResponse): StartResponse => {
    // NOTE: Do something here to start the game
    const requestData = req.body;

    // Response data
    const responseData: StartResponseData = {
      color: "#FFFF00",
      name: "Protosnake",
      head_url: "http://www.placecage.com/c/200/200", // optional, but encouraged!
      taunt: "Compiling..." // optional, but encouraged!
    };

    return res.json(responseData);
  }
);

// Handle POST request to '/move'
router.post("/move", (req: MoveRequest, res: MoveResponse): MoveResponse => {
  const requestData = req.body;

  // Own snake data.
  const testedSnake: Snake = snakeLibs.pruneSnakesTailsIfNotEaten([
    requestData.you
  ])[0];

  // Obstacles.
  const allSnakes: Array<Snake> = snakeLibs.pruneSnakesTailsIfNotEaten(
    requestData.board.snakes
  );
  const otherSnakes: Array<Snake> = _(allSnakes)
    .reject({ id: testedSnake.id })
    .value();
  const food = requestData.board.food;

  // Try to estimate what each snake's optimal next move would be.
  // TODO: Make this able to be executed multiple times with lessening scores.
  const possibleNextMovesForOtherSnakes: Array<Snake> = getPossibleSnakeMoves(
    otherSnakes,
    allSnakes,
    food,
    requestData
  );

  // Assign the directions that we can go without hitting a snake or food.
  const scoredDirections: ScoredDirections = getScoredDirections(
    testedSnake,
    possibleNextMovesForOtherSnakes,
    food,
    requestData.board.width,
    requestData.board.height
  );

  // Choose the highest value in the scored directions and go with it.
  const move = _.maxBy(
    _.keys(scoredDirections),
    direction => scoredDirections[direction]
  );

  // Response data
  const responseData: MoveResponseData = { move };
  console.log(`### GAME TURN ${requestData.turn}`);
  console.log("### SCORED DIRECTIONS");
  console.log(scoredDirections);
  console.log(responseData);
  return res.json(responseData);
});

router.post("/end", (request, response) => response.json({}));
router.post("/ping", (request, response) => response.json({}));

module.exports = router;
