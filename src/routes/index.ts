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
  Point,
  InvalidDirections
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
      taunt: "This is goind to end badly" // optional, but encouraged!
    };

    return res.json(responseData);
  }
);

function getNewInvalidDirections(): InvalidDirections {
  return {
    up: false,
    down: false,
    left: false,
    right: false
  };
}

function getMove(
  direction: string,
  invalidDirections: InvalidDirections
): string {
  if (invalidDirections[direction]) return undefined;

  return direction;
}

function setCollisionPossibilities(
  snakeHead: Point,
  otherBodies: Array<Point>,
  width: Number,
  height: Number,
  invalidDirections: InvalidDirections
) {
  // Check the snake's location in relation to the board.
  if (snakeHead.x === 0) invalidDirections.left = true;
  if (snakeHead.y === 0) invalidDirections.up = true;
  if (snakeHead.x + 1 === width) invalidDirections.right = true;
  if (snakeHead.y + 1 === height) invalidDirections.down = true;

  _.each(otherBodies, point => {
    if (snakeHead.x + 1 === point.x && snakeHead.y === point.y)
      invalidDirections.right = true;
    if (snakeHead.x - 1 === point.x && snakeHead.y === point.y)
      invalidDirections.left = true;
    if (snakeHead.y + 1 === point.y && snakeHead.x === point.x)
      invalidDirections.down = true;
    if (snakeHead.y - 1 === point.y && snakeHead.x === point.x)
      invalidDirections.up = true;
  });
}

// TODO: Make this check a few moves in advance and check for where the snake's tail will be.
function checkNextMoves(
  snakeHead: Point,
  otherBodies: Array<Point>,
  width: Number,
  height: Number,
  invalidDirections: InvalidDirections
) {
  _.each(_.keys(invalidDirections), direction => {
    if (invalidDirections[direction]) return;

    const deviation = direction === "up" || direction === "left" ? -1 : +1;
    const checkedPoint: Point = {
      x:
        direction === "left" || direction === "right"
          ? snakeHead.x + deviation
          : snakeHead.x,
      y:
        direction === "up" || direction === "down"
          ? snakeHead.y + deviation
          : snakeHead.y,
      object: "point"
    };

    const newInvalidDirections: InvalidDirections = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    setCollisionPossibilities(
      checkedPoint,
      otherBodies,
      width,
      height,
      newInvalidDirections
    );

    if (_.every(newInvalidDirections, _.isTrue))
      invalidDirections[direction] = true;
  });
}

// Handle POST request to '/move'
router.post("/move", (req: MoveRequest, res: MoveResponse): MoveResponse => {
  let move, taunt;

  const requestData = req.body;
  const { width, height } = {
    width: requestData.width,
    height: requestData.height
  };

  // Initialize variables that store where the snake can go.
  let invalidDirections: InvalidDirections = getNewInvalidDirections();

  // Own snake data.
  const ownSnake: Snake = requestData.you;
  const snakeBody = ownSnake.body.data;
  const snakeHead: Point = snakeBody[0];

  // Opposition.
  const otherSnakes: Array<Snake> = _(requestData.snakes.data)
    .reject({ id: ownSnake.id })
    .value();
  const snakeBodies: Array<Point> = _(requestData.snakes.data)
    .map(snake => snake.body.data)
    .union()
    .flatten()
    .value();
  const snakeBodiesAndFood: Array<Point> = _.union(
    _.flatten(snakeBodies),
    requestData.food.data
  );

  // Assign the directions that we can go without hitting a snake or food.
  setCollisionPossibilities(
    snakeHead,
    snakeBodiesAndFood,
    width,
    height,
    invalidDirections
  );
  checkNextMoves(
    snakeHead,
    snakeBodiesAndFood,
    width,
    height,
    invalidDirections
  );

  // If we MUST eat, then recalculate to allow for eating food.
  if (_.every(invalidDirections, _.isTrue)) {
    invalidDirections = getNewInvalidDirections();
    setCollisionPossibilities(
      snakeHead,
      snakeBodies,
      width,
      height,
      invalidDirections
    );
    checkNextMoves(snakeHead, snakeBodies, width, height, invalidDirections);
  }

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
    if (otherSnake.length <= ownSnake.length) return;

    const otherSnakeHead = otherSnakeBody[0];

    if (
      snakeHead.x - 1 === otherSnakeHead.x + 1 &&
      snakeHead.y === otherSnakeHead.y
    )
      invalidDirections.left = true;
    if (
      snakeHead.y - 1 === otherSnakeHead.y + 1 &&
      snakeHead.x === otherSnakeHead.x
    )
      invalidDirections.up = true;
    if (
      snakeHead.x + 1 === otherSnakeHead.x - 1 &&
      snakeHead.y === otherSnakeHead.y
    )
      invalidDirections.right = true;
    if (
      snakeHead.y + 1 === otherSnakeHead.y - 1 &&
      snakeHead.x === otherSnakeHead.x
    )
      invalidDirections.down = true;
  });

  // If there is a less powerful snake within range try to stop it.
  if (!move) {
    _.each(otherSnakes, otherSnake => {
      const otherSnakeBody = otherSnake.body.data;
      if (otherSnake.length >= ownSnake.length) return;

      const otherSnakeHead = otherSnakeBody[0];

      if (
        snakeHead.x - 1 === otherSnakeHead.x + 1 &&
        snakeHead.y === otherSnakeHead.y
      )
        move = getMove("left", invalidDirections);
      if (
        snakeHead.y - 1 === otherSnakeHead.y + 1 &&
        snakeHead.x === otherSnakeHead.x
      )
        move = getMove("up", invalidDirections);
      if (
        snakeHead.x + 1 === otherSnakeHead.x - 1 &&
        snakeHead.y === otherSnakeHead.y
      )
        move = getMove("right", invalidDirections);
      if (
        snakeHead.y + 1 === otherSnakeHead.y - 1 &&
        snakeHead.x === otherSnakeHead.x
      )
        move = getMove("down", invalidDirections);

      taunt = "I'm coming for ya!";
    });
  }

  // If there is a food pellet nearby and there is a bigger snake then grab it.
  const largestOpponent = _.maxBy(otherSnakes, snake => snake.length);
  if (
    (!move && closestFood && ownSnake.health <= 25) ||
    largestOpponent.length > ownSnake.length
  ) {
    // Recalculate the invalid directions to allow for food.
    invalidDirections = getNewInvalidDirections();
    setCollisionPossibilities(
      snakeHead,
      snakeBodies,
      width,
      height,
      invalidDirections
    );
    checkNextMoves(snakeHead, snakeBodies, width, height, invalidDirections);
    
    if (snakeHead.x === closestFood.x) {
      move =
        snakeHead.y < closestFood.y
          ? getMove("down", invalidDirections)
          : getMove("up", invalidDirections);
    } else if (snakeHead.y === closestFood.y) {
      move =
        snakeHead.x < closestFood.x
          ? getMove("right", invalidDirections)
          : getMove("left", invalidDirections);
    }

    if (!move) {
      let possibleDirections = [];

      if (snakeHead.x < closestFood.x) possibleDirections.push("right");
      else possibleDirections.push("left");

      if (snakeHead.y < closestFood.y) possibleDirections.push("down");
      else possibleDirections.push("up");

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
