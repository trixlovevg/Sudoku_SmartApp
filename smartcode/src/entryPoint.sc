require: js/actions.js
require: js/reply.js
require: sc/game.sc
require: sc/help.sc
require: sc/system.sc

theme: /
    state: Start
        q!: $regex</start|запусти|открой|включи>
        a: Привет! Это Судоку голосом. Можно играть на экране или голосом. Скажите: помощь, чтобы узнать команды.

    state: Fallback
        event!: noMatch
        a: Я пока не поняла команду. Скажите: помощь.
