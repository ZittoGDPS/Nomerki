const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }

// --- РЕГИСТРАЦИЯ И СИНХРОНИЗАЦИЯ ---
let myName = "Игрок";
if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    myName = tg.initDataUnsafe.user.first_name || "Игрок";
    if (tg.initDataUnsafe.user.username) {
        myName = "@" + tg.initDataUnsafe.user.username;
    }
}
document.getElementById('user-name').innerText = myName;

let state = {
    balance: 0, inventory: [], isDarkTheme: false, points: 0, level: 1,
    useSellWarning: false, warnThreshold: 100000, boostMultiplier: 1,
    boostEndTime: 0, currentGen: null
};

// Синхронизация с облаком ТГ
function syncCloud(callback) {
    if (!tg || !tg.CloudStorage) {
        loadLocal();
        if(callback) callback();
        return;
    }
    tg.CloudStorage.getItem("player_state", (err, data) => {
        if (data && !err) {
            try {
                let p = JSON.parse(data);
                state.balance = p.balance || 0;
                state.inventory = p.inventory || [];
                state.isDarkTheme = p.isDarkTheme || false;
                state.points = p.points || 0;
                state.level = p.level || 1;
                state.useSellWarning = p.useSellWarning || false;
                state.warnThreshold = p.warnThreshold || 100000;
                
                if (state.isDarkTheme) document.body.classList.add('dark-theme');
                updateUI();
            } catch (e) { loadLocal(); }
        } else { loadLocal(); }
        if(callback) callback();
    });
}

function saveCloud() {
    if (tg && tg.CloudStorage) {
        let toSave = {
            name: myName, // Сохраняем имя для лидерборда
            balance: state.balance, inventory: state.inventory,
            isDarkTheme: state.isDarkTheme, points: state.points,
            level: state.level, useSellWarning: state.useSellWarning,
            warnThreshold: state.warnThreshold
        };
        tg.CloudStorage.setItem("player_state", JSON.stringify(toSave));
    }
    // Дублируем локально
    localStorage.setItem('blum_balance', state.balance);
    localStorage.setItem('blum_inventory', JSON.stringify(state.inventory));
    localStorage.setItem('blum_theme', state.isDarkTheme ? 'dark' : 'light');
    localStorage.setItem('blum_points', state.points);
    localStorage.setItem('blum_level', state.level);
    localStorage.setItem('blum_use_warning', state.useSellWarning);
    localStorage.setItem('blum_warn_threshold', state.warnThreshold);
}

function loadLocal() {
    state.balance = parseInt(localStorage.getItem('blum_balance')) || 0;
    state.inventory = JSON.parse(localStorage.getItem('blum_inventory')) || [];
    state.isDarkTheme = localStorage.getItem('blum_theme') === 'dark';
    state.points = parseInt(localStorage.getItem('blum_points')) || 0;
    state.level = parseInt(localStorage.getItem('blum_level')) || 1;
    if (state.isDarkTheme) document.body.classList.add('dark-theme');
    updateUI();
}

// --- ИГРОВАЯ ЛОГИКА ---
const getEl = (id) => document.getElementById(id);

function getRarity(cat) {
    if (cat.includes("БРИЛЛИАНТОВЫЙ")) return { cls: "rarity-diamond", xp: 1000 };
    if (cat.includes("ЗОЛОТОЙ")) return { cls: "rarity-gold", xp: 150 };
    if (cat.includes("СЕРЕБРЯНЫЙ")) return { cls: "rarity-silver", xp: 50 };
    if (cat.includes("ЗЕРКАЛЬНЫЙ") || cat.includes("ПОСЛЕДОВАТЕЛЬНЫЙ")) return { cls: "rarity-common", xp: 75 };
    if (cat.includes("БРОНЗОВЫЙ")) return { cls: "rarity-bronze", xp: 25 };
    if (cat.includes("УДАЧНЫЙ")) return { cls: "rarity-lucky", xp: 30 };
    if (cat.includes("КРАСИВОЕ")) return { cls: "rarity-common", xp: 10 };
    return { cls: "rarity-common", xp: 5 };
}

