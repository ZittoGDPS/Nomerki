const tg = window.Telegram ? window.Telegram.WebApp : null;

// --- 1. РЕГИСТРАЦИЯ ПО ТГ ---
function registerUser() {
    if (tg) {
        tg.ready();
        tg.expand();
        
        // Получаем данные пользователя из ТГ
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            let user = tg.initDataUnsafe.user;
            let userName = user.first_name || "Игрок";
            let userId = user.id;
            
            // Отображаем данные
            document.getElementById('user-info').style.display = 'flex';
            document.getElementById('user-name').innerText = userName;
            document.getElementById('user-avatar').innerText = userName.charAt(0).toUpperCase();
            document.getElementById('loading-status').style.display = 'none';
            
            // Сохраняем ID в память (для синхронизации)
            localStorage.setItem('tg_user_id', userId);
            localStorage.setItem('tg_user_name', userName);
            
            return userId;
        } else {
            // Если открыто просто в браузере (не через ТГ)
            document.getElementById('user-info').style.display = 'flex';
            document.getElementById('user-name').innerText = "Гость (Браузер)";
            document.getElementById('loading-status').style.display = 'none';
            return null;
        }
    } else {
        document.getElementById('loading-status').innerText = "Ошибка Telegram API";
        return null;
    }
}

// --- 2. СИНХРОНИЗАЦИЯ ДАННЫХ (Облако ТГ) ---
let state = { balance: 0, inventory: [], level: 1, points: 0, isDark: false };
let userId = registerUser();

function syncFromCloud() {
    if (!tg || !tg.CloudStorage) return false;
    
    tg.CloudStorage.getItem("player_state", (err, data) => {
        if (data && !err) {
            try {
                let parsed = JSON.parse(data);
                state.balance = parsed.balance || 0;
                state.inventory = parsed.inventory || [];
                state.level = parsed.level || 1;
                state.points = parsed.points || 0;
                
                updateUI();
                console.log("Данные загружены из облака ТГ");
            } catch (e) { console.log("Ошибка чтения"); }
        }
    });
    return true;
}

function saveToCloud() {
    if (!tg || !tg.CloudStorage) return;
    
    let dataToSave = {
        balance: state.balance,
        inventory: state.inventory,
        level: state.level,
        points: state.points
    };
    tg.CloudStorage.setItem("player_state", JSON.stringify(dataToSave));
}

// --- 3. ЛОГИКА ИГРЫ (упрощенная) ---
function updateUI() {
    document.getElementById('balance-display').innerText = state.balance.toLocaleString('ru-RU') + ' ₽';
    document.getElementById('lvl-text').innerText = `Уровень: ${state.level}`;
    document.getElementById('pts-text').innerText = `Поинты: ${state.points} / ${state.level * 100}`;
    
    // Сохраняем в облако при каждом обновлении
    saveToCloud();
}

// Пример кнопки генерации (чтобы проверить работу)
document.getElementById('custom-gen-btn').onclick = () => {
    let price = Math.floor(Math.random() * 10000) + 150;
    state.balance += price;
    
    document.getElementById('custom-gen-result').innerHTML = `
        <div class="phone-number rarity-common">+7-999-XXX-XX-XX</div>
        <div class="price-tag">${price.toLocaleString('ru-RU')} ₽</div>
        <div class="category-text">Обычный</div>
    `;
    document.getElementById('custom-gen-result').classList.add('force-show');
    updateUI();
};

// Кнопка перехода в лидерборд
document.getElementById('btn-go-top').onclick = () => {
    window.location.href = 'leaderboard.html';
};

// Запуск синхронизации при загрузке
window.onload = () => {
    // Сначала пробуем облако
    let cloudLoaded = syncFromCloud();
    
    // Если облако недоступно (например, тест в браузере), грузим локально
    if (!cloudLoaded) {
        state.balance = parseInt(localStorage.getItem('blum_balance')) || 0;
        state.level = parseInt(localStorage.getItem('blum_level')) || 1;
        updateUI();
    }
};