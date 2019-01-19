import * as express from "express";
import * as _ from "lodash";
import * as snakeLibs from "../libs/snakeLibs";
import { getPossibleSnakeMoves } from '../libs/getPossibleSnakeMoves';
import {
  StartRequest,
  MoveRequest,
  StartResponse,
  MoveResponse,
  MoveResponseData,
  StartResponseData,
  Snake,
  Point,
  ScoredDirections
} from "../types/battlesnake";

interface BattleSnakeRouter {
  post(
    route: "/start",
    cb: (req: StartRequest, res: StartResponse) => any
  ): void;
  post(route: "/move", cb: (req: MoveRequest, res: MoveResponse) => any): void;
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
  console.log('### IN MOVE');
  console.log(requestData);

  // Own snake data.
  const testedSnake: Snake = snakeLibs.pruneSnakesTailsIfNotEaten([
    requestData.you
  ])[0];

  console.log('### PAST GETTING SNAKE TAILS PRUNED');

  // Obstacles.
  const allSnakes: Array<Snake> = snakeLibs.pruneSnakesTailsIfNotEaten(
    requestData.board.snakes
  );
  const otherSnakes: Array<Snake> = _(allSnakes)
    .reject({ id: testedSnake.id })
    .value();
  const food = requestData.board.food;

  console.log('### GOT PAST THE OBSTACLES');

  // Try to estimate what each snake's optimal next move would be.
  // TODO: Make this able to be executed multiple times with lessening scores.
  const possibleNextMovesForOtherSnakes: Array<Snake> = getPossibleSnakeMoves(
    otherSnakes,
    allSnakes,
    food,
    requestData
  );

  console.log('### DONE ESTIMATING THE MOVES FOR SNAKES');
  
  // Assign the directions that we can go without hitting a snake or food.
  const scoredDirections: ScoredDirections = snakeLibs.getScoredDirections(
    testedSnake,
    possibleNextMovesForOtherSnakes,
    food,
    requestData.board.width,
    requestData.board.height
  );

    console.log('### DONE SCORING DIRECTIONS');

  // Choose the highest value in the scored directions and go with it.
  const move = _.maxBy(
    _.keys(scoredDirections),
    direction => scoredDirections[direction]
  );
  console.log('### ASSEMBLING RESPONSE DATA');

  // Response data
  const responseData: MoveResponseData = { move };
  console.log(`### GAME TURN ${requestData.turn}`);
  console.log("### SCORED DIRECTIONS");
  console.log(scoredDirections);
  console.log(responseData);
  return res.json(responseData);
});

module.exports = router;
