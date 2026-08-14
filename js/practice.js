/**
 * practice.js — СР ДПС Тренажёр отыгровок v3.0
 * ПДП: выбор травмы, ухудшение состояния, таймер
 * Переговоры: диалог с ИИ-террористом с семантическим анализом ответов
 */

document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chatBox');
    const commandInput = document.getElementById('commandInput');
    const sendBtn = document.getElementById('sendBtn');
    const resetBtn = document.getElementById('resetPractice');
    const hintBtn = document.getElementById('showHintBtn');
    const hintBox = document.getElementById('hintBox');
    const hintText = document.getElementById('hintText');
    const currentStepEl = document.getElementById('currentStep');
    const totalStepsEl = document.getElementById('totalSteps');
    const scenarioNameEl = document.getElementById('scenarioName');
    const statusPanel = document.getElementById('statusPanel');
    const victimStatus = document.getElementById('victimStatus');
    const victimBleeding = document.getElementById('victimBleeding');
    const timeCounter = document.getElementById('timeCounter');

    let currentScenario = 'first-aid';
    let currentStep = 0;
    let isComplete = false;
    let currentInjury = 'pulevoe';
    let mode = 'hard';
    let timerInterval = null;
    let seconds = 0;
    let tryIndex = {};
    let responseCount = 0;

    // =========================================================
    // ПЕРЕГОВОРЫ — СЕМАНТИЧЕСКИЙ АНАЛИЗ
    // =========================================================

    const goodPhrases = [
        'согласен', 'принимаю', 'выполню', 'хорошо', 'ладно', 'сделаю',
        'давайте', 'договоримся', 'понял', 'понимаю', 'слушаю',
        'готов', 'буду', 'сделаем', 'решим', 'найдём', 'мирно',
        'диалог', 'договор', 'соглашение', 'отпустите', 'освободите',
        'выведите', 'безопасность', 'гарантирую', 'обещаю', 'сделаю всё',
        'постараюсь', 'выкуп', 'деньги', 'вертолёт', 'машина', 'выход',
        'заложники', 'люди', 'жизнь', 'безопасно', 'поможем', 'поддержим',
        'встретим', 'организуем', 'предоставим', 'дадим', 'обеспечим',
        'конечно', 'да', 'сделаем', 'выполним', 'согласны'
    ];

    const badPhrases = [
        'соси', 'нахуй', 'блять', 'хуй', 'пизда', 'ебать', 'выкинь',
        'завали', 'заткнись', 'пошёл', 'пошла', 'мудак', 'козёл',
        'сволочь', 'тварь', 'ублюдок', 'сдохни', 'умри', 'застрели',
        'убей', 'кончай', 'отказываюсь', 'агрессия', 'угроза', 'штурм',
        'спецназ', 'фсб', 'сдох', 'сдохла', 'сдохло', 'соси хуй',
        'иди нахуй', 'похуй', 'заебало', 'заебал', 'заебала', 'пиздец',
        'нет', 'не буду', 'не сделаю', 'не согласен', 'отказ',
        'завали ебало', 'завали хлебало', 'заткни пасть'
    ];

    function analyzeResponse(text) {
        const lower = text.toLowerCase();
        let goodScore = 0;
        let badScore = 0;
        let matchedGood = [];
        let matchedBad = [];

        for (const phrase of goodPhrases) {
            if (lower.includes(phrase)) {
                goodScore++;
                matchedGood.push(phrase);
            }
        }

        for (const phrase of badPhrases) {
            if (lower.includes(phrase)) {
                badScore++;
                matchedBad.push(phrase);
            }
        }

        const uniqueGood = [...new Set(matchedGood)];
        const uniqueBad = [...new Set(matchedBad)];

        return { 
            goodScore: uniqueGood.length, 
            badScore: uniqueBad.length,
            matchedGood: uniqueGood,
            matchedBad: uniqueBad
        };
    }

    // =========================================================
    // СЦЕНАРИИ
    // =========================================================

    const scenarios = {

        'svu-do': {
            name: 'СВУ /do',
            description: 'Разминирование СВУ с ИИ-отыгровщиком',
            context: 'Ты сапёр. ИИ-отыгровщик отвечает на /do вопросы.',
            steps: getSvuDoSteps()
        },

        'svu-try': {
            name: 'СВУ /try',
            description: 'Разминирование СВУ без отыгровщика',
            context: 'Ты сапёр. Все проверки через /try.',
            steps: getSvuTrySteps()
        },

        'rastyazhka': {
            name: 'Растяжка',
            description: 'Обезвреживание натяжного взрывного устройства',
            context: 'Ты видишь растяжку. Только /me и /do.',
            steps: getRastyazhkaSteps()
        },

        'first-aid': {
            name: 'ПДП',
            description: 'Первая помощь при различных состояниях',
            context: 'Ты на месте происшествия. Оцени состояние пострадавшего.',
            steps: [],
            getStepsForInjury: function(injury) {
                const map = {
                    'pulevoe': getPulevoeSteps(),
                    'zakrytyi_perelom': getZakrytyiPerelomSteps(),
                    'otkrytyi_perelom': getOtkrytyiPerelomSteps(),
                    'kapillyarnoe': getKapillyarnoeSteps(),
                    'venoznoe': getVenoznoeSteps(),
                    'arterialnoe': getArterialnoeSteps()
                };
                return map[injury] || [];
            }
        },

        'peregovory': {
            name: 'Переговоры',
            description: 'Ведение переговоров с преступниками',
            context: 'Ты на переговорах. Отвечай террористу ТЕКСТОМ. Только одна /me — поднять руки.',
            steps: [],
            getStepsForMode: function(mode) {
                return getPeregovorySteps(mode);
            }
        }
    };

    // =========================================================
    // ФАБРИКИ ШАГОВ
    // =========================================================

    function getSvuDoSteps() {
        return [
            { id: 'prepare', type: 'me', action: 'Подготовка снаряжения' },
            { id: 'wear_zkc', type: 'me', action: 'Одевание ЗКС' },
            { id: 'drp_on', type: 'me', action: 'Включение ДРП' },
            { id: 'ask_drp', type: 'do', action: 'Спросить цвет лампочки', isQuestion: true, doResponse: 'Красная.' },
            { id: 'ask_drp', type: 'do', action: 'Спросить цвет лампочки', isQuestion: true, doResponse: 'Желтая. (СВУ ~50м)' },
            { id: 'ask_drp', type: 'do', action: 'Спросить цвет лампочки', isQuestion: true, doResponse: 'Желтая.' },
            { id: 'ask_drp', type: 'do', action: 'Спросить цвет лампочки', isQuestion: true, doResponse: 'Зелёная. (СВУ ~5м)' },
            { id: 'drp_off', type: 'me', action: 'Выключение ДРП' },
            { id: 'pelena_setup', type: 'me', action: 'Установка Пелены-12' },
            { id: 'screwdriver', type: 'me', action: 'Доставание отвёртки' },
            { id: 'inspect', type: 'me', action: 'Осмотр СВУ' },
            { id: 'ask_bolts', type: 'do', action: 'Спросить количество болтов', isQuestion: true, doResponse: '4 болта.' },
            { id: 'unscrew', type: 'me', action: 'Откручивание болтов' },
            { id: 'lift_cover', type: 'me', action: 'Поднятие крышки' },
            { id: 'ask_cover', type: 'do', action: 'Спросить что на крышке', isQuestion: true, doResponse: 'Леска на крышке.' },
            { id: 'ask_line', type: 'do', action: 'Спросить про леску', isQuestion: true, doResponse: 'Да.' },
            { id: 'cut_line', type: 'me', action: 'Перерезание лески' },
            { id: 'look_inside', type: 'me', action: 'Осмотр внутренностей' },
            { id: 'ask_wires', type: 'do', action: 'Спросить количество проводов', isQuestion: true, doResponse: '3 провода.' },
            { id: 'multimeter_take', type: 'me', action: 'Доставание мультиметра' },
            { id: 'check_wires', type: 'me', action: 'Проверка проводов' },
            { id: 'ask_wire_1', type: 'do', action: 'Спросить напряжение 1 провода', isQuestion: true, doResponse: '23,6.' },
            { id: 'check_wire_2', type: 'me', action: 'Проверка 2 провода' },
            { id: 'ask_wire_2', type: 'do', action: 'Спросить напряжение 2 провода', isQuestion: true, doResponse: '0.' },
            { id: 'check_wire_3', type: 'me', action: 'Проверка 3 провода' },
            { id: 'ask_wire_3', type: 'do', action: 'Спросить напряжение 3 провода', isQuestion: true, doResponse: '-23,6.' },
            { id: 'multimeter_off', type: 'me', action: 'Выключение мультиметра' },
            { id: 'cut_wires', type: 'me', action: 'Перекус проводов (1-3-2)' },
            { id: 'titan_case', type: 'me', action: 'Доставание кейса' },
            { id: 'remove_charge', type: 'me', action: 'Извлечение заряда' },
            { id: 'pack_case', type: 'me', action: 'Упаковка в кейс' },
            { id: 'cleanup', type: 'me', action: 'Завершение' }
        ];
    }

    function getSvuTrySteps() {
        return [
            { id: 'prepare', type: 'me', action: 'Подготовка снаряжения' },
            { id: 'wear_zkc', type: 'me', action: 'Одевание ЗКС' },
            { id: 'drp_on', type: 'me', action: 'Включение ДРП' },
            { id: 'drp_check', type: 'try', action: 'Проверка ДРП', results: ['удачно','удачно','неудачно','удачно','удачно','неудачно','удачно'] },
            { id: 'drp_off', type: 'me', action: 'Выключение ДРП' },
            { id: 'pelena_setup', type: 'me', action: 'Установка Пелены-12' },
            { id: 'screwdriver', type: 'me', action: 'Доставание отвёртки' },
            { id: 'inspect', type: 'me', action: 'Осмотр СВУ' },
            { id: 'inspect_cover', type: 'try', action: 'Осмотр крышки', results: ['неудачно','удачно'] },
            { id: 'unscrew', type: 'me', action: 'Откручивание болтов' },
            { id: 'lift_cover', type: 'me', action: 'Поднятие крышки' },
            { id: 'inspect_cover_back', type: 'try', action: 'Осмотр задней стороны', results: ['удачно','удачно','удачно'] },
            { id: 'cut_line', type: 'me', action: 'Перерезание лески' },
            { id: 'look_inside', type: 'me', action: 'Осмотр внутренностей' },
            { id: 'inspect_wires', type: 'try', action: 'Осмотр проводов', results: ['неудачно','удачно'] },
            { id: 'multimeter_take', type: 'me', action: 'Доставание мультиметра' },
            { id: 'check_wire_1', type: 'me', action: 'Проверка 1 провода' },
            { id: 'check_wire_1_voltage', type: 'try', action: 'Напряжение 1 провода', results: ['удачно','удачно'] },
            { id: 'check_wire_2', type: 'me', action: 'Проверка 2 провода' },
            { id: 'check_wire_2_voltage', type: 'try', action: 'Напряжение 2 провода', results: ['неудачно'] },
            { id: 'check_wire_3', type: 'me', action: 'Проверка 3 провода' },
            { id: 'check_wire_3_voltage', type: 'try', action: 'Напряжение 3 провода', results: ['удачно','удачно'] },
            { id: 'multimeter_off', type: 'me', action: 'Выключение мультиметра' },
            { id: 'cut_wires', type: 'me', action: 'Перекус проводов (1-3-2)' },
            { id: 'titan_case', type: 'me', action: 'Доставание кейса' },
            { id: 'remove_charge', type: 'me', action: 'Извлечение заряда' },
            { id: 'pack_case', type: 'me', action: 'Упаковка в кейс' },
            { id: 'cleanup', type: 'me', action: 'Завершение' }
        ];
    }

    function getRastyazhkaSteps() {
        return [
            { id: 'grab', type: 'me', action: 'Захват гранаты' },
            { id: 'bend_pin', type: 'me', action: 'Разведение шплинта' },
            { id: 'check_fell', type: 'do', action: 'Падение чеки' },
            { id: 'cut_wire', type: 'me', action: 'Перекус проволоки' },
            { id: 'insert_check', type: 'me', action: 'Вставка чеки' }
        ];
    }

    function getPulevoeSteps() {
        return [
            { id: 'call_ambulance', type: 'me', action: 'Вызов скорой' },
            { id: 'tilt_head', type: 'me', action: 'Запрокидывание головы (если без сознания)' },
            { id: 'take_kit', type: 'me', action: 'Доставание аптечки' },
            { id: 'kit_open', type: 'do', action: 'Аптечка открыта' },
            { id: 'ask_bleeding', type: 'do', action: 'Есть ли кровотечение?' },
            { id: 'ask_bleeding_type', type: 'do', action: 'Какое кровотечение и где?' },
            { id: 'ask_contraindications', type: 'do', action: 'Противопоказания на обезбол?' },
            { id: 'take_syringe', type: 'me', action: 'Доставание шприца' },
            { id: 'inject', type: 'me', action: 'Укол обезболивающего (крест-накрест)' },
            { id: 'treat_edges', type: 'me', action: 'Обработка краёв раны зеленкой' },
            { id: 'apply_bandage', type: 'me', action: 'Наложение давящей повязки' },
            { id: 'tamponade_done', type: 'do', action: 'Тампонад наложен' },
            { id: 'tear_clothes', type: 'me', action: 'Разрыв одежды в зоне ранения' }
        ];
    }

    function getZakrytyiPerelomSteps() {
        return [
            { id: 'lay_down', type: 'me', action: 'Уложить человека на пол' },
            { id: 'horizontal', type: 'do', action: 'Человек в горизонтальном положении' },
            { id: 'call_ambulance', type: 'me', action: 'Вызов скорой' },
            { id: 'take_kit', type: 'me', action: 'Доставание аптечки' },
            { id: 'kit_open', type: 'do', action: 'Аптечка открыта' },
            { id: 'take_splint', type: 'me', action: 'Наложение медицинской шины' },
            { id: 'fix_splint', type: 'me', action: 'Фиксация шины бинтами' },
            { id: 'splint_fixed', type: 'do', action: 'Шина зафиксирована' }
        ];
    }

    function getOtkrytyiPerelomSteps() {
        return [
            { id: 'lay_down', type: 'me', action: 'Уложить человека на пол' },
            { id: 'horizontal', type: 'do', action: 'Человек в горизонтальном положении' },
            { id: 'call_ambulance', type: 'me', action: 'Вызов скорой' },
            { id: 'take_kit', type: 'me', action: 'Доставание аптечки' },
            { id: 'kit_open', type: 'do', action: 'Аптечка открыта' },
            { id: 'cut_clothes', type: 'me', action: 'Разрезание одежды около перелома' },
            { id: 'clothes_removed', type: 'do', action: 'Одежда отсутствует' },
            { id: 'take_splint', type: 'me', action: 'Наложение медицинской шины' },
            { id: 'fix_splint', type: 'me', action: 'Фиксация шины бинтами' },
            { id: 'splint_fixed', type: 'do', action: 'Шина зафиксирована' }
        ];
    }

    function getKapillyarnoeSteps() {
        return [
            { id: 'ask_bleeding', type: 'do', action: 'Есть ли кровотечение?' },
            { id: 'ask_bleeding_type', type: 'do', action: 'Какое кровотечение и где?' },
            { id: 'call_ambulance', type: 'me', action: 'Вызов скорой' },
            { id: 'take_kit', type: 'me', action: 'Доставание аптечки' },
            { id: 'kit_open', type: 'do', action: 'Аптечка открыта' },
            { id: 'take_antiseptic', type: 'me', action: 'Доставание антисептической повязки' },
            { id: 'antiseptic_ready', type: 'do', action: 'Антисептическая повязка в руках' },
            { id: 'apply_antiseptic', type: 'me', action: 'Наложение антисептической повязки' }
        ];
    }

    function getVenoznoeSteps() {
        return [
            { id: 'ask_bleeding', type: 'do', action: 'Есть ли кровотечение?' },
            { id: 'ask_bleeding_type', type: 'do', action: 'Какое кровотечение и где?' },
            { id: 'call_ambulance', type: 'me', action: 'Вызов скорой' },
            { id: 'take_kit', type: 'me', action: 'Доставание аптечки' },
            { id: 'kit_open', type: 'do', action: 'Аптечка открыта' },
            { id: 'take_gauze', type: 'me', action: 'Доставание марли' },
            { id: 'apply_gauze', type: 'me', action: 'Наложение марли на рану' },
            { id: 'take_bandage', type: 'me', action: 'Доставание бинта и ваты' },
            { id: 'apply_bandage', type: 'me', action: 'Наложение давящей повязки' },
            { id: 'bandage_done', type: 'do', action: 'Давящая повязка наложена' }
        ];
    }

    function getArterialnoeSteps() {
        return [
            { id: 'ask_bleeding', type: 'do', action: 'Есть ли кровотечение?' },
            { id: 'ask_bleeding_type', type: 'do', action: 'Какого вида кровотечение и где?' },
            { id: 'call_ambulance', type: 'me', action: 'Вызов скорой' },
            { id: 'take_kit', type: 'me', action: 'Доставание аптечки' },
            { id: 'kit_open', type: 'do', action: 'Аптечка открыта' },
            { id: 'press_artery', type: 'me', action: 'Пережатие артерии кулаком' },
            { id: 'take_tourniquet', type: 'me', action: 'Доставание жгута и бинтов' },
            { id: 'apply_tourniquet', type: 'me', action: 'Наложение жгута выше ранения' },
            { id: 'write_time', type: 'me', action: 'Запись времени наложения жгута' }
        ];
    }

    // =========================================================
    // ПЕРЕГОВОРЫ — ШАГИ
    // =========================================================

    function getPeregovorySteps(mode) {
        const moods = {
            hard: {
                name: 'Тяжело',
                terroristPhrases: [
                    'Я не шучу! Выполните мои требования!',
                    'Времени мало! Я жду!',
                    'Ещё одна ошибка — и я стреляю!',
                    'Вы думаете я блефую?',
                    'Я устал ждать!',
                    'Вы что, издеваетесь надо мной?',
                    'Я сказал — быстро!',
                    'Моё терпение на исходе!'
                ],
                demands: [
                    'Освободите всех заключённых из тюрьмы!',
                    'Дайте мне вертолёт и 10 миллионов долларов!',
                    'Уберите снайперов с крыш!',
                    'Приготовьте машину с полным баком!',
                    'Я хочу видеть своего адвоката!'
                ]
            },
            medium: {
                name: 'Средне',
                terroristPhrases: [
                    'Я слушаю тебя.',
                    'Давай договоримся.',
                    'Я готов к диалогу.',
                    'Но без глупостей.',
                    'Мы можем найти компромисс.',
                    'Я внимательно слушаю.',
                    'Продолжай.',
                    'Интересное предложение.'
                ],
                demands: [
                    'Мы хотим выкуп в размере 1 миллиона долларов.',
                    'Обеспечьте нам безопасный выход.',
                    'Выключите камеры наблюдения.',
                    'Дайте нам еду и воду.',
                    'Мы хотим поговорить с журналистами.'
                ]
            },
            easy: {
                name: 'Легко',
                terroristPhrases: [
                    'Мы хотим поговорить.',
                    'Нам нужны гарантии.',
                    'Давайте решим всё мирно.',
                    'Мы отпустим заложников, если вы выполните наши условия.',
                    'Я верю, что мы договоримся.',
                    'Мы не хотим крови.',
                    'Сделайте так, и мы уйдём.',
                    'Мы готовы к диалогу.'
                ],
                demands: [
                    'Нам нужна еда и вода для заложников.',
                    'Мы хотим выйти на связь с семьёй.',
                    'Мы согласны на переговоры.',
                    'Обеспечьте нам коридор для выхода.',
                    'Мы хотим, чтобы нас не преследовали.'
                ]
            }
        };

        const data = moods[mode] || moods.medium;
        const steps = [];

        steps.push({ id: 'terrorist_intro', type: 'terrorist', action: data.terroristPhrases[0] });
        steps.push({ id: 'introduce', type: 'chat', action: 'Представься и скажи, что ты на переговоры (просто текст)' });
        steps.push({ id: 'terrorist_response_1', type: 'terrorist', action: data.terroristPhrases[1] || 'Продолжай.' });
        steps.push({ id: 'terrorist_demand_1', type: 'terrorist', action: data.demands[0] });
        steps.push({ id: 'respond_demand_1', type: 'chat', action: 'Ответь на требование террориста (просто текст)' });
        steps.push({ id: 'terrorist_reaction_1', type: 'terrorist', action: data.terroristPhrases[2] || 'Хорошо...' });
        steps.push({ id: 'terrorist_demand_2', type: 'terrorist', action: data.demands[1] || data.demands[0] });
        steps.push({ id: 'respond_demand_2', type: 'chat', action: 'Ответь на второе требование (просто текст)' });
        steps.push({ id: 'terrorist_reaction_2', type: 'terrorist', action: data.terroristPhrases[3] || 'Понял.' });
        steps.push({ id: 'terrorist_demand_3', type: 'terrorist', action: data.demands[2] || data.demands[1] || data.demands[0] });
        steps.push({ id: 'respond_demand_3', type: 'chat', action: 'Ответь на третье требование (просто текст)' });
        steps.push({ id: 'terrorist_final', type: 'terrorist', action: data.terroristPhrases[4] || 'Договорились.' });
        steps.push({ id: 'hands_up', type: 'me', action: 'Поднять руки при приближении (/me поднял руки)' });
        steps.push({ id: 'negotiate', type: 'chat', action: 'Подведи итог переговоров (просто текст)' });

        return steps;
    }

    // =========================================================
    // СЕМАНТИЧЕСКАЯ БАЗА
    // =========================================================

    const contextMap = {
        // СВУ
        'prepare': { patterns: ['набор','сапёр','снаряжение','экипировка','инструменты','приготовил','подготовил'], verbs: ['берёт','достаёт','готовит','взял','достал'] },
        'wear_zkc': { patterns: ['зкс','защитный','костюм','бронежилет','сапёра','защита'], verbs: ['одевает','надевает','одел','надел','накинул'] },
        'drp_on': { patterns: ['дрп','включает','лампочка','индикатор','прибор','включил'], verbs: ['включает','включил','запускает','активировал'] },
        'drp_off': { patterns: ['дрп','выключает','убирает','отключает','выключил'], verbs: ['выключает','выключил','убирает','убрал'] },
        'drp_check': { patterns: ['лампочка','красная','жёлтая','желтая','зелёная','зеленая','цвет','проверка'], verbs: ['проверяет','смотрит','глядит','проверил'] },
        'pelena_setup': { patterns: ['пелену','пелена','пелену-12','устанавливает','ставит','глушитель'], verbs: ['устанавливает','ставит','достаёт','установил','поставил'] },
        'screwdriver': { patterns: ['отвёртку','отвертку','индикаторную','отвертка'], verbs: ['достаёт','берёт','достал','взял'] },
        'inspect': { patterns: ['сву','осматривает','смотрит','осмотр'], verbs: ['осматривает','смотрит','глядит'] },
        'inspect_cover': { patterns: ['крышка','крышку','болты','сколько'], verbs: ['смотрит','проверяет','осматривает'] },
        'inspect_cover_back': { patterns: ['крышка','задняя','обратная','сторона','сзади','находится'], verbs: ['осматривает','смотрит','проверяет'] },
        'inspect_wires': { patterns: ['провода','провод','жилы','количество','сколько'], verbs: ['смотрит','проверяет','осматривает'] },
        'unscrew': { patterns: ['болты','откручивает','отвинчивает','крутит','винты'], verbs: ['откручивает','открутил','выкрутил'] },
        'lift_cover': { patterns: ['крышку','крышка','приподнимает','поднимает','снимает'], verbs: ['приподнимает','поднимает','снимает','приподнял'] },
        'cut_line': { patterns: ['леску','леска','нож','перерезает','режет','отрезает'], verbs: ['перерезает','режет','отрезает','перерезал'] },
        'look_inside': { patterns: ['внутрь','заглядывает','смотрит внутрь','внутренности'], verbs: ['заглядывает','смотрит','осматривает'] },
        'check_wires': { patterns: ['провода','все провода','проверяет','прозванивает','мультиметр'], verbs: ['проверяет','прозванивает','проверил'] },
        'check_wire_1': { patterns: ['первый','1 провод','проверяет первый'], verbs: ['проверяет','проверил','ставит'] },
        'check_wire_2': { patterns: ['второй','2 провод','проверяет второй'], verbs: ['проверяет','проверил','переставляет'] },
        'check_wire_3': { patterns: ['третий','3 провод','проверяет третий'], verbs: ['проверяет','проверил','переставляет'] },
        'check_wire_1_voltage': { patterns: ['напряжение','первый','показал','24.3','вольт'], verbs: ['проверяет','смотрит','видит'] },
        'check_wire_2_voltage': { patterns: ['напряжение','второй','показал','0'], verbs: ['проверяет','смотрит','видит'] },
        'check_wire_3_voltage': { patterns: ['напряжение','третий','показал','-24.3','минус'], verbs: ['проверяет','смотрит','видит'] },
        'multimeter_take': { patterns: ['мультиметр','200','ватт','тестер','прибор'], verbs: ['достаёт','берёт','достал','взял'] },
        'multimeter_off': { patterns: ['мультиметр','выключает','отключает','убирает','щуп'], verbs: ['выключает','выключил','убирает','убрал'] },
        'cut_wires': { patterns: ['перекусывает','бокорезы','провода','1-3-2','порядок'], verbs: ['перекусывает','кусает','перекусил'] },
        'titan_case': { patterns: ['кейс','титановый','бронированный','бронежилет','контейнер'], verbs: ['снимает','достаёт','берёт','открывает'] },
        'remove_charge': { patterns: ['тротиловую','шашку','взрыватель','капсюль','заряд'], verbs: ['вынимает','достаёт','отделяет','вынул'] },
        'pack_case': { patterns: ['укладывает','закрывает','кейс','упаковывает'], verbs: ['укладывает','закрывает','упаковывает','уложил','закрыл'] },
        'cleanup': { patterns: ['пелену','убирает','завершает','выключает','оборудование'], verbs: ['выключает','убирает','завершает','выключил','убрал'] },

        // /do вопросы
        'ask_drp': { patterns: ['какая лампочка','цвет лампочки','лампочка на приборе','дрп показывает','что показывает','какой цвет'], verbs: ['спрашивает','спросил','спрашиваю','интересуюсь'] },
        'ask_bolts': { patterns: ['сколько болтов','болты на крышке','количество болтов','сколько винтов'], verbs: ['спрашивает','спросил','спрашиваю','интересуюсь'] },
        'ask_cover': { patterns: ['на крышке','задняя сторона','под крышкой','что-то на крышке','находится','есть на крышке'], verbs: ['спрашивает','спросил','спрашиваю','интересуюсь'] },
        'ask_line': { patterns: ['леска ведет','к взрывателю','леска к детонатору','ведёт ли леска'], verbs: ['спрашивает','спросил','спрашиваю','интересуюсь'] },
        'ask_wires': { patterns: ['сколько проводов','провода в сву','количество проводов','сколько жил'], verbs: ['спрашивает','спросил','спрашиваю','интересуюсь'] },
        'ask_wire_1': { patterns: ['напряжение первого','первый провод напряжение','сколько вольт на первом'], verbs: ['спрашивает','спросил','спрашиваю','интересуюсь'] },
        'ask_wire_2': { patterns: ['напряжение второго','второй провод напряжение','сколько вольт на втором'], verbs: ['спрашивает','спросил','спрашиваю','интересуюсь'] },
        'ask_wire_3': { patterns: ['напряжение третьего','третий провод напряжение','сколько вольт на третьем'], verbs: ['спрашивает','спросил','спрашиваю','интересуюсь'] },

        // Растяжка
        'grab': { patterns: ['гранаты','граната','корпус','кольцо','обхватывает'], verbs: ['обхватывает','берёт','сжимает','обхватил'] },
        'bend_pin': { patterns: ['усики','шплинта','чеку','сжимает','наклоняет'], verbs: ['разводит','сжимает','наклоняет','развел','отогнул'] },
        'check_fell': { patterns: ['чека упала','чека выпала','упала чека'], verbs: ['констатирует','видит','замечает'] },
        'cut_wire': { patterns: ['бокорезы','проволоку','перекусывает','кусает','проволока'], verbs: ['перекусывает','кусает','режет','перекусил'] },
        'insert_check': { patterns: ['чеку','запал','вставляет','поднимает','чек'], verbs: ['поднимает','вставляет','вешает','поднял','вставил'] },

        // ПДП
        'call_ambulance': { patterns: ['скорую','вызывает','звонит','помощь','телефон','103'], verbs: ['вызывает','звонит','набирает','вызвал','позвонил'] },
        'tilt_head': { patterns: ['голову','запрокидывает','поворачивает','назад','без сознания'], verbs: ['запрокидывает','поворачивает','запрокинул','откинул'] },
        'take_kit': { patterns: ['аптечку','аптечка','открыв','разгрузки','медпакет'], verbs: ['снимает','достаёт','открывает','снял','открыл'] },
        'kit_open': { patterns: ['аптечка открыта','открыта на полу'], verbs: ['констатирует','видит'] },
        'ask_bleeding': { patterns: ['кровотечение','идёт кровь','есть кровь'], verbs: ['спрашивает','интересуется'] },
        'ask_bleeding_type': { patterns: ['какое кровотечение','где кровотечение','тип кровотечения'], verbs: ['спрашивает','интересуется'] },
        'ask_contraindications': { patterns: ['противопоказания','обезболивающие','аллергия'], verbs: ['спрашивает','интересуется'] },
        'take_syringe': { patterns: ['шприц','обезболивающее','обезбол','анальгетик'], verbs: ['достаёт','берёт','достал','взял'] },
        'inject': { patterns: ['вкалывает','укол','обезболивающее','инъекция','ввел'], verbs: ['вкалывает','делает','вколол','ввёл'] },
        'treat_edges': { patterns: ['зеленку','зеленка','края','обрабатывает','антисептик'], verbs: ['обрабатывает','достает','обработал','помазал'] },
        'apply_bandage': { patterns: ['повязку','повязка','давящую','накладывает','тампонад','бинт'], verbs: ['накладывает','достает','наложил','забинтовал'] },
        'tamponade_done': { patterns: ['тампонад наложен','наложен тампонад'], verbs: ['констатирует'] },
        'tear_clothes': { patterns: ['одежду','разрывает','рвет','раны','ткань'], verbs: ['разрывает','рвет','разорвал','порвал'] },
        'lay_down': { patterns: ['ложит','кладет','укладывает','на пол','горизонтально'], verbs: ['ложит','кладет','укладывает'] },
        'horizontal': { patterns: ['горизонтальное','лежит','на полу'], verbs: ['констатирует'] },
        'take_splint': { patterns: ['шину','медицинскую','накладывает','шина'], verbs: ['накладывает','достает','ставит'] },
        'fix_splint': { patterns: ['фиксирует','бинты','закрепляет','туго'], verbs: ['фиксирует','закрепляет','бинтует'] },
        'splint_fixed': { patterns: ['шина зафиксирована','зафиксирована'], verbs: ['констатирует'] },
        'cut_clothes': { patterns: ['нож','разрезает','одежду','перелома'], verbs: ['разрезает','режет','отрезает'] },
        'clothes_removed': { patterns: ['одежда отсутствует','снял одежду'], verbs: ['констатирует'] },
        'take_antiseptic': { patterns: ['антисептическую','повязку','антисептик'], verbs: ['достаёт','берёт'] },
        'antiseptic_ready': { patterns: ['антисептическая повязка в руках','повязка в руках'], verbs: ['констатирует'] },
        'apply_antiseptic': { patterns: ['обматывает','поврежденный','участок','антисептическую'], verbs: ['обматывает','накладывает'] },
        'take_gauze': { patterns: ['марлю','марля','перевязочный'], verbs: ['достаёт','берёт','протягивает'] },
        'apply_gauze': { patterns: ['марлю на рану','накладывает марлю'], verbs: ['накладывает','кладет'] },
        'take_bandage': { patterns: ['бинт','вату','бинты','перевязка'], verbs: ['достаёт','берёт'] },
        'bandage_done': { patterns: ['давящая повязка наложена','повязка наложена'], verbs: ['констатирует'] },
        'press_artery': { patterns: ['пережимает','артерию','кулаком','зажимает'], verbs: ['пережимает','зажимает','давит'] },
        'take_tourniquet': { patterns: ['жгут','бинты','турникет','жгута'], verbs: ['достаёт','берёт'] },
        'apply_tourniquet': { patterns: ['жгут накладывает','выше ранения','туры','туго'], verbs: ['накладывает','затягивает'] },
        'write_time': { patterns: ['время','записывает','бумажку','ручку','время наложения'], verbs: ['записывает','пишет','отмечает'] },

        // Переговоры — только /me поднял руки
        'hands_up': { patterns: ['руки','поднял','поднимаю','аним','/anim 12'], verbs: ['поднял','поднимает'] }
    };

    // =========================================================
    // ЯДРО
    // =========================================================

    function getScenario() {
        return scenarios[currentScenario];
    }

    function getAllSteps() {
        const scenario = getScenario();
        if (currentScenario === 'first-aid') {
            return scenario.getStepsForInjury(currentInjury) || [];
        }
        if (currentScenario === 'peregovory') {
            return scenario.getStepsForMode(mode) || [];
        }
        return scenario.steps || [];
    }

    function getCurrentStepData() {
        const steps = getAllSteps();
        if (currentStep < steps.length) {
            return steps[currentStep];
        }
        return null;
    }

    function getCommandType(input) {
        const trimmed = input.trim();
        if (trimmed.startsWith('/me')) return 'me';
        if (trimmed.startsWith('/do')) return 'do';
        if (trimmed.startsWith('/try')) return 'try';
        return 'chat';
    }

    function getStepType(stepId) {
        const steps = getAllSteps();
        for (const step of steps) {
            if (step.id === stepId) return step.type;
        }
        return 'me';
    }

    function generateDoResponse(stepId) {
        const steps = getAllSteps();
        for (const step of steps) {
            if (step.id === stepId && step.doResponse) {
                return `🎲 ИИ-отыгровщик: /do ${step.doResponse}`;
            }
        }
        const responses = ['Подтверждаю.', 'Принято.', 'Да.', 'Нет.', 'Информация получена.', 'Всё верно.', 'Ожидаю.'];
        return `🎲 ИИ-отыгровщик: /do ${responses[Math.floor(Math.random() * responses.length)]}`;
    }

    function getTryResult(stepId) {
        const steps = getAllSteps();
        const step = steps.find(s => s.id === stepId);
        if (step && step.results) {
            if (!tryIndex[stepId]) tryIndex[stepId] = 0;
            const result = step.results[tryIndex[stepId] % step.results.length];
            tryIndex[stepId]++;
            return result;
        }
        return Math.random() > 0.5 ? 'удачно' : 'неудачно';
    }

    function understandCommand(input, stepId, commandType) {
        const lower = input.toLowerCase();

        // === /me поднял руки ===
        if (stepId === 'hands_up') {
            if (commandType === 'me') {
                if (lower.includes('руки') || lower.includes('поднял') || lower.includes('поднимаю')) {
                    return { match: true };
                }
                return { match: false, reason: 'Нужно поднять руки.', hint: 'Напиши /me поднял руки' };
            }
            return { match: false, reason: 'Ожидается /me', hint: 'Напиши /me поднял руки' };
        }

        // === Террорист (пропускаем) ===
        if (stepId.startsWith('terrorist_')) {
            return { match: true, isTerrorist: true };
        }

        // === ОСТАЛЬНЫЕ КОМАНДЫ (СВУ, ПДП, Растяжка) ===
        if (commandType !== getStepType(stepId)) {
            return { match: false, reason: `Ожидается ${getStepType(stepId)}, а не ${commandType}` };
        }

        const stepSemantic = contextMap[stepId];
        if (!stepSemantic) {
            return { match: false, reason: 'Не могу определить действие.' };
        }

        let patternMatch = 0;
        for (const pattern of stepSemantic.patterns) {
            if (lower.includes(pattern.toLowerCase())) patternMatch++;
        }

        let verbMatch = 0;
        for (const verb of stepSemantic.verbs) {
            if (lower.includes(verb.toLowerCase())) verbMatch++;
        }

        // Для /do вопросов
        if (stepId.startsWith('ask_')) {
            const hasQuestion = lower.includes('?') || lower.includes('как') || lower.includes('что') || lower.includes('сколько') || lower.includes('ли');
            if ((hasQuestion && (patternMatch > 0 || verbMatch > 0)) || patternMatch >= 1 || verbMatch >= 1) {
                return { match: true };
            }
        }

        const totalScore = patternMatch * 2 + verbMatch * 3;
        const maxScore = stepSemantic.patterns.length * 2 + stepSemantic.verbs.length * 3;
        if (maxScore === 0) return { match: false, reason: 'Нет эталонов для сравнения.' };

        const matchPercentage = totalScore / maxScore;
        const threshold = 0.05;

        if (patternMatch >= 1 && verbMatch >= 1) return { match: true };
        if (matchPercentage >= threshold) return { match: true };

        let hint = '';
        if (stepSemantic.patterns.length > 0) {
            hint = `Попробуй: "${stepSemantic.patterns[0]}"`;
            if (stepSemantic.verbs.length > 0) {
                hint += ` или "${stepSemantic.verbs[0]} ${stepSemantic.patterns[0]}"`;
            }
        }

        return { match: false, reason: 'Я не понял это действие.', hint: hint };
    }

    // =========================================================
    // ТАЙМЕР
    // =========================================================

    function startTimer() {
        seconds = 0;
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            seconds++;
            const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
            const secs = String(seconds % 60).padStart(2, '0');
            timeCounter.textContent = `${mins}:${secs}`;

            if (currentScenario === 'first-aid' && seconds % 30 === 0 && seconds > 0) {
                worsenVictimState();
            }

            if (currentScenario === 'peregovory' && mode === 'hard' && seconds % 45 === 0 && seconds > 0) {
                if (Math.random() < 0.3) {
                    addMessage('💥 Террорист теряет терпение!', 'terrorist');
                    addMessage('🔫 "Я устал ждать! Ещё 10 секунд — и я стреляю!"', 'terrorist');
                }
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function worsenVictimState() {
        const states = ['⚠️ Состояние ухудшается!', '⚠️ Потеря сознания!', '⚠️ Критическое состояние!'];
        const bleeding = ['Кровотечение усиливается!', 'Потеря крови критическая!', 'Требуется срочная помощь!'];
        
        victimStatus.textContent = states[Math.floor(Math.random() * states.length)];
        victimStatus.style.color = '#ef4444';
        victimBleeding.textContent = bleeding[Math.floor(Math.random() * bleeding.length)];
        
        addMessage(`🏥 ${victimStatus.textContent}`, 'warning');
        addMessage(`🩸 ${victimBleeding.textContent}`, 'warning');
        
        if (seconds > 60 && Math.random() < 0.2) {
            addMessage('💀 Пострадавший скончался! Ты не успел!', 'fail');
            isComplete = true;
            sendBtn.disabled = true;
            stopTimer();
        }
    }

    // =========================================================
    // ОБРАБОТКА КОМАНД
    // =========================================================

    function processCommand(input) {
        const trimmed = input.trim();
        if (!trimmed) return;

        addMessage(trimmed, 'user');

        if (isComplete) {
            addMessage('Отыгровка завершена. Нажми "Сбросить".', 'system');
            return;
        }

        const step = getCurrentStepData();
        if (!step) {
            addMessage('⚠️ Ты уже завершил отыгровку!', 'system');
            return;
        }

        // =========================================================
        // ПЕРЕГОВОРЫ — ТЕРРОРИСТ (выводим его фразу)
        // =========================================================
        if (step.type === 'terrorist') {
            addMessage(`🔫 Террорист: "${step.action}"`, 'terrorist');
            currentStep++;
            updateStatus();
            updateHint();
            return;
        }

        // =========================================================
        // ПЕРЕГОВОРЫ — ЧАТ (диалог с террористом)
        // =========================================================
        if (step.type === 'chat') {
            // Проверяем, что это не команда
            if (trimmed.startsWith('/me') || trimmed.startsWith('/do') || trimmed.startsWith('/try')) {
                addMessage('❌ В переговорах отвечай просто текстом, без команд.', 'system');
                return;
            }

            // Анализируем ответ
            const analysis = analyzeResponse(trimmed);
            const totalWords = trimmed.split(' ').length;

            // Если есть плохие слова — провал или предупреждение
            if (analysis.badScore > 0) {
                if (analysis.badScore >= 2 || analysis.badScore > analysis.goodScore) {
                    addMessage('💥 Террорист воспринял твой ответ как оскорбление!', 'fail');
                    addMessage('🔫 "Ты что, издеваешься?! Переговоры окончены!"', 'terrorist');
                    addMessage('❌ Ты провалил переговоры!', 'system');
                    isComplete = true;
                    sendBtn.disabled = true;
                    stopTimer();
                    return;
                } else {
                    addMessage('⚠️ Террорист недоволен твоим тоном. Будь осторожнее.', 'warning');
                    addMessage(`🔫 "Я слышал оскорбление. Ещё раз — и я стреляю!"`, 'terrorist');
                    return;
                }
            }

            // Если есть хорошие слова — засчитываем
            if (analysis.goodScore > 0) {
                addMessage(`✅ Шаг ${currentStep + 1} выполнен!`, 'success');
                currentStep++;
                updateStatus();
                updateHint();

                // В жёстком режиме — случайный стресс-тест
                if (mode === 'hard' && Math.random() < 0.2) {
                    addMessage('🔫 Террорист: "Но я ещё не доверяю тебе..."', 'terrorist');
                    addMessage('💡 Продолжай переговоры.', 'ai');
                }

                const nextStep = getCurrentStepData();
                if (!nextStep) {
                    completeScenario();
                }
                return;
            }

            // Если ответ слишком короткий и нет хороших слов
            if (totalWords < 3) {
                addMessage('❌ Ответ слишком короткий. Террорист не воспринимает тебя всерьёз.', 'system');
                addMessage('💡 Попробуй сказать что-то вроде: "Я согласен на ваши условия"', 'ai');
                return;
            }

            // Если нет ни хороших, ни плохих слов, но ответ длинный
            if (totalWords >= 3 && analysis.goodScore === 0 && analysis.badScore === 0) {
                addMessage('⚠️ Террорист не понимает, чего ты хочешь.', 'warning');
                addMessage('🔫 "Говори яснее! Что ты предлагаешь?"', 'terrorist');
                addMessage('💡 Попробуй чётко сказать, согласен ты или нет.', 'ai');
                return;
            }

            // Запасной вариант — если что-то пошло не так
            addMessage('⚠️ Террорист ждёт ответа. Скажи что-то конкретное.', 'system');
            addMessage('💡 Например: "Я согласен" или "Давайте договоримся"', 'ai');
            return;
        }

        // =========================================================
        // ОСТАЛЬНЫЕ КОМАНДЫ (/me, /do, /try)
        // =========================================================
        const cmdType = getCommandType(trimmed);
        if (cmdType === 'chat') {
            addMessage('⚠️ Здесь нужна команда /me, /do или /try', 'system');
            return;
        }

        // Для /try
        if (cmdType === 'try') {
            const result = getTryResult(step.id);
            addMessage(`🎲 Результат /try: ${result}`, 'do-ai');
            if (result === 'неудачно') {
                addMessage('⚠️ /try неудачно! Попробуй ещё раз.', 'system');
                return;
            }
        }

        const result = understandCommand(trimmed, step.id, cmdType);

        if (result.match) {
            if (step.type === 'do' && step.isQuestion) {
                addMessage(generateDoResponse(step.id), 'do-ai');
            }
            
            addMessage(`✅ Шаг ${currentStep + 1} выполнен!`, 'success');
            currentStep++;
            updateStatus();
            updateHint();

            const nextStep = getCurrentStepData();
            if (!nextStep) {
                completeScenario();
            }
        } else {
            addMessage(`❌ ${result.reason}`, 'system');
            if (result.hint) {
                addMessage(`💡 ${result.hint}`, 'ai');
            }
        }
    }

    // =========================================================
    // UI
    // =========================================================

    function addMessage(text, type) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${type}`;

        if (['ai','system','success','do-ai','warning','fail','terrorist'].includes(type)) {
            const label = document.createElement('div');
            label.className = 'msg-label';
            if (type === 'ai') {
                const name = getScenario().name || currentScenario;
                label.innerHTML = `🧠 ИИ-инструктор <span class="badge">${name}</span>`;
            } else if (type === 'do-ai') {
                label.innerHTML = '🎲 ИИ-отыгровщик <span class="badge">/do</span>';
            } else if (type === 'system') {
                label.innerHTML = '⚠️ Система';
            } else if (type === 'success') {
                label.innerHTML = '✅ Успех!';
            } else if (type === 'warning') {
                label.innerHTML = '⚠️ Внимание';
            } else if (type === 'fail') {
                label.innerHTML = '💥 ПРОВАЛ';
            } else if (type === 'terrorist') {
                label.innerHTML = '🔫 Террорист';
            }
            msgDiv.appendChild(label);
        }

        const textSpan = document.createElement('span');
        textSpan.innerHTML = text;
        msgDiv.appendChild(textSpan);

        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function updateStatus() {
        const steps = getAllSteps();
        currentStepEl.textContent = currentStep;
        totalStepsEl.textContent = steps.length;
        const name = getScenario().name || currentScenario;
        scenarioNameEl.textContent = name;
    }

    function updateHint() {
        const step = getCurrentStepData();
        if (step) {
            if (step.type === 'chat') {
                hintText.textContent = `💬 ${step.action}`;
            } else if (step.type === 'terrorist') {
                hintText.textContent = `💬 Ответь террористу просто текстом`;
            } else {
                const info = contextMap[step.id];
                if (info && info.patterns.length > 0) {
                    hintText.textContent = `🎯 ${step.action}: "${info.patterns[0]}"`;
                } else {
                    hintText.textContent = `🎯 ${step.action}`;
                }
            }
            hintBox.classList.add('show');
        } else {
            hintBox.classList.remove('show');
        }
    }

    function resetPractice() {
        currentStep = 0;
        isComplete = false;
        tryIndex = {};
        responseCount = 0;
        stopTimer();
        seconds = 0;
        timeCounter.textContent = '00:00';
        chatBox.innerHTML = '';

        const scenario = getScenario();

        if (currentScenario === 'first-aid') {
            statusPanel.classList.add('show');
            victimStatus.textContent = 'В сознании';
            victimStatus.style.color = '';
            victimBleeding.textContent = 'Отсутствует';
            const injuryNames = {
                'pulevoe': 'Пулевое ранение',
                'zakrytyi_perelom': 'Закрытый перелом',
                'otkrytyi_perelom': 'Открытый перелом',
                'kapillyarnoe': 'Капиллярное кровотечение',
                'venoznoe': 'Венозное кровотечение',
                'arterialnoe': 'Артериальное кровотечение'
            };
            addMessage(`🏥 Травма: ${injuryNames[currentInjury] || currentInjury}`, 'ai');
            addMessage(`📝 Состояние: ${victimStatus.textContent}`, 'ai');
            addMessage(`🩸 Кровотечение: ${victimBleeding.textContent}`, 'ai');
            addMessage('⏱️ Время пошло! Действуй быстро!', 'warning');
            startTimer();
        } else if (currentScenario === 'peregovory') {
            statusPanel.classList.add('show');
            const modeNames = { hard: 'Тяжело', medium: 'Средне', easy: 'Легко' };
            victimStatus.textContent = `Режим: ${modeNames[mode] || 'Средне'}`;
            victimBleeding.textContent = 'ИИ-террорист';
            addMessage(`🤝 Переговоры. Режим: ${modeNames[mode] || 'Средне'}`, 'ai');
            addMessage('💬 Отвечай террористу просто текстом, без команд /me /do /try', 'ai');
            addMessage('📌 Только одна /me — когда будешь поднимать руки.', 'ai');
            addMessage('⚠️ Оскорбления и провокации приведут к провалу переговоров!', 'warning');
            startTimer();
        } else {
            statusPanel.classList.remove('show');
        }

        addMessage(`🧠 Добро пожаловать в тренажёр "${scenario.name}"!`, 'ai');
        addMessage(`📝 ${scenario.description}`, 'ai');
        if (scenario.context) {
            addMessage(`🎯 ${scenario.context}`, 'ai');
        }
        if (currentScenario === 'rastyazhka') {
            addMessage('⚠️ Растяжка: только /me и /do! /try НЕ ИСПОЛЬЗУЙ!', 'warning');
        }
        
        updateStatus();
        updateHint();
        commandInput.value = '';
        commandInput.focus();
        sendBtn.disabled = false;
    }

    function completeScenario() {
        isComplete = true;
        stopTimer();
        addMessage('🎉 ОТЛИЧНО! Ты успешно завершил отыгровку!', 'success');
        addMessage(`⏱️ Время: ${timeCounter.textContent}`, 'ai');
        addMessage('🧠 Ты показал отличное понимание процедуры!', 'ai');
        sendBtn.disabled = true;
        hintBox.classList.remove('show');
    }

    // =========================================================
    // ОБРАБОТЧИКИ
    // =========================================================

    function handleSend() {
        const input = commandInput.value;
        if (!input.trim()) return;
        processCommand(input);
        commandInput.value = '';
        commandInput.focus();
    }

    sendBtn.addEventListener('click', handleSend);
    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSend();
        }
    });

    // Выбор сценария
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentScenario = btn.dataset.scenario;
            
            const injurySelector = document.getElementById('injurySelector');
            if (currentScenario === 'first-aid') {
                injurySelector.classList.add('show');
            } else {
                injurySelector.classList.remove('show');
            }
            
            const modeSelector = document.getElementById('modeSelector');
            if (currentScenario === 'peregovory') {
                modeSelector.classList.add('show');
            } else {
                modeSelector.classList.remove('show');
            }
            
            resetPractice();
        });
    });

    // Выбор травмы для ПДП
    document.querySelectorAll('.injury-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.injury-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentInjury = btn.dataset.injury;
            if (currentScenario === 'first-aid') {
                resetPractice();
            }
        });
    });

    // Выбор режима для переговоров
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.dataset.mode;
            if (currentScenario === 'peregovory') {
                resetPractice();
            }
        });
    });

    resetBtn.addEventListener('click', resetPractice);

    hintBtn.addEventListener('click', () => {
        const step = getCurrentStepData();
        if (step) {
            if (step.type === 'chat') {
                addMessage(`💬 ${step.action}`, 'ai');
                addMessage(`💡 Пример: "Я согласен на ваши условия"`, 'ai');
            } else if (step.type === 'terrorist') {
                addMessage(`💬 Ответь террористу просто текстом`, 'ai');
                addMessage(`💡 Например: "Хорошо, я готов выслушать"`, 'ai');
            } else {
                const info = contextMap[step.id];
                if (info) {
                    addMessage(`💡 Сейчас нужно: ${step.action}`, 'ai');
                    addMessage(`📌 Пример: "${info.patterns[0]}"`, 'ai');
                }
            }
        } else {
            addMessage('🎯 Ты уже завершил отыгровку!', 'system');
        }
    });

    // =========================================================
    // СТАРТ
    // =========================================================
    resetPractice();
});