// ═══════════════════════════════════════════════════════════════════════════
// 📋 КОНФИГУРАЦИЯ ПАТТЕРНОВ ЦЕНЫ НОМЕРОВ
// ═══════════════════════════════════════════════════════════════════════════
//
// Как добавить новый паттерн:
//   1. Скопируйте любой объект из массива PATTERNS
//   2. Измените: name, regex/check, multiplier, category, description
//   3. Порядок в массиве = приоритет (чем раньше, тем выше приоритет)
//
// Типы проверок:
//   - regex: строка с регулярным выражением (проверяется через new RegExp)
//   - fn: функция (num) => boolean для сложной логики
//   - endsWith: строка — проверка окончания номера
//   - exact: строка — точное совпадение всего номера
//
// Категории (определяют цвет/редкость в UI):
//   "diamond"  → Бриллиантовый (бирюзовый, самый редкий)
//   "gold"     → Золотой (золотой)
//   "silver"   → Серебряный (серебристый)
//   "bronze"   → Бронзовый (бронзовый)
//   "fancy"    → Красивое окончание (обычный цвет)
//   "common"   → Обычный (базовый)
//   "lucky"    → Удачный (розовый, бонус уровня)
//
// Множитель: на сколько умножается базовая цена генератора
//   Базовые цены: Рынок=150₽, Магазин=1250₽, Ювелирный=10000₽
//
// Флаги:
//   exclusive: true      — если сработал этот паттерн, остальные НЕ проверяются
//   exclusiveGroup: str  — только один паттерн из группы сработает (по приоритету)
//   stackable: true      — множитель суммируется с другими (умножается)
//
// ═══════════════════════════════════════════════════════════════════════════

export const PATTERNS = [
    // ─────────────────────────────────────────────────────────────────────
    // 💎 LEGENDARY — уникальные номера (срабатывают первыми, exclusive)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: "all_same_10",
        name: "Все 10 цифр одинаковые",
        check: { exact: "REPEAT_10" },
        multiplier: 100000,
        category: "diamond",
        description: "Идеальный номер (1111111111, 9999999999...)",
        exclusive: true,
        priority: 100
    },

    // ─────────────────────────────────────────────────────────────────────
    // 🔥 EPIC — длинные серии одинаковых цифр (только самая длинная)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: "repeat_9",
        name: "9 одинаковых цифр подряд",
        check: { regex: "(\\d)\\1{8}" },
        multiplier: 50000,
        category: "diamond",
        description: "9 повторяющихся цифр подряд",
        exclusive: true,
        priority: 90
    },
    {
        id: "repeat_8",
        name: "8 одинаковых цифр подряд",
        check: { regex: "(\\d)\\1{7}" },
        multiplier: 10000,
        category: "gold",
        description: "8 повторяющихся цифр подряд",
        exclusiveGroup: "repeat_series",
        priority: 80
    },
    {
        id: "repeat_7",
        name: "7 одинаковых цифр подряд",
        check: { regex: "(\\d)\\1{6}" },
        multiplier: 2000,
        category: "gold",
        description: "7 повторяющихся цифр подряд",
        exclusiveGroup: "repeat_series",
        priority: 70
    },
    {
        id: "repeat_6",
        name: "6 одинаковых цифр подряд",
        check: { regex: "(\\d)\\1{5}" },
        multiplier: 300,
        category: "silver",
        description: "6 повторяющихся цифр подряд",
        exclusiveGroup: "repeat_series",
        priority: 60
    },
    {
        id: "repeat_5",
        name: "5 одинаковых цифр подряд",
        check: { regex: "(\\d)\\1{4}" },
        multiplier: 60,
        category: "silver",
        description: "5 повторяющихся цифр подряд",
        exclusiveGroup: "repeat_series",
        priority: 50
    },
    {
        id: "repeat_4",
        name: "4 одинаковых цифр подряд",
        check: { regex: "(\\d)\\1{3}" },
        multiplier: 15,
        category: "bronze",
        description: "4 повторяющихся цифры подряд",
        exclusiveGroup: "repeat_series",
        priority: 40
    },
    {
        id: "repeat_3",
        name: "3 одинаковых цифр подряд",
        check: { regex: "(\\d)\\1{2}" },
        multiplier: 3,
        category: "fancy",
        description: "3 повторяющихся цифры подряд",
        exclusiveGroup: "repeat_series",
        priority: 30
    },

    // ─────────────────────────────────────────────────────────────────────
    // ✨ FANCY ENDINGS — красивые окончания (только лучшее совпадение)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: "end_4_same",
        name: "Окончание: 4 одинаковые",
        check: { fn: (num) => /^(\d)\1{3}$/.test(num.slice(-4)) },
        multiplier: 12,
        category: "fancy",
        description: (num) => `Окончание *${num.slice(-4)} (4 одинаковые)`,
        exclusiveGroup: "fancy_ending",
        priority: 25
    },
    {
        id: "end_3_same",
        name: "Окончание: 3 одинаковые",
        check: { fn: (num) => /^(\d)\1{2}$/.test(num.slice(-3)) },
        multiplier: 3,
        category: "fancy",
        description: (num) => `Окончание *${num.slice(-3)} (3 одинаковые)`,
        exclusiveGroup: "fancy_ending",
        priority: 20
    },
    {
        id: "end_0000",
        name: "Окончание: 0000",
        check: { endsWith: "0000" },
        multiplier: 5,
        category: "fancy",
        description: "Круглое окончание 0000",
        exclusiveGroup: "round_ending",
        priority: 18
    },
    {
        id: "end_000",
        name: "Окончание: 000",
        check: { endsWith: "000" },
        multiplier: 2,
        category: "fancy",
        description: "Круглое окончание 000",
        exclusiveGroup: "round_ending",
        priority: 15
    },
    {
        id: "end_00",
        name: "Окончание: 00",
        check: { endsWith: "00" },
        multiplier: 1.4,
        category: "fancy",
        description: "Круглое окончание 00",
        exclusiveGroup: "round_ending",
        priority: 12
    },
    {
        id: "end_pair",
        name: "Окончание: пара (XX)",
        check: { fn: (num) => num.slice(-2)[0] === num.slice(-2)[1] },
        multiplier: 1.5,
        category: "fancy",
        description: (num) => `Пара в конце (${num.slice(-2)})`,
        exclusiveGroup: "fancy_ending",
        priority: 10
    },

    // ─────────────────────────────────────────────────────────────────────
    // 🔮 SPECIAL PATTERNS — особые комбинации (стэкаются)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: "palindrome",
        name: "Зеркальный (палиндром)",
        check: { fn: (num) => num === num.split('').reverse().join('') },
        multiplier: 20,
        category: "silver",
        description: "Зеркальный номер (читается одинаково)",
        priority: 35
    },
    {
        id: "end_seq_4",
        name: "Последовательность 4 цифр в конце",
        check: { fn: (num) => isSequence(num.slice(-4)) },
        multiplier: 8,
        category: "silver",
        description: (num) => `Последовательность в конце (${num.slice(-4)})`,
        priority: 28
    },
    {
        id: "end_seq_3",
        name: "Последовательность 3 цифр в конце",
        check: { fn: (num) => isSequence(num.slice(-3)) },
        multiplier: 3,
        category: "fancy",
        description: (num) => `Мини-последовательность (${num.slice(-3)})`,
        priority: 16
    },
    {
        id: "two_pairs_end",
        name: "Две пары в конце (AABB)",
        check: { fn: (num) => {
            const s = num.slice(-4);
            return s[0] === s[1] && s[2] === s[3] && s[0] !== s[2];
        }},
        multiplier: 4,
        category: "bronze",
        description: (num) => `Две пары в конце (${num.slice(-4)})`,
        priority: 22
    },
    {
        id: "alternating_end",
        name: "Чередование в конце (ABAB)",
        check: { fn: (num) => {
            const s = num.slice(-4);
            return s[0] === s[2] && s[1] === s[3] && s[0] !== s[1];
        }},
        multiplier: 3,
        category: "bronze",
        description: (num) => `Чередование в конце (${num.slice(-4)})`,
        priority: 20
    },

    // ─────────────────────────────────────────────────────────────────────
    // 🎲 LUCKY — бонус за уровень (случайный)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: "lucky_bonus",
        name: "Удачный номер (бонус уровня)",
        check: { fn: (num, ctx) => {
            if (!ctx || !ctx.level) return false;
            const chance = ctx.level * 0.5;
            return Math.random() * 100 < chance;
        }},
        multiplier: (num, ctx) => 1 + Math.random() * 5,
        category: "lucky",
        description: "Счастливый шанс! Уровень помог.",
        priority: 5
    }
];

