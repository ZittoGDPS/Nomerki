// --- 1. ПОДКЛЮЧЕНИЕ FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAdZZjg-Tvmn8cs7Ticg2LNd_N-mDlqOTI",
    authDomain: "nomerki-gam3.firebaseapp.com",
    databaseURL: "https://nomerki-gam3-default-rtdb.firebaseio.com",
    projectId: "nomerki-gam3",
    storageBucket: "nomerki-gam3.firebasestorage.app",
    messagingSenderId: "582885790988",
    appId: "1:582885790988:web:ef8965c63a38da68d82529",
    measurementId: "G-8EGEPGFF4H"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- 2. ПЕРЕМЕННЫЕ ИГРЫ ---
const tg = window.Telegram ? window.Telegram.WebApp : null;
let myName = "Игрок";
let myId = "guest_" + Math.floor(Math.random() * 10000);

if (tg) { 
    tg.ready(); 
    tg.expand(); 
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        myName = tg.initDataUnsafe.user.first_name || "Игрок";
        myId = tg.initDataUnsafe.user.id.toString();
    }
}

let state = {
    balance: parseInt(localStorage.getItem('blum_balance')) || 0,
    inventory: JSON.parse(localStorage.getItem('blum_inventory')) || [],
    isDarkTheme: localStorage.getItem('blum_theme') === 'dark',
    points: parseInt(localStorage.getItem('blum_points')) || 0,
    level: parseInt(localStorage.getItem('blum_level')) || 1,
    boostMultiplier: 1,
    boostEndTime: parseInt(localStorage.getItem('blum_boost_end')) || 0,
    currentGen: null
};

// --- 3. РЕГИСТРАЦИЯ (Кнопка "Войти") ---
document.getElementById('btn-start').addEventListener('click', () => {
    // Скрываем регистрацию и показываем игру
    document.getElementById('register-screen').style.display = 'none';
    document.getElementById('game-wrapper').style.display = 'flex';

    // Показываем данные ТГ
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        let user = tg.initDataUnsafe.user;
        document.getElementById('user-info').style.display = 'flex';
        document.getElementById('user-name').innerText = user.first_name;
        document.getElementById('user-avatar').innerText = user.first_name.charAt(0).toUpperCase();
        document.getElementById('loading-status').style.display = 'none';
    }

    // Синхронизация с Firebase
    set(ref(db, 'players/' + myId + '/name'), myName);
    onValue(ref(db, 'players/' + myId), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            state.balance = data.balance || 0;
            state.level = data.level || 1;
            state.points = data.points || 0;
            updateUI();
        }
    });
});

// --- 4. ЛОГИКА ИГРЫ ---
function saveData() {
    localStorage.setItem('blum_balance', state.balance);
    localStorage.setItem('blum_inventory', JSON.stringify(state.inventory));
    localStorage.setItem('blum_theme', state.isDarkTheme ? 'dark' : 'light');
    localStorage.setItem('blum_points', state.points);
    localStorage.setItem('blum_level', state.level);
    localStorage.setItem('blum_boost_end', state.boostEndTime);

    // Сохраняем в Firebase
    set(ref(db, 'players/' + myId), {
        name: myName,
        balance: state.balance,
        level: state.level,
        points: state.points,
        lastSeen: Date.now()
    });
}

function getRarity(category) {
    if (category.includes("БРИЛЛИАНТОВЫЙ")) return { cls: "rarity-diamond", xp: 1000 };
    if (category.includes("ЗОЛОТОЙ")) return { cls: "rarity-gold", xp: 150 };
    if (category.includes("СЕРЕБРЯНЫЙ")) return { cls: "rarity-silver", xp: 50 };
    if (category.includes("ЗЕРКАЛЬНЫЙ") || category.includes("ПОСЛЕДОВАТЕЛЬНЫЙ")) return { cls: "rarity-common", xp: 75 };
    if (category.includes("БРОНЗОВЫЙ")) return { cls: "rarity-bronze", xp: 25 };
    if (category.includes("УДАЧНЫЙ")) return { cls: "rarity-lucky", xp: 30 };
    if (category.includes("КРАСИВОЕ")) return { cls: "rarity-common", xp: 10 };
    return { cls: "rarity-common", xp: 5 };
}

