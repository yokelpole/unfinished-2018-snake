import { Snake, ScoredDirections, Point } from "../types/battlesnake";
import { adjustScoredDirection, getPossibleMovesForPoint } from "./snakeLibs";
import * as _ from "lodash";

const SCORE_VALUE = -1.0;

export function setBiggerSnakeConflicts(
  ownSnake: Snake,
  otherSnakes: Array<Snake>,
  scoredDirections: ScoredDirections
) {
  // Don't go a way that can result in a collision with a larger snake.
  const snakeHead = ownSnake.body.data[0];

  _.each(otherSnakes, (otherSnake: Snake) => {
    if (otherSnake.length <= ownSnake.length) return;

    const otherSnakeHead = otherSnake.body.data[0];
    const ownSnakeMoves: Array<Point> = getPossibleMovesForPoint(snakeHead);
    const otherSnakeMoves: Array<Point> = getPossibleMovesForPoint(
      otherSnakeHead
    );

    _.each(ownSnakeMoves, (ownMove: Point) => {
      _.each(otherSnakeMoves, (otherMove: Point) => {
        if (ownMove.x === otherMove.x && ownMove.y === otherMove.y) {
          if (snakeHead.x > ownMove.x)
            adjustScoredDirection(scoredDirections, "left", SCORE_VALUE);
          if (snakeHead.x < ownMove.x)
            adjustScoredDirection(scoredDirections, "right", SCORE_VALUE);
          if (snakeHead.y > ownMove.y)
            adjustScoredDirection(scoredDirections, "up", SCORE_VALUE);
          if (snakeHead.y < ownMove.y)
            adjustScoredDirection(scoredDirections, "down", SCORE_VALUE);
        }
      });
    });
  });
}
