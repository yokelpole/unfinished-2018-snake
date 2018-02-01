import { Snake, ScoredDirections } from '../types/battlesnake';
import { adjustScoredDirection } from './snakeLibs';
import * as _ from "lodash";

export function setBiggerSnakeConflicts(
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
  