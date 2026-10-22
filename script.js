// --- 1. ИНИЦИАЛИЗАЦИЯ FIREBASE ---
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

// --- 2. РЕГИСТРАЦИЯ В TG ---
const tg = window.Telegram ? window.Telegram.WebApp : null;
let myName = "Гость";
let myId = "guest_" + Math.floor(Math.random() * 100000);

if (tg) {
    tg.ready();
    tg.expand();
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        myName = tg.initDataUnsafe.user.first_name || "Игрок";
        myId = tg.initDataUnsafe.user.id.toString();
        document.getElementById('user-name').innerText = myName;
    }
}

// Состояние игры
let state = {
    balance: 0, inventory: [], level: 1, points: 0, boostMultiplier: 1,
    boostEndTime: 0, currentGen: null
};

// --- 3. СИНХРОНИЗАЦИЯ С FIREBASE ---
function syncFirebase() {
    // Сохраняем имя в базу при входе
    set(ref(db, 'players/' + myId + '/name'), myName);

    // Слушаем изменения баланса (если играем с другого устройства)
    onValue(ref(db, 'players/' + myId), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            if (data.balance !== undefined) state.balance = data.balance;
            if (data.level !== undefined) state.level = data.level;
            if (data.points !== undefined) state.points = data.points;
            updateUI();
        }
    });
}

// Обновляем базу данных при каждом изменении в игре
function saveToFirebase() {
    set(ref(db, 'players/' + myId), {
        name: myName,
        balance: state.balance,
        level: state.level,
        points: state.points,
        lastSeen: Date.now()
    });
}

// --- 4. ОСТАЛЬНАЯ ЛОГИКА ИГРЫ ---
function updateUI() {
    document.getElementById('balance-display').innerText = state.balance.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('lvl-text').innerText = `Уровень: ${state.level}`;
    document.getElementById('pts-text').innerText = `Поинты: ${state.points} / ${state.level * 100}`;
    saveToFirebase(); // Сохраняем в облако при каждом обновлении
}

// Кнопка генерации
document.getElementById('custom-gen-btn').addEventListener('click', () => {
    let price = Math.floor(Math.random() * 10000) + 150;
    state.balance += price;
    
    document.getElementById('custom-gen-result').innerHTML = `
        <div class="phone-number rarity-common">+7-999-XXX-XX-XX</div>
        <div class="price-tag">${price.toLocaleString('ru-RU')} ₽</div>
        <div class="category-text">Обычный</div>
    `;
    document.getElementById('custom-gen-result').classList.add('force-show');
    updateUI();
});

// Переход в лидерборд
document.getElementById('btn-go-top').addEventListener('click', () => {
    window.location.href = 'leaderboard.html';
});

// Запуск
syncFirebase();