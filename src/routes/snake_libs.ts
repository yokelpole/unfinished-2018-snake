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

const MIN_HEALTH = 75;

function adjustScoredDirection(
  scoredDirection: ScoredDirections,
  direction: string,
  amount
) {
  // console.log("### ADJUSTING SCORE DIRECTION");
  // console.log(direction);
  // console.log(amount);
  if (scoredDirection[direction] <= 0 && amount > 0) return;

  scoredDirection[direction] += amount;
}

function setCollisionPossibilities(
  snakeHead: Point,
  snakeHealth: Number,
  otherBodies: Array<Point>,
  width: Number,
  height: Number,
  scoredDirections: ScoredDirections,
  severity: number = 1
) {
  // Check the snake's location in relation to the board.
  if (snakeHead.x === 0)
    adjustScoredDirection(scoredDirections, "left", 2.0 * -severity);
  if (snakeHead.y === 0)
    adjustScoredDirection(scoredDirections, "up", 2.0 * -severity);
  if (snakeHead.x + 1 === width)
    adjustScoredDirection(scoredDirections, "right", 2.0 * -severity);
  if (snakeHead.y + 1 === height)
    adjustScoredDirection(scoredDirections, "down", 2.0 * -severity);

  _.each(otherBodies, (point: Point) => {
    if (snakeHealth <= MIN_HEALTH && point.type === "food") return;

    // Make food less hostile to the snake when not hungry.
    const scoreMultiplier = point.type === "snake" ? 1.0 : 0.1;

    // Make sure there are no immediate conflicts with other items on the board.
    if (snakeHead.x + 1 === point.x && snakeHead.y === point.y)
      adjustScoredDirection(
        scoredDirections,
        "right",
        scoreMultiplier * -severity
      );
    if (snakeHead.x - 1 === point.x && snakeHead.y === point.y)
      adjustScoredDirection(
        scoredDirections,
        "left",
        scoreMultiplier * -severity
      );
    if (snakeHead.y + 1 === point.y && snakeHead.x === point.x)
      adjustScoredDirection(
        scoredDirections,
        "down",
        scoreMultiplier * -severity
      );
    if (snakeHead.y - 1 === point.y && snakeHead.x === point.x)
      adjustScoredDirection(
        scoredDirections,
        "up",
        scoreMultiplier * -severity
      );
  });
}

// TODO: Make this check a few moves in advance and check for where the snake's tail will be.
function checkNextMoves(
  snakeHead: Point,
  snakeHealth: Number,
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
      object: "point",
      type: "snake"
    };

    setCollisionPossibilities(
      checkedPoint,
      snakeHealth,
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

  // TODO: Add multiplier based on the largest snake on the table.

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
        if (movesY > 0) adjustScoredDirection(scoredDirections, "down", +0.66);
        else adjustScoredDirection(scoredDirections, "up", +0.66);
      } else {
        if (movesX > 0) adjustScoredDirection(scoredDirections, "right", +0.66);
        else adjustScoredDirection(scoredDirections, "left", +0.66);
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
      adjustScoredDirection(scoredDirections, "left", +0.75);
    if (
      snakeHead.y - 1 === otherSnakeHead.y + 1 &&
      snakeHead.x === otherSnakeHead.x
    )
      adjustScoredDirection(scoredDirections, "up", +0.75);
    if (
      snakeHead.x + 1 === otherSnakeHead.x - 1 &&
      snakeHead.y === otherSnakeHead.y
    )
      adjustScoredDirection(scoredDirections, "right", +0.75);
    if (
      snakeHead.y + 1 === otherSnakeHead.y - 1 &&
      snakeHead.x === otherSnakeHead.x
    )
      adjustScoredDirection(scoredDirections, "down", +0.75);
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
  // We also set the type of point here so food is scored less hostile than a snake.
  const snakeBodiesAndFood: Array<Point> = _.union(
    _.flatten(_.each(snakeBodies, point => (point.type = "snake"))),
    _.each(food, point => (point.type = "food"))
  );

  const scoredDirections: ScoredDirections = {
    up: 1.0,
    down: 1.0,
    left: 1.0,
    right: 1.0
  };

  // console.log("### CHECKING COLLISION POSSIBILITIES");

  // Set immediate collision possibilities.
  setCollisionPossibilities(
    ownSnake.body.data[0],
    ownSnake.health,
    ownSnake.health > MIN_HEALTH ? snakeBodiesAndFood : snakeBodies,
    boardWidth,
    boardHeight,
    scoredDirections
  );

  // console.log("### CHECKING BIGGER SNAKE CONFLICTS");
  // See if we'll IMMEDIATELY be gobbled up in a particular direction.
  setBiggerSnakeConflicts(ownSnake, otherSnakes, scoredDirections);

  // console.log("### CHECKING NEXT MOVES");
  // Try to estimate the next moves and how safe they are.
  checkNextMoves(
    ownSnake.body.data[0],
    ownSnake.health,
    ownSnake.health > MIN_HEALTH ? snakeBodiesAndFood : snakeBodies,
    boardWidth,
    boardHeight,
    scoredDirections
  );

  // console.log("### DOING THE HEALTH CHECK");
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

  // console.log("### SETTING THE ATTACK INCENTIVE");
  // See if there is a snake that we can immediately destroy.
  setAttackIncentive(ownSnake, otherSnakes, scoredDirections);

  // console.log("### RETURNING THE SCORED DIRECTIONS");
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
