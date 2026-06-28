const SIZE = 9;
const BOX = 3;
const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const DIFFICULTY = {
  easy: { label: 'Лёгкая', remove: 36 },
  medium: { label: 'Средняя', remove: 45 },
  hard: { label: 'Сложная', remove: 54 }
};

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pattern(row, col) {
  return (BOX * (row % BOX) + Math.floor(row / BOX) + col) % SIZE;
}

function generateSolvedBoard() {
  const base = [0, 1, 2];
  const rows = shuffle(base).flatMap((group) => shuffle(base).map((row) => group * BOX + row));
  const cols = shuffle(base).flatMap((group) => shuffle(base).map((col) => group * BOX + col));
  const nums = shuffle(NUMBERS);
  return rows.map((row) => cols.map((col) => nums[pattern(row, col)]));
}

function findEmpty(board) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (board[row][col] === 0) return { row, col };
    }
  }
  return null;
}

export function isValidMove(board, row, col, number) {
  if (!number) return true;

  for (let i = 0; i < SIZE; i += 1) {
    if (i !== col && board[row][i] === number) return false;
    if (i !== row && board[i][col] === number) return false;
  }

  const startRow = Math.floor(row / BOX) * BOX;
  const startCol = Math.floor(col / BOX) * BOX;
  for (let r = startRow; r < startRow + BOX; r += 1) {
    for (let c = startCol; c < startCol + BOX; c += 1) {
      if ((r !== row || c !== col) && board[r][c] === number) return false;
    }
  }

  return true;
}

function canPlace(board, row, col, number) {
  for (let i = 0; i < SIZE; i += 1) {
    if (board[row][i] === number) return false;
    if (board[i][col] === number) return false;
  }

  const startRow = Math.floor(row / BOX) * BOX;
  const startCol = Math.floor(col / BOX) * BOX;
  for (let r = startRow; r < startRow + BOX; r += 1) {
    for (let c = startCol; c < startCol + BOX; c += 1) {
      if (board[r][c] === number) return false;
    }
  }
  return true;
}

function countSolutions(board, limit = 2) {
  const empty = findEmpty(board);
  if (!empty) return 1;

  let count = 0;
  for (const number of shuffle(NUMBERS)) {
    if (canPlace(board, empty.row, empty.col, number)) {
      board[empty.row][empty.col] = number;
      count += countSolutions(board, limit);
      board[empty.row][empty.col] = 0;
      if (count >= limit) return count;
    }
  }
  return count;
}

function createPuzzle(solution, difficulty = 'medium') {
  const puzzle = cloneBoard(solution);
  const removeTarget = DIFFICULTY[difficulty]?.remove ?? DIFFICULTY.medium.remove;
  const cells = shuffle(Array.from({ length: SIZE * SIZE }, (_, index) => ({
    row: Math.floor(index / SIZE),
    col: index % SIZE
  })));

  let removed = 0;

  for (const { row, col } of cells) {
    if (removed >= removeTarget) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    const solutionsCount = countSolutions(cloneBoard(puzzle), 2);
    if (solutionsCount === 1) {
      removed += 1;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return puzzle;
}

export function generateSudoku(difficulty = 'medium') {
  const solution = generateSolvedBoard();
  const puzzle = createPuzzle(solution, difficulty);
  const fixed = puzzle.map((row) => row.map((value) => value !== 0));

  return {
    puzzle,
    solution,
    fixed
  };
}

export function isComplete(board) {
  return board.every((row) => row.every((cell) => cell !== 0));
}

export function equalsSolution(board, solution) {
  return board.every((row, r) => row.every((cell, c) => cell === solution[r][c]));
}

export function findFirstEmpty(board) {
  return findEmpty(board);
}
