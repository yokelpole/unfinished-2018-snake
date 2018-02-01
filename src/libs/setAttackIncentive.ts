import { Snake, ScoredDirections, Point } from "../types/battlesnake";
import { adjustScoredDirection } from "./snakeLibs";
import * as _ from "lodash";

export function setAttackIncentive(
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
  