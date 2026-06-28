from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sudoku_logic import generate_sudoku
import re

app = FastAPI()

# Настройка CORS, чтобы Фронтенд мог свободно общаться с Бэкендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Хранилище игровых сессий: {user_id: {"board": [...], "solution": [...]}}
sessions = {}

# Карта перевода русских и английских букв в индексы столбцов (0-8)
LETTERS_MAP = {
    'а': 0, 'б': 1, 'в': 2, 'г': 3, 'д': 4, 'е': 5, 'ж': 6, 'з': 7, 'и': 8,
    'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7, 'i': 8
}

def parse_voice_command(text: str):
    """Разбор текста пользователя для определения интента."""
    text = text.lower().strip()
    
    if not text:
        return "unknown", None, None, None

    # Интент: Начать заново
    if any(phrase in text for phrase in ["новая игра", "начни сначала", "заново", "старт"]):
        return "new_game", None, None, None
        
    # Интент: Показать решение / Сдаться
    if any(phrase in text for phrase in ["сдаюсь", "покажи решение", "решить"]):
        return "show_solution", None, None, None

    # Интент: Помощь
    if any(phrase in text for phrase in ["помощь", "что ты умеешь", "правила"]):
        return "help", None, None, None

    # Интент: Сделать ход (например, "поставь 5 на б 3" или "цифра 5 в ячейку а1")
    # Ищем шаблон: цифра (1-9), затем буква (а-и), затем цифра ряда (1-9)
    match1 = re.search(r'([1-9])\s*(?:в|на|в ячейку)?\s*([а-иa-i])\s*([1-9])', text)
    if match1:
        return "put_number", int(match1.group(1)), match1.group(2), int(match1.group(3))

    # Обратный шаблон: "на б 3 поставь 5"
    match2 = re.search(r'(?:на|в)?\s*([а-иa-i])\s*([1-9])\s*(?:поставь|цифру)?\s*([1-9])', text)
    if match2:
        return "put_number", int(match2.group(3)), match2.group(1), int(match2.group(2))

    return "unknown", None, None, None

@app.post("/webhook")
async def webhook(request: Request):
    """Основная точка входа для ассистента Салют."""
    body = await request.json()
    
    # Экстракция текста пользователя из структуры запроса SmartMarket
    try:
        user_text = body['request']['payload']['message']['original_text']
    except KeyError:
        user_text = ""

    # Идентификатор сессии пользователя
    user_id = body.get('session', {}).get('user', {}).get('userId', 'default_user')
    
    intent, num, letter, row_num = parse_voice_command(user_text)
    
    response_text = "Я вас не поняла. Скажите, например: 'Поставь цифру 5 на Б 3' или 'Новая игра'."
    directive = None

    # Обработка интентов
    if intent == "new_game" or user_id not in sessions:
        board, solution = generate_sudoku("easy")
        sessions[user_id] = {"board": board, "solution": solution}
        response_text = "Открываю новое игровое поле Судоку. Удачи!"
        directive = {"type": "SUDOKU_INIT", "board": board}

    elif intent == "put_number":
        col_idx = LETTERS_MAP.get(letter)
        row_idx = row_num - 1  # перевод из 1..9 в индексы массива 0..8
        
        if 0 <= row_idx < 9 and col_idx is not None:
            sol = sessions[user_id]["solution"]
            cur_board = sessions[user_id]["board"]
            
            if cur_board[row_idx][col_idx] != 0:
                response_text = f"Ячейка {letter.upper()}{row_num} уже заполнена!"
            elif sol[row_idx][col_idx] == num:
                sessions[user_id]["board"][row_idx][col_idx] = num
                response_text = f"Правильно! Ставлю {num} на {letter.upper()}{row_num}."
                directive = {"type": "SUDOKU_MOVE", "row": row_idx, "col": col_idx, "val": num}
                
                # Проверка на полное завершение игры
                if sessions[user_id]["board"] == sol:
                    response_text += " Поздравляю, вы полностью решили Судоку!"
            else:
                response_text = f"Цифра {num} не подходит в ячейку {letter.upper()}{row_num}.
Попробуйте другой вариант."
        else:
            response_text = "Неверные координаты ячейки. Используйте буквы от А до И и цифры от 1 до 9."

    elif intent == "show_solution":
        response_text = "Вот полное решение головоломки."
        directive = {"type": "SUDOKU_INIT", "board": sessions[user_id]["solution"]}
        
    elif intent == "help":
        response_text = "Это игра Судоку. Называйте букву столбца и цифру строки, чтобы сделать ход. Например: 'Поставь 5 на Б 3'. Чтобы начать заново, скажите 'Новая игра'."

    # Формируем стандартный ответ в формате SmartApp API
    response_body = {
        "response": {
            "text": response_text,
            "endSession": False
        },
        "version": "1.0"
    }
    
    # Если есть изменения для экрана, упаковываем их в директиву
    if directive:
        response_body["response"]["payload"] = {"directives": [directive]}
        
    return response_body