function calculatePrice(fullNum) {
    let price = 150, category = "Обычный", isBeautiful = false;
    if (/^(\d)\1{9}$/.test(fullNum)) { price = 1000000000; category = "БРИЛЛИАНТОВЫЙ"; isBeautiful = true; }
    else {
        let last4 = fullNum.slice(-4);
        if (last4 === "7777" || last4 === "8888" || last4 === "0000") { price = 5000000; category = "ЗОЛОТОЙ"; isBeautiful = true; }
        else if (/(\d)\1{2}/.test(fullNum)) { price = 150000; category = "СЕРЕБРЯНЫЙ"; isBeautiful = true; }
        else if (fullNum === fullNum.split('').reverse().join('')) { price = 300000; category = "ЗЕРКАЛЬНЫЙ"; isBeautiful = true; }
        else if (last4[0] === last4[1] && last4[2] === last4[3]) { price = 50000; category = "БРОНЗОВЫЙ"; isBeautiful = true; }
        else if (fullNum.includes("1234") || fullNum.includes("5678") || fullNum.includes("9876")) { price = 100000; category = "ПОСЛЕДОВАТЕЛЬНЫЙ"; isBeautiful = true; }
        else if (fullNum.slice(-2)[0] === fullNum.slice(-2)[1]) { price = 5000; category = "КРАСИВОЕ ОКОНЧАНИЕ"; }
    }
    if (!isBeautiful) {
        let luckyChance = state.level * 0.5;
        if (Math.random() * 100 < luckyChance) { price = Math.floor(Math.random() * 50000) + 10000; category = "УДАЧНЫЙ (Бонус уровня)"; }
    }
    if (price > 150) price += Math.floor(Math.random() * (price * 0.1)); 
    return { price, category };
}

function showToast(text) {
    let old = document.getElementById('toast-notification');
    if (old) old.remove();
    let toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.innerHTML = text;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
}

function checkBoost() {
    let now = Date.now();
    let el = document.getElementById('boost-indicator');
    if (now < state.boostEndTime) {
        let timeLeft = Math.ceil((state.boostEndTime - now) / 1000);
        el.style.display = 'block';
        el.innerText = `⚡ x${state.boostMultiplier} (${timeLeft}с)`;
    } else {
        el.style.display = 'none';
        state.boostMultiplier = 1;
    }
}
setInterval(checkBoost, 1000);

function updateUI() {
    document.getElementById('balance-display').innerText = state.balance.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('inv-balance-amount').innerText = state.balance.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('bag-count').innerText = state.inventory.length;
    document.getElementById('lvl-text').innerText = `Уровень: ${state.level}`;
    
    let ptsNeeded = state.level * 100;
    while (state.points >= ptsNeeded && state.level < 100) {
        state.points -= ptsNeeded; state.level++;
        let roll = Math.random() * 100;
        if (state.level > 50 && roll < 10) state.boostMultiplier = 5; 
        else if (state.level > 20 && roll < 25) state.boostMultiplier = 3;
        else if (roll < 50) state.boostMultiplier = 2;
        else state.boostMultiplier = 1.5;
        state.boostEndTime = Date.now() + 30000; 
        showToast(`🚀 БУСТ! Множитель x${state.boostMultiplier} на 30 секунд!`);
        ptsNeeded = state.level * 100;
    }

    if (state.level >= 100) {
        document.getElementById('pts-text').innerText = `Максимальный уровень!`;
        document.getElementById('xp-bar-fill').style.width = '100%';
    } else {
        document.getElementById('pts-text').innerText = `Поинты: ${state.points} / ${ptsNeeded}`;
        document.getElementById('xp-bar-fill').style.width = `${(state.points / ptsNeeded) * 100}%`;
    }

    let btnAll = document.getElementById('btn-sell-all');
    if (btnAll) {
        btnAll.disabled = state.inventory.length === 0;
        btnAll.innerText = state.inventory.length === 0 ? "Рюкзак пуст" : "Продать все номера (" + state.inventory.length + ")";
    }
    saveData();
}

