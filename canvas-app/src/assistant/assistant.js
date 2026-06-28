const NUMBER_WORDS = {
  один: 1, одна: 1, первое: 1, первый: 1,
  два: 2, две: 2, второе: 2, второй: 2,
  три: 3, третье: 3, третий: 3,
  четыре: 4, четвертое: 4, четвёртое: 4, четвертый: 4, четвёртый: 4,
  пять: 5, пятое: 5, пятый: 5,
  шесть: 6, шестое: 6, шестой: 6,
  семь: 7, седьмое: 7, седьмой: 7,
  восемь: 8, восьмое: 8, восьмой: 8,
  девять: 9, девятое: 9, девятый: 9
};

export function normalizeDifficulty(value) {
  const text = String(value || '').toLowerCase().replace(/ё/g, 'е');

  // Внутренние значения, которые приходят от кнопок интерфейса
  if (text === 'easy' || text === 'light') return 'easy';
  if (text === 'medium' || text === 'normal') return 'medium';
  if (text === 'hard') return 'hard';

  // Русские голосовые команды
  if (text.includes('лег')) return 'easy';
  if (text.includes('слож') || text.includes('труд')) return 'hard';
  if (text.includes('сред') || text.includes('обыч')) return 'medium';

  return 'medium';
}

function parseNumbers(text) {
  const raw = String(text || '').toLowerCase().replace(/ё/g, 'е');
  const digitNumbers = raw.match(/[1-9]/g)?.map(Number) ?? [];
  const wordNumbers = raw
    .split(/[^а-яa-z0-9]+/i)
    .map((word) => NUMBER_WORDS[word])
    .filter(Boolean);
  return [...digitNumbers, ...wordNumbers];
}

export function parseTextCommand(text) {
  const normalized = String(text || '').toLowerCase().replace(/ё/g, 'е').trim();
  const nums = parseNumbers(normalized);

  if (!normalized) return null;
  if (normalized.includes('помощ') || normalized.includes('умееш') || normalized.includes('как играть')) {
    return { type: 'HELP' };
  }
  if (normalized.includes('нов') || normalized.includes('занов') || normalized.includes('перезап')) {
    return { type: 'NEW_GAME', difficulty: normalizeDifficulty(normalized) };
  }
  if (normalized.includes('подсказ')) return { type: 'HINT' };
  if (normalized.includes('провер')) return { type: 'CHECK' };
  if (normalized.includes('очист') || normalized.includes('сотри') || normalized.includes('убери')) {
    if (nums.length >= 2) return { type: 'CLEAR_CELL', row: nums[0] - 1, col: nums[1] - 1 };
    return { type: 'CLEAR_CELL' };
  }
  if (normalized.includes('выбер') || normalized.includes('клет') || normalized.includes('строк') || normalized.includes('столб')) {
    if (normalized.includes('постав') || normalized.includes('введ') || normalized.includes('напиши')) {
      if (nums.length >= 3) return { type: 'SET_NUMBER', number: nums[0], row: nums[1] - 1, col: nums[2] - 1 };
    }
    if (nums.length >= 2) return { type: 'SELECT_CELL', row: nums[0] - 1, col: nums[1] - 1 };
  }
  if (normalized.includes('постав') || normalized.includes('введ') || normalized.includes('напиши') || normalized.includes('цифр')) {
    if (nums.length >= 3) return { type: 'SET_NUMBER', number: nums[0], row: nums[1] - 1, col: nums[2] - 1 };
    if (nums.length >= 1) return { type: 'SET_NUMBER', number: nums[0] };
  }

  if (nums.length === 1) return { type: 'SET_NUMBER', number: nums[0] };
  if (nums.length >= 2) return { type: 'SELECT_CELL', row: nums[0] - 1, col: nums[1] - 1 };

  return null;
}

export async function initAssistant(onAction, getState) {
  try {
    const salute = await import('@salutejs/client');
    const createAssistant = salute.createAssistant || salute.default?.createAssistant;
    if (!createAssistant) throw new Error('createAssistant не найден');

    const assistant = createAssistant({ getState });
    assistant.on('data', (command) => {
      const action = command?.action || command?.smart_app_data || command?.data || command;
      if (action?.type) onAction(action);
    });

    return assistant;
  } catch (error) {
    console.warn('Assistant Client не подключен. В браузере доступна тестовая строка команд.', error);
    return null;
  }
}
