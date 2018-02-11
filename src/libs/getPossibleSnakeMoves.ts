import { Snake, ScoredDirections } from "../types/battlesnake";
import { getScoredDirections } from "./snakeLibs";
import * as _ from "lodash";

export function getPossibleSnakeMoves(
  testedSnakes: Array<Snake>,
  allSnakes: Array<Snake>,
  food,
  requestData
): Array<Snake> {
  let updatedSnakes: Array<Snake> = determineNextMoves(testedSnakes, allSnakes, food, requestData);
  updatedSnakes = determineNextMoves(updatedSnakes, allSnakes, food, requestData);
  updatedSnakes = determineNextMoves(updatedSnakes, allSnakes, food, requestData);

  return updatedSnakes;
}

function determineNextMoves(testedSnakes: Array<Snake>, allSnakes: Array<Snake>, food, requestData): Array<Snake> {
    return _.map(testedSnakes, (snake: Snake) => {
        const scoredDirections = getScoredDirections(
          snake,
          _(allSnakes)
            .reject({ id: snake.id })
            .value(),
          food,
          requestData.width,
          requestData.height
        );

        // Add to the snake where there is a possible scored direction.
        const maxValue = _.max(_.values(scoredDirections));
        const topMoves = _.keys(_.pickBy(scoredDirections, x => x === maxValue));
    
        // TODO: Check to see if the snake will gain an extra length point.
        // TODO: Ensure that we account for the possibility of two possible moves.
        const snakeHead = snake.body.data[0];
        _.each(topMoves, direction => {
          const deviation = direction === "up" || direction === "left" ? -1 : +1;
          snake.body.data.push({
            x:
              direction === "left" || direction === "right"
                ? snakeHead.x + deviation
                : snakeHead.x,
            y:
              direction === "up" || direction === "down"
                ? snakeHead.y + deviation
                : snakeHead.y,
            object: "point",
            type: "possibleSnake"
          });
        });
    
        return snake;
      });
}