function calculatePrice(num) {
    let price = 150, category = "Обычный", isBeautiful = false;
    if (/^(\d)\1{9}$/.test(num)) { price = 1000000000; category = "БРИЛЛИАНТОВЫЙ"; isBeautiful = true; }
    else {
        let last4 = num.slice(-4);
        if (last4 === "7777" || last4 === "8888" || last4 === "0000") { price = 5000000; category = "ЗОЛОТОЙ"; isBeautiful = true; }
        else if (/(\d)\1{2}/.test(num)) { price = 150000; category = "СЕРЕБРЯНЫЙ"; isBeautiful = true; }
        else if (num === num.split('').reverse().join('')) { price = 300000; category = "ЗЕРКАЛЬНЫЙ"; isBeautiful = true; }
        else if (last4[0] === last4[1] && last4[2] === last4[3]) { price = 50000; category = "БРОНЗОВЫЙ"; isBeautiful = true; }
        else if (num.includes("1234") || num.includes("5678") || num.includes("9876")) { price = 100000; category = "ПОСЛЕДОВАТЕЛЬНЫЙ"; isBeautiful = true; }
        else if (num.slice(-2)[0] === num.slice(-2)[1]) { price = 5000; category = "КРАСИВОЕ ОКОНЧАНИЕ"; }
    }
    if (!isBeautiful) {
        let lucky = state.level * 0.5;
        if (Math.random() * 100 < lucky) { price = Math.floor(Math.random() * 50000) + 10000; category = "УДАЧНЫЙ (Бонус)"; }
    }
    if (price > 150) price += Math.floor(Math.random() * (price * 0.1)); 
    return { price, category };
}

function updateUI() {
    getEl('balance-display').innerText = state.balance.toLocaleString('ru-RU') + ' ₽';
    getEl('inv-balance-amount').innerText = state.balance.toLocaleString('ru-RU') + ' ₽';
    getEl('bag-count').innerText = state.inventory.length;
    getEl('lvl-text').innerText = `Уровень: ${state.level}`;
    
    let ptsNeeded = state.level * 100;
    while (state.points >= ptsNeeded && state.level < 100) {
        state.points -= ptsNeeded; state.level++;
        let roll = Math.random() * 100;
        if (state.level > 50 && roll < 10) state.boostMultiplier = 5; 
        else if (state.level > 20 && roll < 25) state.boostMultiplier = 3;
        else if (roll < 50) state.boostMultiplier = 2;
        else state.boostMultiplier = 1.5;
        state.boostEndTime = Date.now() + 30000; 
        alert(`🚀 БУСТ! Множитель x${state.boostMultiplier} на 30 секунд!`);
        ptsNeeded = state.level * 100;
    }

    if (state.level >= 100) {
        getEl('pts-text').innerText = `Максимальный уровень!`;
        getEl('xp-bar-fill').style.width = '100%';
    } else {
        getEl('pts-text').innerText = `Поинты: ${state.points} / ${ptsNeeded}`;
        getEl('xp-bar-fill').style.width = `${(state.points / ptsNeeded) * 100}%`;
    }
    saveCloud();
}

// Обработчик кликов
document.addEventListener('click', function(e) {
    let target = e.target.closest('button');
    if (!target) return;

    if (target.id === 'btn-go-top') {
        window.location.href = 'leaderboard.html';
    }

    if (target.id === 'custom-gen-btn') {
        let num = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        let phone = `+7-${num.substring(0, 3)}-${num.substring(3, 6)}-${num.substring(6, 8)}-${num.substring(8, 10)}`;
        let evalData = calculatePrice(num);
        let rarity = getRarity(evalData.category);
        state.currentGen = { phone, price: evalData.price, category: evalData.category };
        let xp = Math.floor(rarity.xp * state.boostMultiplier);

        getEl('custom-gen-result').innerHTML = `
            <div class="info-icon" onclick="alert('Все шансы в меню 🏆')">i</div>
            <div class="phone-number ${rarity.cls}">${phone}</div>
            <div class="price-tag">${evalData.price.toLocaleString('ru-RU')} ₽</div>
            <div class="category-text">${evalData.category} <span class="xp-gained-text">(+${xp} XP)</span></div>
        `;
        getEl('custom-gen-result').classList.add('force-show');
        getEl('custom-gen-btn').style.display = 'none';
        getEl('action-btns-wrapper').style.display = 'flex';

        state.points += xp;
        updateUI();
    }

    if (target.id === 'btn-sell-now') {
        state.balance += state.currentGen.price;
        updateUI();
        getEl('action-btns-wrapper').style.display = 'none';
        getEl('custom-gen-btn').style.display = 'block';
    }
    if (target.id === 'btn-keep') {
        state.inventory.push(state.currentGen);
        updateUI();
        getEl('action-btns-wrapper').style.display = 'none';
        getEl('custom-gen-btn').style.display = 'block';
    }
    // ... (Остальные кнопки рюкзака и настроек работают аналогично)
});

// Запуск
syncCloud();