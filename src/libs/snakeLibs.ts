import * as _ from "lodash";
import { setCollisionPossibilities } from "./setCollisionPossibilities";
import { setAttackIncentive } from "./setAttackIncentive";
import { checkNextMoves } from "./checkNextMoves";
import { setAvoidBiggerSnakeHeads } from "./setAvoidBiggerSnakeHeads";
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

export function getPossibleMovesForPoint(point: Point): Array<Point> {
  return [
    { x: point.x - 1, y: point.y, object: "point" },
    { x: point.x + 1, y: point.y, object: "point" },
    { x: point.x, y: point.y - 1, object: "point" },
    { x: point.x, y: point.y + 1, object: "point" }
  ];
}

export function pruneSnakesTailsIfNotEaten(snakes): Array<Snake> {
  const snakeArrayCopy = _.cloneDeep(snakes);

  _.each(snakeArrayCopy, (snake: Snake) => {
    if (_.uniq(snake.body.data).length === snake.body.data.length) return;

    snake.body.data.pop();
  });

  return snakeArrayCopy;
}

export function getScoredDirections(
  testedSnake: Snake,
  otherSnakes: Array<Snake>,
  food: Array<Point>,
  boardWidth: number,
  boardHeight: number
): ScoredDirections {
  const snakeBodies: Array<Point> = _(_.union([testedSnake], otherSnakes))
    .map(snake => snake.body.data)
    .union()
    .flatten()
    .value();

  // Set the type of point here so food can be told apart from snakes.
  const snakeBodiesAndFood: Array<Point> = _.union(
    _.flatten(
      _.each(
        snakeBodies,
        point => (point.type = !point.type ? "snake" : point.type)
      )
    ),
    _.each(food, point => (point.type = "food"))
  );

  const scoredDirections: ScoredDirections = {
    up: 1.5,
    down: 1.5,
    left: 1.5,
    right: 1.5
  };

  // Set immediate collision possibilities.
  setCollisionPossibilities(
    testedSnake.body.data[0],
    testedSnake.health,
    testedSnake.health > MIN_HEALTH ? snakeBodiesAndFood : snakeBodies,
    boardWidth,
    boardHeight,
    scoredDirections
  );

  // Fight or flight.
  setAvoidBiggerSnakeHeads(testedSnake, otherSnakes, scoredDirections);
  setAttackIncentive(testedSnake, otherSnakes, scoredDirections);

  // If the snake is hungry, boost the score of the direction that will
  // lead us to the closest unblocked food.
  if (testedSnake.health < MIN_HEALTH) {
    setScoreClosestFoodDirection(
      testedSnake.body.data[0],
      snakeBodies,
      food,
      scoredDirections
    );
  }

  // Try to estimate the next moves and how safe they are.
  checkNextMoves(
    testedSnake.body.data[0],
    testedSnake.health,
    testedSnake.health > MIN_HEALTH ? snakeBodiesAndFood : snakeBodies,
    boardWidth,
    boardHeight,
    scoredDirections
  );

  // Try to make sure that the snake doesn't willingly enter dead-ends.
  checkForDeadEnds(
    testedSnake,
    snakeBodies,
    boardWidth,
    boardHeight,
    scoredDirections
  );

  return scoredDirections;
}
