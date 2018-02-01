import { Snake, Point, ScoredDirections } from "../types/battlesnake";
import { adjustScoredDirection } from "./snakeLibs";

export function checkForDeadEnds(
  snakeHead: Point,
  snakeBodies: Array<Point>,
  width: Number,
  height: Number,
  scoredDirections: ScoredDirections
) {
    // Subtract the score from one side if there is less 'volume'
    // to that direction.
    
}
