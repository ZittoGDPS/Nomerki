// ═══════════════════════════════════════════════════════════════════════════
// ⚙️ ДВИЖОК РАСЧЁТА ЦЕНЫ — использует patterns-config.js
// ═══════════════════════════════════════════════════════════════════════════

import { PATTERNS, checkPattern, getPatternMultiplier, getPatternDescription, BASE_PRICES, getCategoryByPrice, CATEGORY_CHANCES } from './patterns-config.js';

/**
 * Основная функция расчёта цены номера
 * @param {string} fullNum — 10-значный номер (только цифры, без +7)
 * @param {number} type — тип генератора: 1 (Рынок), 5 (Магазин), 20 (Ювелирный)
 * @param {object} context — доп. контекст { level, operatorMultiplier, boostMultiplier }
 * @returns {object} { price, category, categoryId, chance, reasons, multiplier, basePrice, matchedPatterns }
 */
export function calculatePrice(fullNum, type = 1, context = {}) {
    const basePrice = BASE_PRICES[type] || BASE_PRICES[1];
    let totalMultiplier = 1;
    const reasons = [];
    const matchedPatterns = [];
    const matchedGroups = new Set();

    // Сортируем паттерны по приоритету (высший первый)
    const sortedPatterns = [...PATTERNS].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const pattern of sortedPatterns) {
        // Пропускаем, если уже сработал паттерн из этой эксклюзивной группы
        if (pattern.exclusiveGroup && matchedGroups.has(pattern.exclusiveGroup)) {
            continue;
        }

        const matched = checkPattern(fullNum, pattern, context);
        if (!matched) continue;

        const mult = getPatternMultiplier(pattern, fullNum, context);
        if (!Number.isFinite(mult) || mult <= 0) continue;
        
        totalMultiplier *= mult;
        reasons.push(getPatternDescription(pattern, fullNum));
        matchedPatterns.push({ ...pattern, multiplier: mult });

        // Если паттерн полностью эксклюзивный — останавливаем проверку остальных
        if (pattern.exclusive) break;

        // Отмечаем группу как использованную
        if (pattern.exclusiveGroup) {
            matchedGroups.add(pattern.exclusiveGroup);
        }
    }

    // Итоговая цена
    let price = Math.floor(basePrice * totalMultiplier);

    // Ограничения
    const MIN_PRICE = basePrice;
    const MAX_PRICE = 1_000_000_000;
    if (price < MIN_PRICE) price = MIN_PRICE;
    if (price > MAX_PRICE) price = MAX_PRICE;

    // Категория по цене
    const categoryInfo = getCategoryByPrice(price);
    const chance = CATEGORY_CHANCES[categoryInfo.id] || "?";

    return {
        price,
        category: categoryInfo.name,
        categoryId: categoryInfo.id,
        chance,
        reasons,
        multiplier: totalMultiplier,
        basePrice,
        matchedPatterns: matchedPatterns.map(p => p.id)
    };
}

/**
 * Упрощённая версия для быстрой оценки (без контекста)
 */
export function quickPrice(fullNum, type = 1) {
    return calculatePrice(fullNum, type, {});
}

/**
 * Получить все сработавшие паттерны для отображения в UI
 */
export function getMatchedPatterns(fullNum, type = 1, context = {}) {
    const matched = [];
    const matchedGroups = new Set();
    const sortedPatterns = [...PATTERNS].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const pattern of sortedPatterns) {
        if (pattern.exclusiveGroup && matchedGroups.has(pattern.exclusiveGroup)) {
            continue;
        }
        if (checkPattern(fullNum, pattern, context)) {
            matched.push({
                id: pattern.id,
                name: pattern.name,
                multiplier: getPatternMultiplier(pattern, fullNum, context),
                description: getPatternDescription(pattern, fullNum),
                category: pattern.category
            });
            if (pattern.exclusive) break;
            if (pattern.exclusiveGroup) matchedGroups.add(pattern.exclusiveGroup);
        }
    }
    return matched;
}