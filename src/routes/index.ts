import * as express from "express";
import * as _ from "lodash";
import * as snakeLibs from "../libs/snakeLibs";
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
      name: "Guy Fieri",
      head_url: "http://www.placecage.com/c/200/200", // optional, but encouraged!
      taunt: "Time to hop in my convertible and go eat some grease!" // optional, but encouraged!
    };

    return res.json(responseData);
  }
);

// Handle POST request to '/move'
router.post("/move", (req: MoveRequest, res: MoveResponse): MoveResponse => {
  const requestData = req.body;

  // console.log("### REQUEST DATA");
  // console.log(requestData);

  // Own snake data.
  const ownSnake: Snake = snakeLibs.pruneSnakesTailsIfNotEaten([
    requestData.you
  ])[0];

  // Obstacles.
  const allSnakes: Array<Snake> = snakeLibs.pruneSnakesTailsIfNotEaten(
    requestData.snakes.data
  );
  const otherSnakes: Array<Snake> = _(allSnakes)
    .reject({ id: ownSnake.id })
    .value();
  const food = requestData.food.data;

  // Assign the directions that we can go without hitting a snake or food.
  const scoredDirections: ScoredDirections = snakeLibs.getScoredDirections(
    ownSnake,
    otherSnakes,
    food,
    requestData.width,
    requestData.height
  );

  console.log("### SCORED DIRECTIONS");
  console.log(scoredDirections);

  // Choose the highest value in the scored directions and go with it.
  const move = _.maxBy(
    _.keys(scoredDirections),
    direction => scoredDirections[direction]
  );
  const taunt = _.shuffle([
    "This is Gangsta!",
    "This is Money!",
    "We’re Riding the Bus to Flavortown!",
    "Holy [food item], Batman!",
    "Peace, love and taco grease!",
    "I’ve always been an eccentric, a rocker at heart. I can’t play the guitar, but I can play the griddle."
  ])[0];

  // Response data
  const responseData: MoveResponseData = { move, taunt };
  console.log(`### GAME TURN ${requestData.turn}`);
  console.log(responseData);
  return res.json(responseData);
});

module.exports = router;
