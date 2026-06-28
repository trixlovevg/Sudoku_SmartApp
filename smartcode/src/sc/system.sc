theme: /System
    state: Exit
        q!: $regex</выход|закрой приложение|выйти|хватит>
        script:
            sendAction($response, 'CLOSE_APP', {});
        a: Закрываю приложение. До встречи!
