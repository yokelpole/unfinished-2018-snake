import * as express from "express";
import * as _ from "lodash";
import {
  StartRequest,
  MoveRequest,
  StartResponse,
  MoveResponse,
  MoveResponseData,
  StartResponseData,
  Snake,
  Point
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
      color: "#CCCCFF",
      name: "Periwinkle the Snake",
      head_url: "http://www.placecage.com/c/200/200", // optional, but encouraged!
      taunt: requestData.game_id // optional, but encouraged!
    };

    return res.json(responseData);
  }
);

function getMove(direction, invalidDirections: {}) {
  console.log('### SETTING MOVE');
  console.log(direction);
  console.log(invalidDirections);
  if (invalidDirections[direction]) return undefined;

  console.log('### WAS NOT INVALID');

  return direction;
}

// Handle POST request to '/move'
router.post("/move", (req: MoveRequest, res: MoveResponse): MoveResponse => {
  const requestData = req.body;
  let move, taunt;

  // Initialize variables that store where the snake can go.
  const invalidDirections = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  // Own snake data.
  const ownSnake: Snake = requestData.you;
  const snakeBody = ownSnake.body.data;
  const { snakeHeadX, snakeHeadY } = {
    snakeHeadX: snakeBody[0].x,
    snakeHeadY: snakeBody[0].y
  };

  // Check the snake's location in relation to the board.
  if (snakeHeadX === 0) invalidDirections.left = true;
  if (snakeHeadY === 0) invalidDirections.down = true;
  if (snakeHeadX === requestData.width) invalidDirections.right = true;
  if (snakeHeadY === requestData.height) invalidDirections.up = true;

  // Opposition.
  const otherSnakes: Array<Snake> = _(requestData.snakes.data)
    .omit({ id: ownSnake.id })
    .value();
  const snakeBodies: Array<Point> = _(requestData.snakes.data)
    .map(snake => snake.body.data)
    .union()
    .value();

  // Check the directions that we can go without hitting a snake.
  _.each(snakeBodies, snakePoints => {
    _.each(snakePoints, point => {
      if (snakeHeadX + 1 === point.x && snakeHeadY === point.y)
        invalidDirections.right = true;
      if (snakeHeadX - 1 === point.x && snakeHeadY === point.y)
        invalidDirections.left = true;
      if (snakeHeadY + 1 === point.y && snakeHeadX === point.x)
        invalidDirections.up = true;
      if (snakeHeadY - 1 === point.y && snakeHeadX === point.x)
        invalidDirections.down = true;
    });
  });

  // Food
  let closestFoodMoves;
  let closestFood;
  _.each(requestData.food.data, food => {
    const moveCount =
      Math.abs(snakeBody[0].x - food.x) + Math.abs(snakeBody[0].y - food.y);

    if (closestFoodMoves > moveCount || closestFoodMoves === undefined) {
      closestFoodMoves = moveCount;
      closestFood = food;
    }
  });

  // Don't go a way that can result in a collision with a larger snake.
  let otherSnakeCoordinates = [];
  _.each(otherSnakes, otherSnake => {
    const otherSnakeBody = otherSnake.body.data;
    if (otherSnakeBody.length >= ownSnake.length) return;

    const otherSnakeHead = otherSnakeBody[0];

    if (
      _.inRange(
        snakeHeadX - 1,
        otherSnakeHead.x - 1,
        otherSnakeHead.x + 1 && snakeHeadY === otherSnakeHead.y
      )
    )
      invalidDirections.left = true;
    if (
      _.inRange(
        snakeHeadY - 1,
        otherSnakeHead.y - 1,
        otherSnakeHead.y + 1 && snakeHeadX === otherSnakeHead.x
      )
    )
      invalidDirections.down = true;
    if (
      _.inRange(
        snakeHeadX + 1,
        otherSnakeHead.x - 1,
        otherSnakeHead.x + 1 && snakeHeadY === otherSnakeHead.y
      )
    )
      invalidDirections.right = true;
    if (
      _.inRange(snakeHeadY + 1, otherSnakeHead.y - 1, otherSnakeHead.y + 1) &&
      snakeHeadX === otherSnakeHead.x
    )
      invalidDirections.up = true;
  });

  // If there is a less powerful snake within range try to stop it.
  if (!move) {
    _.each(otherSnakes, otherSnake => {
      const otherSnakeBody = otherSnake.body.data;
      if (otherSnakeBody.length < ownSnake.length) return;

      const otherSnakeHead = otherSnakeBody[0];

      if (
        _.inRange(snakeHeadX - 1, otherSnakeHead.x - 1, otherSnakeHead.x + 1) &&
        snakeHeadY === otherSnakeHead.y
      )
        move = getMove("left", invalidDirections);
      if (
        _.inRange(snakeHeadY - 1, otherSnakeHead.y - 1, otherSnakeHead.y + 1) &&
        snakeHeadX === otherSnakeHead.x
      )
        move = getMove("down", invalidDirections);
      if (
        _.inRange(snakeHeadX + 1, otherSnakeHead.x - 1, otherSnakeHead.x + 1) &&
        snakeHeadY === otherSnakeHead.y
      )
        move = getMove("right", invalidDirections);
      if (
        _.inRange(snakeHeadY + 1, otherSnakeHead.y - 1, otherSnakeHead.y + 1) &&
        snakeHeadX === otherSnakeHead.x
      )
        move = getMove("up", invalidDirections);

      taunt = "I'm coming for ya!";
    });
  }

  // If there is a food pellet nearby then grab it.
  if (!move && closestFood) {
    console.log(snakeHeadX);
    console.log(snakeHeadY);
    console.log(closestFood);
    if (snakeHeadX === closestFood.x) {
      move =
        snakeHeadY < closestFood.y
          ? getMove("up", invalidDirections)
          : getMove("down", invalidDirections);
    } else if (snakeHeadY === closestFood.y) {
      move =
        snakeHeadX < closestFood.x
          ? getMove("right", invalidDirections)
          : getMove("left", invalidDirections);
    }

    console.log("### MOVE");
    console.log(snakeHeadY === closestFood.y);
    console.log(snakeHeadX < closestFood.x);
    console.log(snakeHeadY);
    console.log(closestFood.y);
    console.log(move);

    if (!move) {
      let possibleDirections = [];

      if (snakeHeadX < closestFood.x) possibleDirections.push("right");
      else possibleDirections.push("left");

      if (snakeHeadY < closestFood.y) possibleDirections.push("up");
      else possibleDirections.push("down");

      move =
        Math.random() < 0.5
          ? getMove(possibleDirections[0], invalidDirections)
          : getMove(possibleDirections[1], invalidDirections);
    }

    taunt = "I'm always hungry!";
  }

  // For some reason we haven't settled on a move - randomly pick one direction that is allowed.
  if (!move && !_.every(invalidDirections, _.isTrue)) {
    const validDirections = _.keys(
      _.pickBy(invalidDirections, direction => !direction)
    );
    move = validDirections[(validDirections.length * Math.random()) << 0];

    taunt = "I'm leaving this one up to fate!";
  }

  // If we don't have a move because no directions are valid then pick one randomly and post a suicide message.
  if (!move && _.every(invalidDirections, _.isTrue)) {
    move = ["up", "down", "left", "right"][Math.floor(Math.random() * 4) + 1];

    taunt = "This is the end for me!";
  }

  // Response data
  const responseData: MoveResponseData = { move, taunt };
  console.log(responseData);
  return res.json(responseData);
});

module.exports = router;
