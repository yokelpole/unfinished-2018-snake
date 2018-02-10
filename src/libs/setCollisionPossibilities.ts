import { Point, ScoredDirections } from "../types/battlesnake";
import { adjustScoredDirection, MIN_HEALTH } from "./snakeLibs";
import * as _ from "lodash";

const WALL_SCORE_VALUE = 1.5;

export function setCollisionPossibilities(
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
    adjustScoredDirection(
      scoredDirections,
      "left",
      WALL_SCORE_VALUE * -severity
    );
  if (snakeHead.y === 0)
    adjustScoredDirection(scoredDirections, "up", WALL_SCORE_VALUE * -severity);
  if (snakeHead.x + 1 === width)
    adjustScoredDirection(
      scoredDirections,
      "right",
      WALL_SCORE_VALUE * -severity
    );
  if (snakeHead.y + 1 === height)
    adjustScoredDirection(
      scoredDirections,
      "down",
      WALL_SCORE_VALUE * -severity
    );

  _.each(otherBodies, (point: Point) => {
    if (snakeHealth <= MIN_HEALTH && point.type === "food") return;

    // Make food less hostile to the snake when not hungry.
    const scoreMultiplier = {
      snake: 1.0,
      possibleSnake: 0.5,
      food: 0.1
    }[point.type];

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
