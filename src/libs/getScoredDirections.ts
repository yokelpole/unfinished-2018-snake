import * as _ from "lodash";
import { checkForDeadEnds } from "./checkForDeadEnd";
import { setCollisionPossibilities } from "./setCollisionPossibilities";
import { setAttackIncentive } from "./setAttackIncentive";
import { checkNextMoves } from "./checkNextMoves";
import { setAvoidBiggerSnakeHeads } from "./setAvoidBiggerSnakeHeads";
import { setScoreClosestFoodDirection } from "./setScoreClosestFoodDirection";
import { Snake, Point, ScoredDirections } from "../types/battlesnake";
import { otherSnakesAreBigger, MIN_HEALTH } from "./snakeLibs";

export function getScoredDirections(
  testedSnake: Snake,
  otherSnakes: Array<Snake>,
  food: Array<Point>,
  boardWidth: number,
  boardHeight: number
): ScoredDirections {
  const snakeBodies: Array<Point> = _(_.union([testedSnake], otherSnakes))
    .map(snake => snake.body)
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
    testedSnake.body[0],
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
  if (
    testedSnake.health < MIN_HEALTH ||
    otherSnakesAreBigger(testedSnake, otherSnakes)
  ) {
    setScoreClosestFoodDirection(
      testedSnake.body[0],
      snakeBodies,
      food,
      scoredDirections
    );
  }

  // Try to estimate the next moves and how safe they are.
  checkNextMoves(
    testedSnake.body[0],
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
