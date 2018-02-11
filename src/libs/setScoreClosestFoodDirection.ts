import { Point, ScoredDirections } from "../types/battlesnake";
import { adjustScoredDirection } from "./snakeLibs";
import * as _ from "lodash";

const SCORE_VALUE = 0.4;

export function setScoreClosestFoodDirection(
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
    for (var i = movesX; i !== 0; movesX > 0 ? i-- : i++) {
      _.each(snakeBodies, (body: Point) => {
        if (body.x === snakeHead.x + i && body.y === food.y) isSafe = false;
      });
    }

    for (var i = movesY; i !== 0; movesY > 0 ? i-- : i++) {
      _.each(snakeBodies, (body: Point) => {
        if (body.x === food.x && body.y === snakeHead.y + i) isSafe = false;
      });
    }

    if (isSafe) {
      closestFoodMoves = moveCount;

      if (Math.abs(movesY) > Math.abs(movesX)) {
        if (movesY > 0) adjustScoredDirection(scoredDirections, "down", SCORE_VALUE);
        else adjustScoredDirection(scoredDirections, "up", SCORE_VALUE);
      } else {
        if (movesX > 0) adjustScoredDirection(scoredDirections, "right", SCORE_VALUE);
        else adjustScoredDirection(scoredDirections, "left", SCORE_VALUE);
      }
    }
  });
}
