import * as _ from "lodash";
import { ScoredDirections } from "../types/battlesnake";
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

const MIN_HEALTH = 20;

function adjustScoredDirection(
  scoredDirection: ScoredDirections,
  direction: string,
  amount
) {
  console.log("### ADJUSTING SCORE DIRECTION");
  console.log(direction);
  console.log(amount);

  scoredDirection[direction] += amount;
}

function setCollisionPossibilities(
  snakeHead: Point,
  otherBodies: Array<Point>,
  width: Number,
  height: Number,
  scoredDirections: ScoredDirections,
  severity: number = 1
) {
  // Check the snake's location in relation to the board.
  if (snakeHead.x === 0)
    adjustScoredDirection(scoredDirections, "left", 1.0 * -severity);
  if (snakeHead.y === 0)
    adjustScoredDirection(scoredDirections, "up", 1.0 * -severity);
  if (snakeHead.x + 1 === width)
    adjustScoredDirection(scoredDirections, "right", 1.0 * -severity);
  if (snakeHead.y + 1 === height)
    adjustScoredDirection(scoredDirections, "down", 1.0 * -severity);

  _.each(otherBodies, point => {
    // Make sure there are no immediate conflicts with other items on the board.
    if (snakeHead.x + 1 === point.x && snakeHead.y === point.y)
      adjustScoredDirection(scoredDirections, "right", 1.0 * -severity);
    if (snakeHead.x - 1 === point.x && snakeHead.y === point.y)
      adjustScoredDirection(scoredDirections, "left", 1.0 * -severity);
    if (snakeHead.y + 1 === point.y && snakeHead.x === point.x)
      adjustScoredDirection(scoredDirections, "down", 1.0 * -severity);
    if (snakeHead.y - 1 === point.y && snakeHead.x === point.x)
      adjustScoredDirection(scoredDirections, "up", 1.0 * -severity);
  });
}

// TODO: Make this check a few moves in advance and check for where the snake's tail will be.
function checkNextMoves(
  snakeHead: Point,
  otherBodies: Array<Point>,
  width: Number,
  height: Number,
  scoredDirections: ScoredDirections
) {
  _.each(_.keys(scoredDirections), (direction: string) => {
    if (scoredDirections[direction] === 0.0) return;

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

    setCollisionPossibilities(
      checkedPoint,
      otherBodies,
      width,
      height,
      scoredDirections,
      0.33
    );
  });
}

function setBiggerSnakeConflicts(
  ownSnake: Snake,
  otherSnakes: Array<Snake>,
  scoredDirections: ScoredDirections
) {
  // Don't go a way that can result in a collision with a larger snake.
  const snakeHead = { x: ownSnake.body.data[0].x, y: ownSnake.body.data[0].y };
  let otherSnakeCoordinates = [];

  _.each(otherSnakes, (otherSnake: Snake) => {
    const otherSnakeBody = otherSnake.body.data;
    if (otherSnake.length <= ownSnake.length) return;

    const otherSnakeHead = otherSnakeBody[0];

    // TODO: Have the following scores subtract a certain amount to determine
    // how appropriate a particular direction is to go.
    if (
      snakeHead.x - 1 === otherSnakeHead.x + 1 &&
      snakeHead.y === otherSnakeHead.y
    )
      adjustScoredDirection(scoredDirections, "left", -0.75);
    if (
      snakeHead.y - 1 === otherSnakeHead.y + 1 &&
      snakeHead.x === otherSnakeHead.x
    )
      adjustScoredDirection(scoredDirections, "up", -0.75);
    if (
      snakeHead.x + 1 === otherSnakeHead.x - 1 &&
      snakeHead.y === otherSnakeHead.y
    )
      adjustScoredDirection(scoredDirections, "right", -0.75);
    if (
      snakeHead.y + 1 === otherSnakeHead.y - 1 &&
      snakeHead.x === otherSnakeHead.x
    )
      adjustScoredDirection(scoredDirections, "down", -0.75);
  });
}

