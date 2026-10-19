/** Snake II game logic. Pure functions; randomness is injectable for tests. */
export const COLS = 27;
export const ROWS = 12;

const VECTORS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

const same = (a, b) => a.x === b.x && a.y === b.y;

export function placeFood(snake, rng = Math.random) {
  const free = [];
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) if (!snake.some((p) => p.x === x && p.y === y)) free.push({ x, y });
  return free.length ? free[Math.floor(rng() * free.length)] : null;
}

export function createGame(rng = Math.random) {
  const snake = [
    { x: 8, y: 6 },
    { x: 7, y: 6 },
    { x: 6, y: 6 },
    { x: 5, y: 6 },
  ];
  return { snake, dir: "right", queue: [], food: placeFood(snake, rng), score: 0, alive: true, ate: false };
}

/** Queues a turn. Reversing into yourself is ignored; up to two quick turns are buffered. */
export function turn(game, dir) {
  const last = game.queue.at(-1) ?? game.dir;
  if (!VECTORS[dir] || dir === last || dir === OPPOSITE[last] || game.queue.length >= 2) return game;
  return { ...game, queue: [...game.queue, dir] };
}

/** Advances one tick. The snake wraps around the screen edges. */
export function step(game, rng = Math.random) {
  if (!game.alive) return game;
  const [dir, ...queue] = game.queue.length ? game.queue : [game.dir];
  const [dx, dy] = VECTORS[dir];
  const head = game.snake[0];
  const next = { x: (head.x + dx + COLS) % COLS, y: (head.y + dy + ROWS) % ROWS };
  const ate = game.food !== null && same(next, game.food);
  const body = ate ? game.snake : game.snake.slice(0, -1);
  if (body.some((p) => same(p, next))) return { ...game, dir, queue: [], alive: false, ate: false };
  const snake = [next, ...body];
  const food = ate ? placeFood(snake, rng) : game.food;
  return { ...game, snake, dir, queue, food, score: game.score + (ate ? 1 : 0), ate, alive: food !== null || !ate };
}

export function speedMs(game) {
  return Math.max(80, 170 - game.score * 5);
}
