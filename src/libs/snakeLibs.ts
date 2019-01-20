import * as _ from "lodash";
import { Snake, Point, ScoredDirections } from "../types/battlesnake";

export const MIN_HEALTH = 75;

export function adjustScoredDirection(
  scoredDirection: ScoredDirections,
  direction: string,
  amount
) {
  if (scoredDirection[direction] <= 0 && amount > 0) return;

  scoredDirection[direction] += amount;
}

export function getPossibleMovesForPoint(point: Point): Array<Point> {
  return [
    { x: point.x - 1, y: point.y, object: "point" },
    { x: point.x + 1, y: point.y, object: "point" },
    { x: point.x, y: point.y - 1, object: "point" },
    { x: point.x, y: point.y + 1, object: "point" }
  ];
}

export function pruneSnakesTailsIfNotEaten(snakes): Array<Snake> {
  const snakeArrayCopy = _.cloneDeep(snakes);

  _.each(snakeArrayCopy, (snake: Snake) => {
    console.log(snake.body);
    if (_.uniq(snake.body).length === snake.body.length) return;

    snake.body.pop();
  });

  return snakeArrayCopy;
}

export function otherSnakesAreBigger(
  testedSnake: Snake,
  otherSnakes: Array<Snake>
) {
  // If there is one snake left and it's bigger then return true.
  if (otherSnakes.length === 1 && otherSnakes[0].length > testedSnake.length)
    return true;

  return false;
}