function setScoreClosestFoodDirection(
  snakeHead: Point,
  snakeBodies: Array<Point>,
  foodPoints: Array<Point>,
  scoredDirections: ScoredDirections
) {
  let closestFoodMoves = 999;
  let closestFood;

  _.each(foodPoints, (food: Point) => {
    const movesX = food.x - snakeHead.x;
    const movesY = food.y - snakeHead.y;
    const moveCount = Math.abs(movesX) + Math.abs(movesY);

    if (moveCount > closestFoodMoves) return;

    let isSafe = true;
    // Check if we will cross any other snakes on this path.
    for (var i = Math.abs(movesX); i >= 0; i--) {
      if (movesX < 0) {
        _.each(snakeBodies, (body: Point) => {
          if (body.x === movesX + i && body.y === movesY) isSafe = false;
        });
      } else {
        _.each(snakeBodies, (body: Point) => {
          if (body.x === movesX - i && body.y === movesY) isSafe = false;
        });
      }
    }

    for (var i = Math.abs(movesY); i >= 0; i--) {
      if (movesY < 0) {
        _.each(snakeBodies, (body: Point) => {
          if (body.x === movesX && body.y === movesY + i) isSafe = false;
        });
      } else {
        _.each(snakeBodies, (body: Point) => {
          if (body.x === movesX && body.y === movesY + i) isSafe = false;
        });
      }
    }

    if (isSafe) {
      closestFoodMoves = moveCount;

      if (Math.abs(movesX) > Math.abs(movesY)) {
        if (movesY > 0) adjustScoredDirection(scoredDirections, "down", +0.5);
        else adjustScoredDirection(scoredDirections, "up", +0.5);
      } else {
        if (movesX > 0) adjustScoredDirection(scoredDirections, "right", +0.5);
        else adjustScoredDirection(scoredDirections, "left", +0.5);
      }
    }
  });
}

function setAttackIncentive(
  ownSnake: Snake,
  snakeBodies: Array<Snake>,
  scoredDirections: ScoredDirections
) {
  const snakeHead: Point = ownSnake.body.data[0];

  _.each(snakeBodies, (otherSnake: Snake) => {
    const otherSnakeBody = otherSnake.body.data;
    if (otherSnake.length >= ownSnake.length) return;

    const otherSnakeHead = otherSnakeBody[0];

    if (
      snakeHead.x - 1 === otherSnakeHead.x + 1 &&
      snakeHead.y === otherSnakeHead.y
    )
      adjustScoredDirection(scoredDirections, "left", +0.25);
    if (
      snakeHead.y - 1 === otherSnakeHead.y + 1 &&
      snakeHead.x === otherSnakeHead.x
    )
      adjustScoredDirection(scoredDirections, "up", +0.25);
    if (
      snakeHead.x + 1 === otherSnakeHead.x - 1 &&
      snakeHead.y === otherSnakeHead.y
    )
      adjustScoredDirection(scoredDirections, "right", +0.25);
    if (
      snakeHead.y + 1 === otherSnakeHead.y - 1 &&
      snakeHead.x === otherSnakeHead.x
    )
      adjustScoredDirection(scoredDirections, "down", +0.25);
  });
}

export function getScoredDirections(
  ownSnake: Snake,
  otherSnakes: Array<Snake>,
  food: Array<Point>,
  boardWidth: Number,
  boardHeight: Number
): ScoredDirections {
  const snakeBodies: Array<Point> = _(_.union([ownSnake], otherSnakes))
    .map(snake => snake.body.data)
    .union()
    .flatten()
    .value();
  const snakeBodiesAndFood: Array<Point> = _.union(
    _.flatten(snakeBodies),
    food
  );
  const scoredDirections: ScoredDirections = {
    up: 1.0,
    down: 1.0,
    left: 1.0,
    right: 1.0
  };

  console.log("### CHECKING COLLISION POSSIBILITIES");

  // Set immediate collision possibilities.
  setCollisionPossibilities(
    ownSnake.body.data[0],
    ownSnake.health > MIN_HEALTH ? snakeBodiesAndFood : snakeBodies,
    boardWidth,
    boardHeight,
    scoredDirections
  );

  console.log("### CHECKING BIGGER SNAKE CONFLICTS");
  // See if we'll IMMEDIATELY be gobbled up in a particular direction.
  setBiggerSnakeConflicts(ownSnake, otherSnakes, scoredDirections);

  console.log("### CHECKING NEXT MOVES");
  // Try to estimate the next moves and how safe they are.
  checkNextMoves(
    ownSnake.body.data[0],
    ownSnake.health > MIN_HEALTH ? snakeBodiesAndFood : snakeBodies,
    boardWidth,
    boardHeight,
    scoredDirections
  );

  console.log("### DOING THE HEALTH CHECK");
  // If the snake is hungry, boost the score of the direction that will
  // lead us to the closest unblocked food.
  if (ownSnake.health < MIN_HEALTH) {
    setScoreClosestFoodDirection(
      ownSnake.body.data[0],
      snakeBodies,
      food,
      scoredDirections
    );
  }

  console.log("### SETTING THE ATTACK INCENTIVE");
  // See if there is a snake that we can immediately destroy.
  setAttackIncentive(ownSnake, otherSnakes, scoredDirections);

  console.log("### RETURNING THE SCORED DIRECTIONS");
  return scoredDirections;
}

export function pruneSnakesTailsIfNotEaten(snakes): Array<Snake> {
  const snakeArrayCopy = _.cloneDeep(snakes);

  _.each(snakeArrayCopy, snake => {
    if (!_.uniq(snake).length !== snake.length) return;

    snake.pop();
  });

  return snakeArrayCopy;
}