// ─────────────────────────────────────────────────────────────────────
// 🛠 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ─────────────────────────────────────────────────────────────────────
function isSequence(str) {
    const arr = str.split('').map(Number);
    const diff = arr[1] - arr[0];
    if (diff !== 1 && diff !== -1) return false;
    for (let i = 2; i < arr.length; i++) {
        if (arr[i] - arr[i-1] !== diff) return false;
    }
    return true;
}

export function checkPattern(num, pattern, context) {
    const { check } = pattern;
    if (check.regex) return new RegExp(check.regex).test(num);
    if (check.fn) return check.fn(num, context);
    if (check.endsWith) return num.endsWith(check.endsWith);
    if (check.exact === "REPEAT_10") return /^(\d)\1{9}$/.test(num);
    if (check.exact) return num === check.exact;
    return false;
}

export function getPatternMultiplier(pattern, num, context) {
    if (typeof pattern.multiplier === "function") return pattern.multiplier(num, context);
    return pattern.multiplier;
}

export function getPatternDescription(pattern, num) {
    if (typeof pattern.description === "function") return pattern.description(num);
    return pattern.description;
}

export const BASE_PRICES = {
    1: 150,
    5: 1250,
    20: 10000
};

export const PRICE_CATEGORIES = [
    { min: 1000000000, id: "diamond", name: "БРИЛЛИАНТОВЫЙ" },
    { min: 1000000,    id: "gold",     name: "ЗОЛОТОЙ" },
    { min: 100000,     id: "silver",   name: "СЕРЕБРЯНЫЙ" },
    { min: 10000,      id: "bronze",   name: "БРОНЗОВЫЙ" },
    { min: 1000,       id: "fancy",    name: "КРАСИВОЕ ОКОНЧАНИЕ" },
    { min: 0,          id: "common",   name: "Обычный" }
];

export function getCategoryByPrice(price) {
    for (const cat of PRICE_CATEGORIES) {
        if (price >= cat.min) return cat;
    }
    return PRICE_CATEGORIES[PRICE_CATEGORIES.length - 1];
}

export const CATEGORY_CHANCES = {
    diamond: "< 0.001%",
    gold: "~1%",
    silver: "~5%",
    bronze: "~15%",
    fancy: "~30%",
    common: "~50%",
    lucky: "зависит от уровня"
};