import random

def generate_sudoku(difficulty="easy"):
    """Генерирует валидное поле Судоку и его решение."""
    base = 3
    side = base * base

    def pattern(r, c): 
        return (base * (r % base) + r // base + c) % side
    
    def shuffle(s): 
        return random.sample(s, len(s))

    r_base = range(base)
    rows = [g * base + r for g in shuffle(r_base) for r in shuffle(r_base)]
    cols = [g * base + c for g in shuffle(r_base) for c in shuffle(r_base)]
    nums = shuffle(range(1, side + 1))

    board = [[nums[pattern(r, c)] for c in cols] for r in rows]
    
    # Сохраняем полную копию правильного решения
    solution = [row[:] for row in board]

    # Количество пустых ячеек в зависимости от сложности
    empties = 35 if difficulty == "easy" else 50
    squares = side * side
    
    for sample in random.sample(range(squares), empties):
        board[sample // side][sample % side] = 0

    return board, solution
