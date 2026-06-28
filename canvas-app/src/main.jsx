import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { generateSudoku, cloneBoard, DIFFICULTY, equalsSolution, findFirstEmpty } from './sudoku/generator.js';
import { initAssistant, parseTextCommand, normalizeDifficulty } from './assistant/assistant.js';
import './styles.css';

const STORAGE_KEY = 'sudoku-salute-state-v1';
const EMPTY_SELECTED = { row: null, col: null };

function createGame(difficulty = 'medium') {
  const { puzzle, solution, fixed } = generateSudoku(difficulty);
  return {
    puzzle,
    solution,
    current: cloneBoard(puzzle),
    fixed,
    selected: EMPTY_SELECTED,
    difficulty,
    moves: 0,
    mistakes: 0,
    message: 'Новая игра создана. Выберите клетку или скажите: выбери строку 1 столбец 1.',
    status: 'playing'
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isInside(row, col) {
  return Number.isInteger(row) && Number.isInteger(col) && row >= 0 && row < 9 && col >= 0 && col < 9;
}

function App() {
  const [game, setGame] = useState(() => loadState() || createGame('medium'));
  const [commandText, setCommandText] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const assistantState = useMemo(() => ({
    selected: game.selected,
    difficulty: game.difficulty,
    moves: game.moves,
    mistakes: game.mistakes,
    status: game.status
  }), [game]);

  useEffect(() => {
    let assistant;
    initAssistant(handleAction, () => assistantState).then((instance) => {
      assistant = instance;
    });
    return () => assistant?.close?.();
  }, []);

  function startNewGame(difficulty = game.difficulty) {
    setGame(createGame(normalizeDifficulty(difficulty)));
  }

  function selectCell(row, col) {
    if (!isInside(row, col)) {
      setGame((prev) => ({ ...prev, message: 'Клетка должна быть в диапазоне от 1 до 9 по строке и столбцу.' }));
      return;
    }
    setGame((prev) => ({ ...prev, selected: { row, col }, message: `Выбрана строка ${row + 1}, столбец ${col + 1}.` }));
  }

  function setNumber(number, row = game.selected.row, col = game.selected.col) {
    if (!Number.isInteger(number) || number < 1 || number > 9) {
      setGame((prev) => ({ ...prev, message: 'Можно поставить только цифру от 1 до 9.' }));
      return;
    }
    if (!isInside(row, col)) {
      setGame((prev) => ({ ...prev, message: 'Сначала выберите клетку: например, строка 3 столбец 4.' }));
      return;
    }
    if (game.fixed[row][col]) {
      setGame((prev) => ({ ...prev, selected: { row, col }, message: 'Эта клетка была задана изначально, её нельзя менять.' }));
      return;
    }

    setGame((prev) => {
      const current = cloneBoard(prev.current);
      current[row][col] = number;
      const mistake = number !== prev.solution[row][col];
      const won = equalsSolution(current, prev.solution);
      return {
        ...prev,
        current,
        selected: { row, col },
        moves: prev.moves + 1,
        mistakes: mistake ? prev.mistakes + 1 : prev.mistakes,
        status: won ? 'win' : 'playing',
        message: won
          ? `Победа! Судоку решено за ${prev.moves + 1} ходов.`
          : mistake
            ? `В строку ${row + 1}, столбец ${col + 1} поставлено ${number}. Это ошибка.`
            : `В строку ${row + 1}, столбец ${col + 1} поставлено ${number}.`
      };
    });
  }

  function clearCell(row = game.selected.row, col = game.selected.col) {
    if (!isInside(row, col)) {
      setGame((prev) => ({ ...prev, message: 'Сначала выберите клетку для очистки.' }));
      return;
    }
    if (game.fixed[row][col]) {
      setGame((prev) => ({ ...prev, selected: { row, col }, message: 'Исходную клетку очистить нельзя.' }));
      return;
    }
    setGame((prev) => {
      const current = cloneBoard(prev.current);
      current[row][col] = 0;
      return {
        ...prev,
        current,
        selected: { row, col },
        moves: prev.moves + 1,
        status: 'playing',
        message: `Клетка ${row + 1}:${col + 1} очищена.`
      };
    });
  }

  function giveHint() {
    const empty = findFirstEmpty(game.current);
    if (!empty) {
      setGame((prev) => ({ ...prev, message: 'Пустых клеток нет. Можно проверить решение.' }));
      return;
    }
    setGame((prev) => {
      const current = cloneBoard(prev.current);
      current[empty.row][empty.col] = prev.solution[empty.row][empty.col];
      const won = equalsSolution(current, prev.solution);
      return {
        ...prev,
        current,
        selected: empty,
        moves: prev.moves + 1,
        status: won ? 'win' : 'playing',
        message: `Подсказка: строка ${empty.row + 1}, столбец ${empty.col + 1} — цифра ${current[empty.row][empty.col]}.`
      };
    });
  }

  function checkBoard() {
    let empty = 0;
    let wrong = 0;
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        if (game.current[r][c] === 0) empty += 1;
        else if (game.current[r][c] !== game.solution[r][c]) wrong += 1;
      }
    }
    const message = wrong === 0 && empty === 0
      ? 'Всё верно. Победа!'
      : `Проверка: пустых клеток — ${empty}, ошибок — ${wrong}.`;
    setGame((prev) => ({ ...prev, status: wrong === 0 && empty === 0 ? 'win' : prev.status, message }));
  }

  function handleAction(action) {
    if (!action) return;
    switch (action.type) {
      case 'NEW_GAME': startNewGame(action.difficulty); break;
      case 'SELECT_CELL': selectCell(action.row, action.col); break;
      case 'SET_NUMBER': setNumber(Number(action.number), action.row, action.col); break;
      case 'CLEAR_CELL': clearCell(action.row, action.col); break;
      case 'HINT': giveHint(); break;
      case 'CHECK': checkBoard(); break;
      case 'HELP': setShowHelp(true); break;
      default:
        setGame((prev) => ({ ...prev, message: 'Команда не распознана. Скажите: помощь.' }));
    }
  }

  function submitCommand(event) {
    event.preventDefault();
    const action = parseTextCommand(commandText);
    handleAction(action || { type: 'UNKNOWN' });
    setCommandText('');
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">Canvas App + Салют</p>
          <h1>Судоку голосом</h1>
          <p>Решайте Судоку на экране или голосом: выбирайте клетки, ставьте цифры, берите подсказки и проверяйте поле.</p>
        </div>
        <div className="panel stats">
          <span>Сложность: <b>{DIFFICULTY[game.difficulty]?.label}</b></span>
          <span>Ходы: <b>{game.moves}</b></span>
          <span>Ошибки: <b>{game.mistakes}</b></span>
        </div>
      </section>

      <section className="layout">
        <div className="board" aria-label="Игровое поле Судоку">
          {game.current.map((row, r) => row.map((value, c) => {
            const selected = game.selected.row === r && game.selected.col === c;
            const fixed = game.fixed[r][c];
            const wrong = value !== 0 && value !== game.solution[r][c];
            return (
              <button
                type="button"
                key={`${r}-${c}`}
                className={`cell ${selected ? 'selected' : ''} ${fixed ? 'fixed' : ''} ${wrong ? 'wrong' : ''}`}
                onClick={() => selectCell(r, c)}
                aria-label={`строка ${r + 1}, столбец ${c + 1}`}
              >
                {value || ''}
              </button>
            );
          }))}
          {game.status === 'win' && <div className="win">Победа!</div>}
        </div>

        <aside className="side panel">
          <p className="message">{game.message}</p>

          <div className="numbers">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((number) => (
              <button type="button" key={number} onClick={() => setNumber(number)}>{number}</button>
            ))}
          </div>

          <div className="actions">
            <button type="button" onClick={() => clearCell()}>Очистить</button>
            <button type="button" onClick={giveHint}>Подсказка</button>
            <button type="button" onClick={checkBoard}>Проверить</button>
          </div>

          <div className="actions difficulty">
            <button type="button" onClick={() => startNewGame('easy')}>Лёгкая</button>
            <button type="button" onClick={() => startNewGame('medium')}>Средняя</button>
            <button type="button" onClick={() => startNewGame('hard')}>Сложная</button>
          </div>

          <button type="button" className="primary" onClick={() => startNewGame(game.difficulty)}>Новая игра</button>
          <button type="button" className="secondary" onClick={() => setShowHelp(true)}>Что ты умеешь?</button>
        </aside>
      </section>

      <form className="test-command panel" onSubmit={submitCommand}>
        <label htmlFor="command">Тест голосовой команды в браузере</label>
        <div>
          <input
            id="command"
            value={commandText}
            onChange={(event) => setCommandText(event.target.value)}
            placeholder="Например: поставь 5 в строку 3 столбец 4"
          />
          <button type="submit">Выполнить</button>
        </div>
      </form>

      {showHelp && (
        <div className="modal" onClick={() => setShowHelp(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h2>Голосовые команды</h2>
            <ul>
              <li>«Новая игра», «Новая лёгкая игра», «Новая сложная игра»</li>
              <li>«Выбери строку 3 столбец 4»</li>
              <li>«Поставь 5»</li>
              <li>«Поставь 5 в строку 3 столбец 4»</li>
              <li>«Очисти клетку»</li>
              <li>«Подсказка»</li>
              <li>«Проверить»</li>
            </ul>
            <button type="button" className="primary" onClick={() => setShowHelp(false)}>Понятно</button>
          </div>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
