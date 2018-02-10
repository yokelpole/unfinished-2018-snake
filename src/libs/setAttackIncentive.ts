import { Snake, ScoredDirections, Point } from "../types/battlesnake";
import { adjustScoredDirection, getPossibleMovesForPoint } from "./snakeLibs";
import * as _ from "lodash";

const SCORE_VALUE = 0.66;

export function setAttackIncentive(
  testedSnake: Snake,
  otherSnakes: Array<Snake>,
  scoredDirections: ScoredDirections
) {
  const snakeHead: Point = testedSnake.body.data[0];

  _.each(otherSnakes, (otherSnake: Snake) => {
    if (testedSnake.length <= otherSnake.length) return;

    const otherSnakeHead = otherSnake.body.data[0];
    const testedSnakeMoves: Array<Point> = getPossibleMovesForPoint(snakeHead);
    const otherSnakeMoves: Array<Point> = getPossibleMovesForPoint(
      otherSnakeHead
    );

    _.each(testedSnakeMoves, (ownMove: Point) => {
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
