import * as _ from "lodash";
import { setCollisionPossibilities } from "./setCollisionPossibilities";
import { setAttackIncentive } from "./setAttackIncentive";
import { checkNextMoves } from "./checkNextMoves";
import { setBiggerSnakeConflicts } from "./setBiggerSnakeConflicts";
import { setScoreClosestFoodDirection } from "./setScoreClosestFoodDirection";
import { Snake, Point, ScoredDirections } from "../types/battlesnake";
import { checkForDeadEnds } from "./checkForDeadEnd";

export const MIN_HEALTH = 75;

export function adjustScoredDirection(
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

  /*checkForDeadEnds(
    ownSnake.body.data[0],
    snakeBodies,
    boardWidth,
    boardHeight,
    scoredDirections,
  )*/

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
