import { Snake, Point, ScoredDirections } from "../types/battlesnake";
import { adjustScoredDirection } from './snakeLibs';
import * as _ from "lodash";

const NEGATIVE_SCORE_VALUE = -0.9;
const POSITIVE_SCORE_VALUE = 0.5;

export function checkForDeadEnds(
  ownSnake: Snake,
  snakeBodies: Array<Point>,
  width: number,
  height: number,
  scoredDirections: ScoredDirections
) {
  // Subtract the score from one side if there is less 'volume'
  // to that direction.
  const snakeHead = ownSnake.body.data[0];

  // Convert the Point object array into a 2d array.
  const obstacleArray = [];
  for (var i = 0; i < width; i++) {
    obstacleArray[i] = new Array(height).fill(undefined);
  }

  // Map out where the obstacles are on the array.
  _.each(snakeBodies, (obstacle: Point) => {
    obstacleArray[obstacle.x][obstacle.y] = false;
  });

  const leftObstacleArray = _.cloneDeep(obstacleArray);
  const rightObstacleArray = _.cloneDeep(obstacleArray);
  const upObstacleArray = _.cloneDeep(obstacleArray);
  const downObstacleArray = _.cloneDeep(obstacleArray);

  floodCheck(snakeHead.x - 1, snakeHead.y, width, height, leftObstacleArray);
  floodCheck(snakeHead.x + 1, snakeHead.y, width, height, rightObstacleArray);
  floodCheck(snakeHead.x, snakeHead.y - 1, width, height, upObstacleArray);
  floodCheck(snakeHead.x, snakeHead.y + 1, width, height, downObstacleArray);

  const leftOpenSpaces = _.flatMap(leftObstacleArray, row =>
    _.filter(row, point => point === true)
  ).length;
  const rightOpenSpaces = _.flatMap(rightObstacleArray, row =>
    _.filter(row, point => point === true)
  ).length;
  const upOpenSpaces = _.flatMap(upObstacleArray, row =>
    _.filter(row, point => point === true)
  ).length;
  const downOpenSpaces = _.flatMap(upObstacleArray, row =>
    _.filter(row, point => point === true)
  ).length;

  if (leftOpenSpaces <= ownSnake.length)
    adjustScoredDirection(scoredDirections, "left", NEGATIVE_SCORE_VALUE);
  if (rightOpenSpaces <= ownSnake.length)
    adjustScoredDirection(scoredDirections, "right", NEGATIVE_SCORE_VALUE);
  if (upOpenSpaces <= ownSnake.length)
    adjustScoredDirection(scoredDirections, "up", NEGATIVE_SCORE_VALUE);
  if (downOpenSpaces <= ownSnake.length)
    adjustScoredDirection(scoredDirections, "down", NEGATIVE_SCORE_VALUE);

  // Provide a slight boost to the direction that has the most open spaces.
  const highestScore = _.max([leftOpenSpaces, rightOpenSpaces, upOpenSpaces, downOpenSpaces]);

  if (highestScore === leftOpenSpaces && leftOpenSpaces > ownSnake.length)
    adjustScoredDirection(scoredDirections, "left", POSITIVE_SCORE_VALUE);
  if (highestScore === rightOpenSpaces && rightOpenSpaces > ownSnake.length)
    adjustScoredDirection(scoredDirections, "right", POSITIVE_SCORE_VALUE);
  if (highestScore === upOpenSpaces && upOpenSpaces > ownSnake.length)
    adjustScoredDirection(scoredDirections, "up", POSITIVE_SCORE_VALUE);
  if (highestScore === downOpenSpaces && downOpenSpaces > ownSnake.length)
    adjustScoredDirection(scoredDirections, "down", POSITIVE_SCORE_VALUE);
}

function floodCheck(
  x: number,
  y: number,
  width: number,
  height: number,
  obstacleArray
) {
  if (x < 0 || y < 0) return;
  if (x >= width || y >= height) return;
  if (obstacleArray[x][y] !== undefined) return;

  obstacleArray[x][y] = true;

  floodCheck(x - 1, y, width, height, obstacleArray);
  floodCheck(x + 1, y, width, height, obstacleArray);
  floodCheck(x, y - 1, width, height, obstacleArray);
  floodCheck(x, y + 1, width, height, obstacleArray);
}