// --- 5. ОБРАБОТЧИКИ СОБЫТИЙ ---
document.addEventListener('click', function(e) {
    let target = e.target.closest('button, .info-icon');
    if (!target) return;

    if (target.id === 'btn-go-top') { window.location.href = 'leaderboard.html'; }
    if (target.id === 'custom-gen-btn') {
        let fullNum = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        let phone = `+7-${fullNum.substring(0, 3)}-${fullNum.substring(3, 6)}-${fullNum.substring(6, 8)}-${fullNum.substring(8, 10)}`;
        let evalData = calculatePrice(fullNum);
        let rarity = getRarity(evalData.category);
        state.currentGen = { phone, price: evalData.price, category: evalData.category };
        let earnedXP = Math.floor(rarity.xp * state.boostMultiplier);

        document.getElementById('custom-gen-result').innerHTML = `
            <div class="info-icon" id="btn-show-info">i</div>
            <div class="phone-number ${rarity.cls}">${phone}</div>
            <div class="price-tag">${evalData.price.toLocaleString('ru-RU')} ₽</div>
            <div class="category-text">${evalData.category} <span class="xp-gained-text">(+${earnedXP} XP)</span></div>
        `;
        document.getElementById('custom-gen-result').classList.add('force-show');
        document.getElementById('custom-gen-btn').style.display = 'none';
        document.getElementById('action-btns-wrapper').style.display = 'flex';

        state.points += earnedXP;
        updateUI();
    }

    if (target.id === 'btn-sell-now') {
        state.balance += state.currentGen.price;
        updateUI();
        document.getElementById('action-btns-wrapper').style.display = 'none';
        document.getElementById('custom-gen-btn').style.display = 'block';
    }
    if (target.id === 'btn-keep') {
        state.inventory.push(state.currentGen);
        updateUI();
        document.getElementById('action-btns-wrapper').style.display = 'none';
        document.getElementById('custom-gen-btn').style.display = 'block';
    }

    if (target.classList.contains('btn-sell-item')) {
        let idx = parseInt(target.getAttribute('data-index'));
        let item = state.inventory[idx];
        state.balance += item.price;
        state.inventory.splice(idx, 1);
        updateUI();
        renderInventory();
    }

    if (target.id === 'btn-sell-all') {
        if (state.inventory.length === 0) return;
        let total = state.inventory.reduce((sum, item) => sum + item.price, 0);
        state.balance += total;
        state.inventory = [];
        updateUI();
        renderInventory();
        showToast(`✅ Вы получили ${total.toLocaleString('ru-RU')} ₽`);
    }

    if (target.id === 'btn-open-bag') { document.getElementById('inventory-screen').style.display = 'flex'; updateUI(); renderInventory(); }
    if (target.id === 'btn-close-bag') { document.getElementById('inventory-screen').style.display = 'none'; }
    if (target.id === 'btn-open-settings') { document.getElementById('settings-screen').style.display = 'flex'; }
    if (target.id === 'btn-close-settings') { document.getElementById('settings-screen').style.display = 'none'; }
    if (target.id === 'btn-show-info') { document.getElementById('info-modal').style.display = 'flex'; }
    if (target.id === 'btn-close-info') { document.getElementById('info-modal').style.display = 'none'; }
});

function renderInventory() {
    let list = document.getElementById('inv-list');
    list.innerHTML = '';
    if (state.inventory.length === 0) {
        list.innerHTML = '<div style="text-align:center; margin-top:20px;">Рюкзак пуст.</div>';
        return;
    }
    [...state.inventory].reverse().forEach((item, index) => {
        let realIndex = state.inventory.length - 1 - index;
        let rarity = getRarity(item.category);
        let div = document.createElement('div');
        div.className = 'inv-item';
        div.innerHTML = `
            <div>
                <div class="${rarity.cls}" style="font-weight:bold; font-family:monospace;">${item.phone}</div>
                <div style="color:#28a745; font-size:14px; font-weight:bold;">${item.price.toLocaleString('ru-RU')} ₽</div>
            </div>
            <button class="btn-sell-item" data-index="${realIndex}">Продать</button>
        `;
        list.appendChild(div);
    });
}

document.getElementById('toggle-theme').addEventListener('change', (e) => {
    state.isDarkTheme = e.target.checked;
    if (state.isDarkTheme) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
    saveData();
});

// Инициализация темы
if (state.isDarkTheme) document.body.classList.add('dark-theme');