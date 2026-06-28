theme: /Game
    state: NewEasy
        q!: $regex</новая легкая игра|лёгкая игра|начни легкую|новая лёгкая>
        script:
            sendAction($response, 'NEW_GAME', { difficulty: 'easy' });
        a: Запускаю лёгкую игру.

    state: NewMedium
        q!: $regex</новая средняя игра|средняя игра|начни среднюю>
        script:
            sendAction($response, 'NEW_GAME', { difficulty: 'medium' });
        a: Запускаю среднюю игру.

    state: NewHard
        q!: $regex</новая сложная игра|сложная игра|начни сложную>
        script:
            sendAction($response, 'NEW_GAME', { difficulty: 'hard' });
        a: Запускаю сложную игру.

    state: NewGame
        q!: $regex</новая игра|начать сначала|перезапусти игру|заново>
        script:
            sendAction($response, 'NEW_GAME', { difficulty: 'medium' });
        a: Начинаем новую игру.

    state: Hint
        q!: $regex</подсказка|дай подсказку|помоги с ходом>
        script:
            sendAction($response, 'HINT', {});
        a: Даю подсказку.

    state: Check
        q!: $regex</проверить|проверь поле|есть ошибки|правильно>
        script:
            sendAction($response, 'CHECK', {});
        a: Проверяю поле.

    state: Clear
        q!: $regex</очисти клетку|сотри клетку|убери цифру>
        script:
            sendAction($response, 'CLEAR_CELL', {});
        a: Очищаю выбранную клетку.

# Вариант для полноценного SmartMarket Studio:
# лучше создать интенты /selectCell и /setNumberToCell с сущностями row, col, number.
# Тогда в сценарии нужно отправлять:
# sendAction($response, 'SELECT_CELL', { row: row - 1, col: col - 1 });
# sendAction($response, 'SET_NUMBER', { number: number, row: row - 1, col: col - 1 });
