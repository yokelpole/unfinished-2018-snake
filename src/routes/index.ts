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
    requestData.snakes.data
  );
  const otherSnakes: Array<Snake> = _(allSnakes)
    .reject({ id: testedSnake.id })
    .value();
  const food = requestData.food.data;

  // Try to estimate what each snake's optimal next move would be.
  // TODO: Make this able to be executed multiple times with lessening scores.
  const possibleNextMovesForOtherSnakes: Array<Snake> = _.map(
    otherSnakes,
    (snake: Snake) => {
      const scoredDirections = snakeLibs.getScoredDirections(
        snake,
        _(allSnakes)
          .reject({ id: snake.id })
          .value(),
        food,
        requestData.width,
        requestData.height
      );

      // Add to the snake where there is a possible scored direction.
      const maxValue = _.max(_.values(scoredDirections));
      const topMoves = _.keys(_.pickBy(scoredDirections, x => x === maxValue));

      // TODO: Check to see if the snake will gain an extra length point.
      // TODO: Treat where the snake actually is differently than where the snake could be.
      const snakeHead = snake.body.data[0];
      _.each(topMoves, direction => {
        const deviation = direction === "up" || direction === "left" ? -1 : +1;
        snake.body.data.push({
          x:
            direction === "left" || direction === "right"
              ? snakeHead.x + deviation
              : snakeHead.x,
          y:
            direction === "up" || direction === "down"
              ? snakeHead.y + deviation
              : snakeHead.y,
          object: "point",
          type: "possible_snake"
        });
      });

      return snake;
    }
  );

  // Assign the directions that we can go without hitting a snake or food.
  const scoredDirections: ScoredDirections = snakeLibs.getScoredDirections(
    testedSnake,
    possibleNextMovesForOtherSnakes,
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
  const taunt = "I am under construction!";

  // Response data
  const responseData: MoveResponseData = { move, taunt };
  console.log(`### GAME TURN ${requestData.turn}`);
  console.log(responseData);
  //console.log("### REQUEST DATA");
  //console.log(JSON.stringify(requestData));
  return res.json(responseData);
});

module.exports = router;
