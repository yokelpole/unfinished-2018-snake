import * as express from "express";
import * as _ from "lodash";
import {
  StartRequest, MoveRequest, StartResponse, MoveResponse, MoveResponseData,
  StartResponseData,
  Snake
} from "../types/battlesnake"

interface BattleSnakeRouter {
  post(route: "/start", cb: (req: StartRequest, res: StartResponse) => any): void;
  post(route: "/move", cb: (req: MoveRequest, res: MoveResponse) => any): void;
}

const router: BattleSnakeRouter = express.Router();

// Handle POST request to '/start'
router.post('/start', (req: StartRequest, res: StartResponse): StartResponse => {
  // NOTE: Do something here to start the game
  const requestData = req.body;

  // Response data
  const responseData: StartResponseData = {
    color: "#CCCCFF",
    name: "Periwinkle the Snake",
    head_url: "http://www.placecage.com/c/200/200", // optional, but encouraged!
    taunt: requestData.game_id // optional, but encouraged!
  };

  return res.json(responseData);
});

function howManyMovesToFood(snake: Snake, food: Array<number>) {
  return Math.abs(snake.coords[0]['x'] - food[0]) + Math.abs(snake.coords[0]['y'] - food[1]);
}

function getMove(direction, invalidDirections: {}) {
  if (invalidDirections[direction]) return undefined;

  return direction;
}

// Handle POST request to '/move'
router.post('/move', (req: MoveRequest, res: MoveResponse): MoveResponse => {
  const requestData = req.body;
  let move, taunt;

  console.log(requestData);

  // Initialize variables that store where the snake can go.
  const invalidDirections = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  // Own snake data.
  const ownSnake: Snake = requestData.you;
  const snakeBody = ownSnake.body.data;
  const snakeLength = snakeBody.length;
  const { snakeHeadX, snakeHeadY } = { snakeHeadX: snakeBody[0].x, snakeHeadY: snakeBody[0].y };

  // Check the snake's location in relation to the board.
  if (snakeHeadX === 0) invalidDirections.left = true;
  if (snakeHeadY === 0) invalidDirections.up = true;
  if (snakeHeadX === requestData.width) invalidDirections.right = true;
  if (snakeHeadY === requestData.height) invalidDirections.down = true;

  // Opposition.
  const otherSnakes: Array<Snake> = _(requestData.snakes.data).omit({ id: ownSnake.id }).value();
  const occupiedCoordinates: Array<[number, number]> = _(requestData.snakes.data).map(snake => snake.body.data).union().value();

  console.log('### GOT HERE');

  // Check the directions that we can go without hitting a snake.
  _.each(occupiedCoordinates, coordinate => {
    if (snakeHeadX + 1 === coordinate.x) invalidDirections.right = true;
    if (snakeHeadX - 1 === coordinate.x) invalidDirections.left = true;
    if (snakeHeadY + 1 === coordinate.y) invalidDirections.down = true;
    if (snakeHeadY - 1 === coordinate.y) invalidDirections.up = true;
  });

  // Food
  let closestFoodMoves = -1, closestFood;
  _.each(requestData.food.data, food => {
    const moveCount = howManyMovesToFood(ownSnake, food);

    if (closestFoodMoves < moveCount) {
      closestFoodMoves = moveCount;
      closestFood = food;
    }
  });

  // Don't go a way that can result in a collision with a larger snake.
  let otherSnakeCoordinates = [];
  _.each(otherSnakes, otherSnake => {
    if (otherSnake.coords.length >= snakeLength) return;
    
    const otherSnakeHead = otherSnake.coords[0]; 

    if (_.inRange(snakeHeadX - 1, otherSnakeHead.x - 1, otherSnakeHead.x + 1)) invalidDirections.left = true;
    if (_.inRange(snakeHeadY - 1, otherSnakeHead.y - 1, otherSnakeHead.y + 1)) invalidDirections.up = true;
    if (_.inRange(snakeHeadX + 1, otherSnakeHead.x - 1, otherSnakeHead.x + 1)) invalidDirections.right = true;
    if (_.inRange(snakeHeadY + 1, otherSnakeHead.y - 1, otherSnakeHead.y + 1)) invalidDirections.down = true;
  });

  // If there is a less powerful snake within range possibly stop it.
  _.each(otherSnakes, otherSnake => {
    if (otherSnake.coords.length < snakeLength) return;

    const otherSnakeHead = otherSnake.coords[0];

    if (_.inRange(snakeHeadX - 1, otherSnakeHead.x - 1, otherSnakeHead.x + 1)) move = getMove('left', invalidDirections);
    if (_.inRange(snakeHeadY - 1, otherSnakeHead.y - 1, otherSnakeHead.y + 1)) move = getMove('up', invalidDirections);
    if (_.inRange(snakeHeadX + 1, otherSnakeHead.x - 1, otherSnakeHead.x + 1)) move = getMove('right', invalidDirections);
    if (_.inRange(snakeHeadY + 1, otherSnakeHead.y - 1, otherSnakeHead.y + 1)) move = getMove('down', invalidDirections);

    taunt = 'I\'m coming for ya!';
  });

  // If there is a food pellet nearby then grab it.
  if (!move && closestFood) {
    if (snakeHeadX === closestFood.x) move = snakeHeadY < closestFood.x ? getMove('down', invalidDirections) : getMove('up', invalidDirections);
    if (snakeHeadY === closestFood.y) move = snakeHeadX < closestFood.y ? getMove('right', invalidDirections) : getMove('left', invalidDirections);
    
    
    if (!move) {
      let possibleDirections = [];

      if (snakeHeadX < closestFood.x) possibleDirections.push('left')
      else possibleDirections.push('right');

      if (snakeHeadY < closestFood.y) possibleDirections.push('down')
      else possibleDirections.push('up');

      move = Math.random() < 0.5 ? getMove(possibleDirections[0], invalidDirections)  : getMove(possibleDirections[1], invalidDirections);
    }

    taunt = 'I\'m always hungry!';
  }

  // For some reason we haven't settled on a move - randomly pick one direction that is allowed.
  if (!move && !_.every(invalidDirections, _.isTrue)) {
    const validDirections = _.keys(_.pickBy(invalidDirections, direction => !direction));
    move = validDirections[validDirections.length * Math.random() << 0];
    
    taunt = 'I\'m leaving this one up to fate!';
  }

  // If we don't have a move because no directions are valid then pick one randomly and post a suicide message.
  if (!move && _.every(invalidDirections, true)) {
    move = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4) + 1];

    taunt = 'This is the end for me!'
  }

  // Response data
  const responseData: MoveResponseData = { move, taunt };
  return res.json(responseData);
});

module.exports = router;
