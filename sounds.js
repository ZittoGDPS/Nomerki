/**
 * sounds.js — модуль звуков для игры "Генератор Номеров"
 * Подключение: <script src="sounds.js"></script>
 * Использование: SOUND.click(), SOUND.sell(), SOUND.casinoWin() и т.д.
 *
 * Настройки хранятся в localStorage под ключом 'blum_sound' ('true'/'false').
 * По умолчанию звук включён.
 */
(function (global) {
    'use strict';

    // ─── Состояние ─────────────────────────────────────────────
    let ctx = null;
    let enabled = localStorage.getItem('blum_sound') !== 'false';
    let unlocked = false;

    // ─── Ядро Web Audio ───────────────────────────────────────
    function getCtx() {
        if (!ctx) {
            try {
                const AC = global.AudioContext || global.webkitAudioContext;
                if (!AC) return null;
                ctx = new AC();
            } catch (e) {
                return null;
            }
        }
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    /**
     * Одиночный тон.
     * @param {Object} o
     * @param {number} [o.freq=440]      — частота (Гц)
     * @param {string} [o.type='sine']   — 'sine'|'square'|'triangle'|'sawtooth'
     * @param {number} [o.duration=0.15] — длительность звучания
     * @param {number} [o.volume=0.15]   — громкость (0..1)
     * @param {number} [o.attack=0.01]   — атака
     * @param {number} [o.release=0.1]   — затухание
     * @param {number|null} [o.slideTo=null] — конечная частота (глиссандо)
     * @param {number} [o.delay=0]       — задержка старта
     */
    function tone(o) {
        if (!enabled) return;
        const c = getCtx();
        if (!c) return;
        const freq = o.freq != null ? o.freq : 440;
        const type = o.type || 'sine';
        const duration = o.duration != null ? o.duration : 0.15;
        const volume = o.volume != null ? o.volume : 0.15;
        const attack = o.attack != null ? o.attack : 0.01;
        const release = o.release != null ? o.release : 0.1;
        const slideTo = o.slideTo != null ? o.slideTo : null;
        const delay = o.delay || 0;

        const t0 = c.currentTime + delay;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (slideTo !== null) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + duration);
        }
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration + release);
        osc.connect(gain).connect(c.destination);
        osc.start(t0);
        osc.stop(t0 + duration + release + 0.05);
    }

    /**
     * Аккорд — несколько частот одновременно/с разбросом.
     * @param {number[]} freqs
     * @param {Object} [opts] — те же параметры, что у tone(), плюс:
     * @param {number} [opts.spread=0] — сдвиг старта между нотами
     */
    function chord(freqs, opts) {
        opts = opts || {};
        const spread = opts.spread || 0;
        const baseDelay = opts.delay || 0;
        freqs.forEach(function (f, i) {
            tone(Object.assign({}, opts, { freq: f, delay: baseDelay + i * spread }));
        });
    }

    /**
     * Шум (для сгорания/взрыва).
     * @param {Object} [o]
     * @param {number} [o.duration=0.5]
     * @param {number} [o.volume=0.12]
     * @param {number} [o.lowpass=1200] — срез фильтра
     */
    function noise(o) {
        if (!enabled) return;
        const c = getCtx();
        if (!c) return;
        o = o || {};
        const duration = o.duration != null ? o.duration : 0.5;
        const volume = o.volume != null ? o.volume : 0.12;
        const lowpass = o.lowpass != null ? o.lowpass : 1200;

        const bufferSize = Math.floor(c.sampleRate * duration);
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const src = c.createBufferSource();
        src.buffer = buffer;
        const gain = c.createGain();
        gain.gain.value = volume;
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = lowpass;
        src.connect(filter).connect(gain).connect(c.destination);
        src.start();
    }

    // ─── Публичное API ────────────────────────────────────────
    const SOUND = {
        /** Включён ли звук */
        isEnabled() { return enabled; },

        /** Включить/выключить звук (сохраняется в localStorage) */
        setEnabled(v) {
            enabled = !!v;
            localStorage.setItem('blum_sound', enabled ? 'true' : 'false');
            if (enabled) this.click();
        },

        /** Разблокировать AudioContext (обязательно на мобильных по первому тапу) */
        unlock() {
            if (unlocked) return;
            const c = getCtx();
            if (c) {
                // короткий беззвучный «пинок», чтобы контекст точно проснулся
                try {
                    const buf = c.createBuffer(1, 1, c.sampleRate);
                    const src = c.createBufferSource();
                    src.buffer = buf;
                    src.connect(c.destination);
                    src.start(0);
                    unlocked = true;
                } catch (e) { /* ignore */ }
            }
        },

        // ─── UI ─────────────────────────────────────────────
        click() {
            tone({ freq: 880, type: 'square', duration: 0.03, volume: 0.06 });
        },
        toggle() {
            tone({ freq: 660, type: 'sine', duration: 0.05, volume: 0.08 });
            tone({ freq: 990, type: 'sine', duration: 0.05, volume: 0.08, delay: 0.05 });
        },
        error() {
            tone({ freq: 220, type: 'square', duration: 0.15, volume: 0.10 });
            tone({ freq: 180, type: 'square', duration: 0.20, volume: 0.10, delay: 0.10 });
        },
        notification() {
            tone({ freq: 880, type: 'sine', duration: 0.08, volume: 0.10 });
            tone({ freq: 1174.66, type: 'sine', duration: 0.12, volume: 0.10, delay: 0.08 });
        },

        // ─── Генерация номеров ──────────────────────────────
        genTick() {
            tone({ freq: 1600, type: 'square', duration: 0.02, volume: 0.04 });
        },
        genSuccess() {
            chord([523.25, 659.25, 783.99], {
                type: 'sine', duration: 0.12, volume: 0.10, spread: 0.05
            });
        },
        genRare() {
            chord([523.25, 659.25, 783.99, 1046.5], {
                type: 'triangle', duration: 0.18, volume: 0.12, spread: 0.06
            });
            tone({ freq: 1568, type: 'sine', duration: 0.4, volume: 0.10, delay: 0.25 });
        },
        genMega() {
            chord([261.63, 329.63, 392.00], {
                type: 'sawtooth', duration: 0.15, volume: 0.10, spread: 0.05
            });
            setTimeout(function () {
                chord([523.25, 659.25, 783.99, 1046.5], {
                    type: 'triangle', duration: 0.25, volume: 0.13, spread: 0.05
                });
            }, 150);
            setTimeout(function () {
                tone({ freq: 2093, type: 'sine', duration: 0.5, volume: 0.10 });
            }, 400);
        },

        // ─── Деньги / инвентарь ─────────────────────────────
        sell() {
            tone({ freq: 1200, type: 'sine', duration: 0.06, volume: 0.10 });
            tone({ freq: 1600, type: 'sine', duration: 0.10, volume: 0.10, delay: 0.06 });
        },
        buy() {
            tone({ freq: 600, type: 'triangle', duration: 0.08, volume: 0.10 });
            tone({ freq: 900, type: 'triangle', duration: 0.12, volume: 0.10, delay: 0.08 });
        },
        coins() {
            tone({ freq: 1046.5, type: 'triangle', duration: 0.06, volume: 0.09 });
            tone({ freq: 1318.5, type: 'triangle', duration: 0.06, volume: 0.09, delay: 0.06 });
            tone({ freq: 1568.0, type: 'triangle', duration: 0.10, volume: 0.09, delay: 0.12 });
        },

        // ─── Прогресс / бусты ───────────────────────────────
        levelUp() {
            chord([523.25, 659.25, 783.99], {
                type: 'triangle', duration: 0.12, volume: 0.11, spread: 0.05
            });
            setTimeout(function () {
                chord([1046.5, 1318.5, 1568.0], {
                    type: 'triangle', duration: 0.15, volume: 0.10, spread: 0.04
                });
            }, 200);
        },
        boost() {
            tone({ freq: 400, type: 'sawtooth', duration: 0.10, volume: 0.10, slideTo: 1200 });
            setTimeout(function () {
                chord([659.25, 880.00, 1318.5], {
                    type: 'triangle', duration: 0.18, volume: 0.10, spread: 0.05
                });
            }, 100);
        },

        // ─── Апгрейдер (казино) ─────────────────────────────
        casinoSpin() {
            tone({ freq: 900, type: 'square', duration: 0.05, volume: 0.06, slideTo: 1400 });
        },
        casinoWin() {
            chord([659.25, 783.99, 987.77, 1318.5], {
                type: 'triangle', duration: 0.15, volume: 0.12, spread: 0.06
            });
            setTimeout(function () {
                tone({ freq: 2093, type: 'sine', duration: 0.5, volume: 0.09 });
            }, 300);
        },
        casinoLose() {
            noise({ duration: 0.6, volume: 0.15, lowpass: 1000 });
            tone({ freq: 200, type: 'sawtooth', duration: 0.4, volume: 0.10, slideTo: 60 });
        },

        // ─── СИМ-стена ──────────────────────────────────────
        simwallIncome() {
            tone({ freq: 700, type: 'sine', duration: 0.06, volume: 0.08 });
            tone({ freq: 1000, type: 'sine', duration: 0.08, volume: 0.08, delay: 0.06 });
        },
        simwallUpgrade() {
            chord([523.25, 783.99, 1046.5], {
                type: 'triangle', duration: 0.12, volume: 0.10, spread: 0.05
            });
        }
    };

    // ─── Авто-разблокировка на первом касании ────────────────
    function autoUnlock() {
        SOUND.unlock();
        document.removeEventListener('touchstart', autoUnlock);
        document.removeEventListener('click', autoUnlock);
        document.removeEventListener('keydown', autoUnlock);
    }
    document.addEventListener('touchstart', autoUnlock, { passive: true });
    document.addEventListener('click', autoUnlock);
    document.addEventListener('keydown', autoUnlock);

    // ─── Экспорт ────────────────────────────────────────────
    global.SOUND = SOUND;
})(window);