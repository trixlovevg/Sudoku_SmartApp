theme: /

    state: Start
        q!: $regex<.*>
        script:
            var text = String($request.query || "").toLowerCase();
            text = text.replace(/ё/g, "е");

            var action = null;
            var answer = "";

            var numberWords = {
                "один": 1,
                "одна": 1,
                "единица": 1,
                "единицу": 1,
                "первый": 1,
                "первая": 1,
                "первого": 1,

                "два": 2,
                "две": 2,
                "двойка": 2,
                "двойку": 2,
                "второй": 2,
                "вторая": 2,
                "второго": 2,

                "три": 3,
                "тройка": 3,
                "тройку": 3,
                "третий": 3,
                "третья": 3,
                "третьего": 3,

                "четыре": 4,
                "четверка": 4,
                "четверку": 4,
                "четвертый": 4,
                "четвертая": 4,
                "четвертого": 4,

                "пять": 5,
                "пятерка": 5,
                "пятерку": 5,
                "пятый": 5,
                "пятая": 5,
                "пятого": 5,

                "шесть": 6,
                "шестерка": 6,
                "шестерку": 6,
                "шестой": 6,
                "шестая": 6,
                "шестого": 6,

                "семь": 7,
                "семерка": 7,
                "семерку": 7,
                "седьмой": 7,
                "седьмая": 7,
                "седьмого": 7,

                "восемь": 8,
                "восьмерка": 8,
                "восьмерку": 8,
                "восьмой": 8,
                "восьмая": 8,
                "восьмого": 8,

                "девять": 9,
                "девятка": 9,
                "девятку": 9,
                "девятый": 9,
                "девятая": 9,
                "девятого": 9
            };

            function parseNumber(value) {
                value = String(value || "").toLowerCase();
                value = value.replace(/ё/g, "е");

                var digit = parseInt(value, 10);

                if (!isNaN(digit) && digit >= 1 && digit <= 9) {
                    return digit;
                }

                if (numberWords[value]) {
                    return numberWords[value];
                }

                return null;
            }

            function findNumberAfter(labelRegex) {
                var pattern = new RegExp(
                    "(" + labelRegex + ")" +
                    "\\s*(?:под)?\\s*(?:номером|номер)?\\s*" +
                    "([1-9]|один|одна|единица|единицу|первый|первая|первого|два|две|двойка|двойку|второй|вторая|второго|три|тройка|тройку|третий|третья|третьего|четыре|четверка|четверку|четвертый|четвертая|четвертого|пять|пятерка|пятерку|пятый|пятая|пятого|шесть|шестерка|шестерку|шестой|шестая|шестого|семь|семерка|семерку|седьмой|седьмая|седьмого|восемь|восьмерка|восьмерку|восьмой|восьмая|восьмого|девять|девятка|девятку|девятый|девятая|девятого)",
                    "i"
                );

                var match = text.match(pattern);

                if (match && match[2]) {
                    return parseNumber(match[2]);
                }

                return null;
            }

            function getAllNumbers() {
                var pattern = /[1-9]|один|одна|единица|единицу|первый|первая|первого|два|две|двойка|двойку|второй|вторая|второго|три|тройка|тройку|третий|третья|третьего|четыре|четверка|четверку|четвертый|четвертая|четвертого|пять|пятерка|пятерку|пятый|пятая|пятого|шесть|шестерка|шестерку|шестой|шестая|шестого|семь|семерка|семерку|седьмой|седьмая|седьмого|восемь|восьмерка|восьмерку|восьмой|восьмая|восьмого|девять|девятка|девятку|девятый|девятая|девятого/g;

                var result = [];
                var match;

                while ((match = pattern.exec(text)) !== null) {
                    var number = parseNumber(match[0]);

                    if (number !== null) {
                        result.push(number);
                    }
                }

                return result;
            }

            function getSetNumber() {
                var pattern = /(?:поставь|поставить|введи|ввести|напиши|укажи)\s*(?:цифру|число)?\s*([1-9]|один|одна|единица|единицу|два|две|три|четыре|пять|шесть|семь|восемь|девять|двойку|тройку|четверку|пятерку|шестерку|семерку|восьмерку|девятку)/i;
                var match = text.match(pattern);

                if (match && match[1]) {
                    return parseNumber(match[1]);
                }

                var nums = getAllNumbers();

                if (nums.length > 0) {
                    return nums[0];
                }

                return null;
            }

            var rowNumber = findNumberAfter("строка|строку|строки|строке|ряд");
            var colNumber = findNumberAfter("столбец|столбца|столбцу|столбце|колонка|колонку|колонки|колонке");

            if (text.indexOf("легк") !== -1 || text.indexOf("легкий") !== -1) {
                action = {
                    type: "NEW_GAME",
                    difficulty: "easy"
                };
                answer = "Запускаю легкую игру.";

            } else if (text.indexOf("сред") !== -1 || text.indexOf("обыч") !== -1) {
                action = {
                    type: "NEW_GAME",
                    difficulty: "medium"
                };
                answer = "Запускаю среднюю игру.";

            } else if (text.indexOf("слож") !== -1 || text.indexOf("труд") !== -1) {
                action = {
                    type: "NEW_GAME",
                    difficulty: "hard"
                };
                answer = "Запускаю сложную игру.";

            } else if (text.indexOf("нов") !== -1 || text.indexOf("занов") !== -1 || text.indexOf("нач") !== -1 || text.indexOf("перезап") !== -1) {
                action = {
                    type: "NEW_GAME"
                };
                answer = "Начинаю новую игру.";

            } else if (text.indexOf("подсказ") !== -1 || text.indexOf("подскажи") !== -1) {
                action = {
                    type: "HINT"
                };
                answer = "Показываю подсказку.";

            } else if (text.indexOf("провер") !== -1 || text.indexOf("ошиб") !== -1 || text.indexOf("правильно") !== -1) {
                action = {
                    type: "CHECK"
                };
                answer = "Проверяю поле.";

            } else if (text.indexOf("очист") !== -1 || text.indexOf("сотри") !== -1 || text.indexOf("убери") !== -1) {
                if (rowNumber !== null && colNumber !== null) {
                    action = {
                        type: "CLEAR_CELL",
                        row: rowNumber - 1,
                        col: colNumber - 1
                    };
                    answer = "Очищаю клетку в строке " + rowNumber + ", столбце " + colNumber + ".";
                } else {
                    action = {
                        type: "CLEAR_CELL"
                    };
                    answer = "Очищаю выбранную клетку.";
                }

            } else if (text.indexOf("помощ") !== -1 || text.indexOf("что ты умеешь") !== -1 || text.indexOf("как играть") !== -1 || text.indexOf("команд") !== -1) {
                action = {
                    type: "HELP"
                };
                answer = "Я умею запускать новую игру, менять сложность, давать подсказку, проверять поле, выбирать клетку и ставить цифры.";

            } else if (
                text.indexOf("постав") !== -1 ||
                text.indexOf("введ") !== -1 ||
                text.indexOf("напиши") !== -1 ||
                text.indexOf("цифр") !== -1 ||
                text.indexOf("число") !== -1
            ) {
                var setNumber = getSetNumber();

                if (setNumber !== null && rowNumber !== null && colNumber !== null) {
                    action = {
                        type: "SET_NUMBER",
                        number: setNumber,
                        row: rowNumber - 1,
                        col: colNumber - 1
                    };
                    answer = "Ставлю " + setNumber + " в строку " + rowNumber + ", столбец " + colNumber + ".";
                } else if (setNumber !== null) {
                    action = {
                        type: "SET_NUMBER",
                        number: setNumber
                    };
                    answer = "Ставлю " + setNumber + ".";
                } else {
                    action = {
                        type: "HELP"
                    };
                    answer = "Не поняла, какую цифру поставить.";
                }

            } else if (
                text.indexOf("выбери") !== -1 ||
                text.indexOf("выбрать") !== -1 ||
                text.indexOf("перейди") !== -1 ||
                text.indexOf("клетк") !== -1 ||
                text.indexOf("ячейк") !== -1
            ) {
                if (rowNumber !== null && colNumber !== null) {
                    action = {
                        type: "SELECT_CELL",
                        row: rowNumber - 1,
                        col: colNumber - 1
                    };
                    answer = "Выбираю строку " + rowNumber + ", столбец " + colNumber + ".";
                } else {
                    action = {
                        type: "HELP"
                    };
                    answer = "Назовите строку и столбец клетки.";
                }

            } else {
                action = {
                    type: "HELP"
                };
                answer = "Команда не распознана. Скажите: новая игра, подсказка, проверить, помощь или поставь цифру один в строку два столбец один.";
            }

            $response.setPronounceText(answer);

            $response.replies = $response.replies || [];
            $response.replies.push({
                type: "raw",
                messageName: "ANSWER_TO_USER",
                body: {
                    items: [
                        {
                            command: {
                                type: "smart_app_data",
                                action: action
                            }
                        }
                    ]
                }
            });