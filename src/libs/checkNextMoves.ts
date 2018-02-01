import { Point, ScoredDirections } from "../types/battlesnake";
import { setCollisionPossibilities } from './setCollisionPossibilities';
import * as _ from "lodash";

// TODO: Make this check a few moves in advance and check for where the snake's tail will be.
export function checkNextMoves(
    snakeHead: Point,
    snakeHealth: Number,
    otherBodies: Array<Point>,
    width: Number,
    height: Number,
    scoredDirections: ScoredDirections
  ) {
    _.each(_.keys(scoredDirections), (direction: string) => {
      if (scoredDirections[direction] <= 0.0) return;
  
      const deviation = direction === "up" || direction === "left" ? -1 : +1;
      const checkedPoint: Point = {
        x:
          direction === "left" || direction === "right"
            ? snakeHead.x + deviation
            : snakeHead.x,
        y:
          direction === "up" || direction === "down"
            ? snakeHead.y + deviation
            : snakeHead.y,
        object: "point",
        type: "snake"
      };
  
      setCollisionPossibilities(
        checkedPoint,
        snakeHealth,
        otherBodies,
        width,
        height,
        scoredDirections,
        0.20
      );
    });
  }
  