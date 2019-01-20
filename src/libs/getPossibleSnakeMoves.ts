import { Snake, MoveRequestData } from "../types/battlesnake";
import { getScoredDirections } from "./getScoredDirections";
import * as _ from "lodash";

export function getPossibleSnakeMoves(
  testedSnakes: Array<Snake>,
  allSnakes: Array<Snake>,
  food,
  requestData: MoveRequestData
): Array<Snake> {
  let updatedSnakes: Array<Snake> = determineNextMoves(testedSnakes, allSnakes, food, requestData);
  updatedSnakes = determineNextMoves(updatedSnakes, allSnakes, food, requestData);
  updatedSnakes = determineNextMoves(updatedSnakes, allSnakes, food, requestData);

  return updatedSnakes;
}

function determineNextMoves(testedSnakes: Array<Snake>, allSnakes: Array<Snake>, food, requestData: MoveRequestData): Array<Snake> {
    return _.map(testedSnakes, (snake: Snake) => {
        const scoredDirections = getScoredDirections(
          snake,
          _(allSnakes)
            .reject({ id: snake.id })
            .value(),
          food,
          requestData.board.width,
          requestData.board.height
        );

        // Add to the snake where there is a possible scored direction.
        const maxValue = _.max(_.values(scoredDirections));
        const topMoves = _.keys(_.pickBy(scoredDirections, x => x === maxValue));
    
        // TODO: Check to see if the snake will gain an extra length point.
        // TODO: Ensure that we account for the possibility of two possible moves.
        const snakeHead = snake.body[0];
        _.each(topMoves, direction => {
          const deviation = direction === "up" || direction === "left" ? -1 : +1;
          const newPoint = ({
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

          if (newPoint.x < 0 || newPoint.x > requestData.board.width) return;
          if (newPoint.y < 0 || newPoint.y > requestData.board.height) return;

          snake.body.push(newPoint);
        });
            
        return snake;
      });
}