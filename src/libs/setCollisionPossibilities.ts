
import { Point, ScoredDirections } from "../types/battlesnake";
import { adjustScoredDirection, MIN_HEALTH } from "./snakeLibs";
import * as _ from "lodash";

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
      adjustScoredDirection(scoredDirections, "left", 1.0 * -severity);
    if (snakeHead.y === 0)
      adjustScoredDirection(scoredDirections, "up", 1.0 * -severity);
    if (snakeHead.x + 1 === width)
      adjustScoredDirection(scoredDirections, "right", 1.0 * -severity);
    if (snakeHead.y + 1 === height)
      adjustScoredDirection(scoredDirections, "down", 1.0 * -severity);
  
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
  