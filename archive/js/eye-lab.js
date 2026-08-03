document.addEventListener('DOMContentLoaded', () => {
    const eye = document.querySelector('[data-eye]');
    if (!eye) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const config = {
        movementScale: 0.16,       // Multiplier applied to per-layer max/depth
        distancePower: 0.5,        // How sharply movement ramps with pointer distance
        distanceBoost: 3,          // How much more movement at farthest distance
        ease: prefersReduced ? 1 : 0.12, // Lerp factor per frame (1 snaps)
        leftBias: 2.6,             // Multiplier for negative X to amplify left pull
        attractRadius: 150,        // px range for near-pointer pull
        attractMax: 12,            // px translation at closest approach
        blink: {
            closeMs: 85,           // Close duration (50-200ms)
            holdMs: 20,            // Closed hold (0-200ms)
            openMs: 195,           // Open duration (80-320ms)
            settleMs: 8000,        // Open hold (0-8000ms)
            settleJitterPct: 1.0,  // +/- jitter percent for settle (0-1)
            squashPx: 1,           // translateY applied to whole eye on close (px)
            closeEase: 'cubic-bezier(0.42, 0, 0.58, 1)',
            openEase: 'ease-out',
        },
    };

    const pullTarget = eye.closest('.eye-lab__canvas') || eye;

    const layers = Array.from(eye.querySelectorAll('[data-layer]')).map((el) => ({
        el,
        depth: Number(el.dataset.depth) || 1,
        max: Number(el.dataset.max) || 18,
    }));

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + ((b - a) * t);

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const setLayerTransform = (layer, x, y, scale = 1) => {
        layer.el.style.setProperty('--layer-x', `${x.toFixed(2)}px`);
        layer.el.style.setProperty('--layer-y', `${y.toFixed(2)}px`);
        layer.el.style.setProperty('--layer-scale', scale.toFixed(3));
    };

    const applyTransforms = () => {
        const dist = clamp(Math.hypot(currentX, currentY), 0, 1);
        const distT = Math.pow(dist, clamp(config.distancePower, 0.1, 5));
        const distBoost = lerp(1, config.distanceBoost, clamp(distT, 0, 1));
        const scale = config.movementScale * distBoost;

        layers.forEach((layer) => {
            const moveX = currentX * layer.max * layer.depth;
            const moveY = currentY * layer.max * layer.depth;
            setLayerTransform(layer, moveX * scale, moveY * scale, 1);
        });
    };

    const tick = () => {
        const ease = prefersReduced ? 1 : clamp(config.ease, 0.01, 1);
        currentX = lerp(currentX, targetX, ease);
        currentY = lerp(currentY, targetY, ease);
        applyTransforms();

        const settled = Math.abs(currentX - targetX) < 0.001 && Math.abs(currentY - targetY) < 0.001;
        raf = settled ? 0 : window.requestAnimationFrame(tick);
    };

    const updateTarget = (clientX, clientY) => {
        const rect = eye.getBoundingClientRect();
        const cx = rect.left + (rect.width / 2);
        const cy = rect.top + (rect.height / 2);

        const vw = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
        const vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
        const maxDx = Math.max(cx, vw - cx, 1);
        const maxDy = Math.max(cy, vh - cy, 1);

        const dx = clientX - cx;
        const dy = clientY - cy;
        const dist = Math.hypot(dx, dy);

        let nx = clamp(dx / maxDx, -1, 1);
        const ny = clamp(dy / maxDy, -1, 1);

        if (nx < 0) {
            nx = clamp(nx * config.leftBias, -1, 1);
        }

        // Elastic attraction when pointer is near the eye
        const attractRadius = Math.max(0, config.attractRadius);
        const attractMax = Math.max(0, config.attractMax);
        if (attractRadius > 0 && dist < attractRadius) {
            const t = 1 - (dist / attractRadius);
            const pullX = dist === 0 ? 0 : (dx / dist) * attractMax * t;
            const pullY = dist === 0 ? 0 : (dy / dist) * attractMax * t;
            pullTarget.style.transform = `translate(${pullX.toFixed(2)}px, ${pullY.toFixed(2)}px)`;
        } else {
            pullTarget.style.transform = '';
        }

        targetX = nx;
        targetY = ny;
        if (!raf) raf = window.requestAnimationFrame(tick);
    };

    const reset = () => {
        targetX = 0;
        targetY = 0;
        pullTarget.style.transform = '';
        if (!raf) raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', (e) => updateTarget(e.clientX, e.clientY), { passive: true });
    window.addEventListener('pointerleave', reset);
    window.addEventListener('resize', reset);

    // Kick off in default (centered) state
    applyTransforms();

    // --- Blink animation (JS-driven for easier tuning) ---
    const blinkTargets = Array.from(eye.querySelectorAll('.eye__mask-shape, .eye__lid-inner'));
    let blinkTimer = 0;
    let doubleBlinkTimer = 0;
    let blinkCount = 0;
    let nextDoubleAt = 0;

    const stopBlinkLoop = () => {
        if (blinkTimer) {
            window.clearTimeout(blinkTimer);
            blinkTimer = 0;
        }
        if (doubleBlinkTimer) {
            window.clearTimeout(doubleBlinkTimer);
            doubleBlinkTimer = 0;
        }
        blinkTargets.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
        eye.getAnimations().forEach((a) => a.cancel());
    };

    const randomInt = (min, max) => Math.floor(Math.random() * ((max - min) + 1)) + min;

    const resetDoubleSchedule = () => {
        nextDoubleAt = randomInt(5, 10);
        blinkCount = 0;
    };

    resetDoubleSchedule();

    const getBlinkDurations = () => {
        const closeMs = clamp(config.blink.closeMs, 50, 200);
        const holdMs = clamp(config.blink.holdMs, 0, 200);
        const openMs = clamp(config.blink.openMs, 80, 320);
        const settleBase = clamp(config.blink.settleMs, 0, 8000);
        const settleJitterPct = clamp(config.blink.settleJitterPct, 0, 1);
        const settleJitter = (Math.random() * 2 - 1) * settleJitterPct;
        const settleMs = clamp(settleBase + (settleBase * settleJitter), 0, 8000);
        const total = closeMs + holdMs + openMs + settleMs;
        return { closeMs, holdMs, openMs, settleMs, total };
    };

    const playBlinkOnce = (durations = getBlinkDurations()) => {
        if (!blinkTargets.length) return Promise.resolve();

        const { closeMs, holdMs, openMs, settleMs, total } = durations;
        const squashPx = clamp(config.blink.squashPx, 0, 20);

        const keyframes = [
            { transform: 'scaleY(1)', offset: 0, easing: config.blink.closeEase },
            { transform: 'scaleY(0)', offset: closeMs / total, easing: config.blink.closeEase },
            { transform: 'scaleY(0)', offset: (closeMs + holdMs) / total, easing: 'linear' },
            { transform: 'scaleY(1)', offset: (closeMs + holdMs + openMs) / total, easing: config.blink.openEase },
            { transform: 'scaleY(1)', offset: 1, easing: 'linear' },
        ];

        const lidAnims = blinkTargets.map((el) => el.animate(keyframes, {
            duration: total,
            fill: 'forwards',
            easing: 'linear',
        }));

        const squashKeyframes = [
            { transform: 'translateY(0px)', offset: 0, easing: config.blink.closeEase },
            { transform: `translateY(${squashPx}px)`, offset: closeMs / total, easing: config.blink.closeEase },
            { transform: `translateY(${squashPx}px)`, offset: (closeMs + holdMs) / total, easing: 'linear' },
            { transform: 'translateY(0px)', offset: (closeMs + holdMs + openMs) / total, easing: config.blink.openEase },
            { transform: 'translateY(0px)', offset: 1, easing: 'linear' },
        ];

        const squashAnim = eye.animate(squashKeyframes, {
            duration: total,
            fill: 'forwards',
            easing: 'linear',
        });

        const anims = [...lidAnims, squashAnim];

        return Promise.all(anims.map((a) => a.finished.catch(() => {})));
    };

    const startBlinkLoop = () => {
        stopBlinkLoop();
        if (prefersReduced) return;

        resetDoubleSchedule();

        const loop = () => {
            const durations = getBlinkDurations();
            blinkCount += 1;
            const shouldDouble = blinkCount >= nextDoubleAt;
            if (shouldDouble) resetDoubleSchedule();

            playBlinkOnce(durations);

            if (shouldDouble) {
                const secondDurations = getBlinkDurations();
                doubleBlinkTimer = window.setTimeout(() => {
                    playBlinkOnce(secondDurations);
                }, durations.total);

                blinkTimer = window.setTimeout(loop, durations.total + secondDurations.total);
            } else {
                blinkTimer = window.setTimeout(loop, durations.total);
            }
        };

        loop();
    };

    const makeControls = () => {
        const panel = document.createElement('div');
        panel.className = 'eye-controls';
        panel.innerHTML = `
            <div class="eye-controls__row">
                <label>Movement scale</label>
                <input type="range" min="0.05" max="0.35" step="0.01" value="${config.movementScale}" data-key="movementScale" />
                <span class="eye-controls__value" data-value="movementScale">${config.movementScale.toFixed(2)}x</span>
            </div>
            <div class="eye-controls__row">
                <label>Distance power</label>
                <input type="range" min="0.1" max="0.9" step="0.02" value="${config.distancePower}" data-key="distancePower" />
                <span class="eye-controls__value" data-value="distancePower">${config.distancePower.toFixed(2)}</span>
            </div>
            <div class="eye-controls__row">
                <label>Far boost</label>
                <input type="range" min="1" max="3" step="0.05" value="${config.distanceBoost}" data-key="distanceBoost" />
                <span class="eye-controls__value" data-value="distanceBoost">${config.distanceBoost.toFixed(2)}x</span>
            </div>
            <div class="eye-controls__row">
                <label>Left bias</label>
                <input type="range" min="0.5" max="3" step="0.05" value="${config.leftBias}" data-key="leftBias" />
                <span class="eye-controls__value" data-value="leftBias">${config.leftBias.toFixed(2)}x</span>
            </div>
            <div class="eye-controls__row">
                <label>Pull radius</label>
                <input type="range" min="0" max="300" step="5" value="${config.attractRadius}" data-key="attractRadius" />
                <span class="eye-controls__value" data-value="attractRadius">${config.attractRadius.toFixed(0)} px</span>
            </div>
            <div class="eye-controls__row">
                <label>Pull max</label>
                <input type="range" min="0" max="30" step="0.5" value="${config.attractMax}" data-key="attractMax" />
                <span class="eye-controls__value" data-value="attractMax">${config.attractMax.toFixed(1)} px</span>
            </div>
            <div class="eye-controls__row">
                <label>Ease (lerp)</label>
                <input type="range" min="0.02" max="1" step="0.02" value="${config.ease}" data-key="ease" ${prefersReduced ? 'disabled' : ''} />
                <span class="eye-controls__value" data-value="ease">${config.ease.toFixed(2)}</span>
                ${prefersReduced ? '<span class="eye-controls__note">prefers-reduced-motion on</span>' : ''}
            </div>
            <div class="eye-controls__row">
                <label>Close (ms)</label>
                <input type="range" min="50" max="200" step="5" value="${config.blink.closeMs}" data-blink="closeMs" />
                <span class="eye-controls__value" data-value="closeMs">${config.blink.closeMs} ms</span>
            </div>
            <div class="eye-controls__row">
                <label>Hold (ms)</label>
                <input type="range" min="0" max="200" step="5" value="${config.blink.holdMs}" data-blink="holdMs" />
                <span class="eye-controls__value" data-value="holdMs">${config.blink.holdMs} ms</span>
            </div>
            <div class="eye-controls__row">
                <label>Open (ms)</label>
                <input type="range" min="80" max="320" step="5" value="${config.blink.openMs}" data-blink="openMs" />
                <span class="eye-controls__value" data-value="openMs">${config.blink.openMs} ms</span>
            </div>
            <div class="eye-controls__row">
                <label>Settle (ms)</label>
                <input type="range" min="0" max="8000" step="10" value="${config.blink.settleMs}" data-blink="settleMs" />
                <span class="eye-controls__value" data-value="settleMs">${config.blink.settleMs} ms</span>
            </div>
            <div class="eye-controls__row">
                <label>Squash (px)</label>
                <input type="range" min="0" max="20" step="0.5" value="${config.blink.squashPx}" data-blink="squashPx" />
                <span class="eye-controls__value" data-value="squashPx">${config.blink.squashPx} px</span>
            </div>
            <div class="eye-controls__row">
                <label>Settle jitter</label>
                <input type="range" min="0" max="100" step="5" value="${Math.round(config.blink.settleJitterPct * 100)}" data-blink="settleJitterPct" />
                <span class="eye-controls__value" data-value="settleJitterPct">${Math.round(config.blink.settleJitterPct * 100)}%</span>
            </div>
            <div class="eye-controls__row" data-row="readout">
                <label>Readout</label>
                <input type="text" readonly data-readout aria-label="Blink settings readout" />
                <button type="button" data-copy-readout>Copy</button>
            </div>
            <div class="eye-controls__row">
                <label>Close easing</label>
                <select data-blink="closeEase">
                    ${['cubic-bezier(0.42, 0, 0.58, 1)','ease-in','ease-out','ease-in-out','linear'].map((opt) => `<option value="${opt}" ${opt === config.blink.closeEase ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
                <span class="eye-controls__value" data-value="closeEase">${config.blink.closeEase}</span>
            </div>
            <div class="eye-controls__row">
                <label>Open easing</label>
                <select data-blink="openEase">
                    ${['cubic-bezier(0.42, 0, 0.58, 1)','ease-in','ease-out','ease-in-out','linear'].map((opt) => `<option value="${opt}" ${opt === config.blink.openEase ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
                <span class="eye-controls__value" data-value="openEase">${config.blink.openEase}</span>
            </div>
        `;

        const readoutEl = panel.querySelector('[data-readout]');
        const copyBtn = panel.querySelector('[data-copy-readout]');

        const formatBlinkReadout = () => {
            const jitterPct = Math.round(config.blink.settleJitterPct * 100);
            const squash = Number.isInteger(config.blink.squashPx) ? config.blink.squashPx : config.blink.squashPx.toFixed(1);
            return `close ${config.blink.closeMs}ms (${config.blink.closeEase}) | hold ${config.blink.holdMs}ms | open ${config.blink.openMs}ms (${config.blink.openEase}) | settle ${config.blink.settleMs}ms | jitter ±${jitterPct}% | squash ${squash}px`;
        };

        const updateReadout = () => {
            if (!readoutEl) return;
            const text = formatBlinkReadout();
            readoutEl.value = text;
            readoutEl.title = text;
        };

        panel.addEventListener('input', (e) => {
            const target = e.target;
            if (target instanceof HTMLInputElement && target.type === 'range') {
                const key = target.dataset.key;
                if (key && key in config) {
                    const val = Number(target.value);
                    if (!Number.isFinite(val)) return;
                    const ranges = {
                        movementScale: { min: 0.05, max: 0.35 },
                        distancePower: { min: 0.1, max: 0.9 },
                        distanceBoost: { min: 1, max: 3 },
                        leftBias: { min: 0.5, max: 3 },
                        attractRadius: { min: 0, max: 300 },
                        attractMax: { min: 0, max: 30 },
                        ease: { min: 0.02, max: 1 },
                    };
                    const range = ranges[key];
                    config[key] = range ? clamp(val, range.min, range.max) : val;
                    const valueEl = panel.querySelector(`[data-value="${key}"]`);
                    if (valueEl) {
                        const suffix = key === 'movementScale' || key === 'distanceBoost' ? 'x'
                            : (key === 'attractRadius' || key === 'attractMax') ? ' px'
                            : '';
                        const fixed = (key === 'attractRadius') ? 0
                            : (key === 'attractMax') ? 1
                            : 2;
                        valueEl.textContent = `${config[key].toFixed(fixed)}${suffix}`;
                    }
                    return;
                }

                const blinkKey = target.dataset.blink;
                if (!blinkKey || !(blinkKey in config.blink)) return;
                let val = Number(target.value);
                if (!Number.isFinite(val)) return;

                if (blinkKey === 'settleJitterPct') {
                    val = val / 100;
                }
                const ranges = {
                    closeMs: { min: 50, max: 200 },
                    holdMs: { min: 0, max: 200 },
                    openMs: { min: 80, max: 320 },
                    settleMs: { min: 0, max: 8000 },
                    settleJitterPct: { min: 0, max: 1 },
                    squashPx: { min: 0, max: 20 },
                };
                if (ranges[blinkKey]) {
                    val = clamp(val, ranges[blinkKey].min, ranges[blinkKey].max);
                }

                config.blink[blinkKey] = val;

                const valueEl = panel.querySelector(`[data-value="${blinkKey}"]`);
                if (valueEl) {
                    const isPct = blinkKey === 'settleJitterPct';
                    const suffix = isPct ? '%' : blinkKey === 'squashPx' ? ' px' : ' ms';
                    const displayVal = blinkKey === 'settleJitterPct' ? Math.round(val * 100) : val;
                    valueEl.textContent = `${displayVal}${suffix}`;
                }

                updateReadout();
                startBlinkLoop();
                return;
            }

            if (target instanceof HTMLSelectElement) {
                const blinkKey = target.dataset.blink;
                if (!blinkKey || !(blinkKey in config.blink)) return;
                const val = target.value;
                config.blink[blinkKey] = val;
                const valueEl = panel.querySelector(`[data-value="${blinkKey}"]`);
                if (valueEl) valueEl.textContent = val;
                updateReadout();
                startBlinkLoop();
            }
        });

        if (copyBtn && readoutEl) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(readoutEl.value);
                    copyBtn.textContent = 'Copied';
                    window.setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1200);
                } catch (err) {
                    readoutEl.select();
                    document.execCommand('copy');
                }
            });
        }

        updateReadout();

        document.body.appendChild(panel);
    };

    makeControls();
    startBlinkLoop();

    // Manual blink on click (play once then resume loop)
    eye.addEventListener('click', () => {
        if (prefersReduced) return;
        stopBlinkLoop();
        const durations = getBlinkDurations();
        playBlinkOnce(durations).finally(() => {
            blinkTimer = window.setTimeout(startBlinkLoop, durations.total);
        });
    });
});
