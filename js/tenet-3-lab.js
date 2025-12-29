// Tenet 3 Lab (reset): static slicing only (no scroll behavior)

document.addEventListener('DOMContentLoaded', () => {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const clamp01 = (v) => clamp(v, 0, 1);
    const lerp = (a, b, t) => a + ((b - a) * clamp01(t));

    const config = {
        sliceHeightPx: 60,
        peakPx: 5,
        extraSlices: 20,
        gapExtraPx: 200,
        xOffsetPx: 400,
        blendVariation: -100,
        jitterX: 100,
        jitterY: 28,
    };

    const TENET_SCROLL_PX = 700;

    const section = document.querySelector('section[aria-label="Core Tenets"]');
    if (!section) return;

    const content = section.querySelector('.split-content');
    if (!content) return;

    const ensureTenetSteps = () => {
        if (content.querySelector('.tenet-steps')) return;

        const tenets = Array.from(content.querySelectorAll('h2.tenet')).filter((t) => !t.closest('.tenet-steps'));
        if (!tenets.length) return;

        const stepsEl = document.createElement('div');
        stepsEl.className = 'tenet-steps';
        stepsEl.setAttribute('aria-hidden', 'true');

        for (const t of tenets) {
            const step = document.createElement('div');
            step.className = 'tenet-step';
            step.appendChild(t);

            const gap = document.createElement('div');
            gap.className = 'tenet-gap';
            gap.setAttribute('aria-hidden', 'true');

            stepsEl.appendChild(step);
            stepsEl.appendChild(gap);
        }

        const label = content.querySelector('.section-label');
        if (label && label.nextSibling) {
            content.insertBefore(stepsEl, label.nextSibling);
        } else {
            content.appendChild(stepsEl);
        }
    };

    ensureTenetSteps();

    const tenet = content.querySelector('.tenet-step .tenet') || content.querySelector('.tenet');
    if (!tenet) return;

    const tenetStep = tenet.closest('.tenet-step');
    const steps = tenetStep ? tenetStep.parentElement : null;

    const readStickyTopPx = (el, fallbackPx) => {
        if (!el) return fallbackPx;
        const top = window.getComputedStyle(el).top;
        const px = parseFloat(top);
        return Number.isFinite(px) ? px : fallbackPx;
    };

    const originalHtml = tenet.innerHTML;
    const biasHtml = (() => {
        const idx = originalHtml.search(/<br\s*\/?\s*>/i);
        if (idx >= 0) return originalHtml.slice(0, idx).trim() || 'BIAS';
        return originalHtml.trim() || 'BIAS';
    })();

    const injectPanelStyles = () => {
        if (document.getElementById('tenet-3-lab-styles')) return;
        const style = document.createElement('style');
        style.id = 'tenet-3-lab-styles';
        style.textContent = `
            .tenet-lab {
                position: fixed;
                left: 16px;
                bottom: 16px;
                z-index: 10001;
                width: min(420px, calc(100vw - 32px));
                border: 1px solid var(--color-foreground);
                border-radius: 16px;
                padding: 12px;
                background: rgb(var(--color-foreground-rgb) / 8%);
                backdrop-filter: blur(10px);
            }
            .tenet-lab__title {
                font-size: 14px;
                line-height: 1.2;
                font-weight: 700;
                margin-bottom: 10px;
            }
            .tenet-lab__row {
                display: grid;
                grid-template-columns: 140px 1fr;
                gap: 10px;
                align-items: center;
                padding: 6px 0;
                font-size: 12px;
                line-height: 1.2;
            }
            .tenet-lab__label { opacity: 0.9; }
            .tenet-lab__right {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .tenet-lab__value {
                font-variant-numeric: tabular-nums;
                opacity: 0.9;
                min-width: 64px;
                text-align: right;
            }
            .tenet-lab input[type="range"] { width: 100%; }
        `;
        document.head.appendChild(style);
    };

    const makeControlRow = (labelText, inputEl, valueEl) => {
        const row = document.createElement('label');
        row.className = 'tenet-lab__row';

        const label = document.createElement('span');
        label.className = 'tenet-lab__label';
        label.textContent = labelText;

        const right = document.createElement('span');
        right.className = 'tenet-lab__right';
        right.appendChild(inputEl);
        if (valueEl) right.appendChild(valueEl);

        row.appendChild(label);
        row.appendChild(right);
        return row;
    };

    const createRange = ({ min, max, step, value }) => {
        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(min);
        input.max = String(max);
        input.step = String(step);
        input.value = String(value);
        return input;
    };

    const createValue = (text = '') => {
        const v = document.createElement('span');
        v.className = 'tenet-lab__value';
        v.textContent = text;
        return v;
    };

    const buildPresetString = () => {
        const s = Math.round(Number(config.sliceHeightPx) || 0);
        const p = Math.round(Number(config.peakPx) || 0);
        const e = Math.round(Number(config.extraSlices) || 0);
        const g = Math.round(Number(config.gapExtraPx) || 0);
        const x = Math.round(Number(config.xOffsetPx) || 0);
        const b = Math.round(Number(config.blendVariation) || 0);
        const jx = Math.round(Number(config.jitterX) || 0);
        const jy = Math.round(Number(config.jitterY) || 0);
        return `t3(slice=${s},peak=${p},extra=${e},gap=${g},x=${x},blend=${b},jx=${jx},jy=${jy})`;
    };

    const parsePresetString = (text) => {
        if (!text) return null;
        const match = text.match(/t3\(.*\)/i);
        const body = match ? match[0].replace(/^t3\(|\)$/gi, '') : text;
        const pairs = body.split(/[,\s]+/).filter(Boolean);
        const next = {};
        for (const pair of pairs) {
            const [k, vRaw] = pair.split('=');
            if (!k || vRaw === undefined) continue;
            const v = Number(vRaw);
            if (!Number.isFinite(v)) continue;
            switch (k.toLowerCase()) {
                case 'slice': next.sliceHeightPx = v; break;
                case 'peak': next.peakPx = v; break;
                case 'extra': next.extraSlices = v; break;
                case 'gap': next.gapExtraPx = v; break;
                case 'x': next.xOffsetPx = v; break;
                case 'blend': next.blendVariation = v; break;
                case 'jx': next.jitterX = v; break;
                case 'jy': next.jitterY = v; break;
                default: break;
            }
        }
        return next;
    };

    const panel = document.createElement('div');
    panel.className = 'tenet-lab';
    panel.setAttribute('aria-label', 'Tenet 3 Lab Controls');

    const title = document.createElement('div');
    title.className = 'tenet-lab__title';
    title.textContent = 'Tenet 3 Lab (Static Slices)';
    panel.appendChild(title);

    const sliceVal = createValue(`${config.sliceHeightPx}px`);
    const slice = createRange({ min: 8, max: 120, step: 1, value: config.sliceHeightPx });
    panel.appendChild(makeControlRow('Slice height', slice, sliceVal));

    const peakVal = createValue(`${config.peakPx}px`);
    const peak = createRange({ min: 0, max: 60, step: 1, value: config.peakPx });
    panel.appendChild(makeControlRow('Initial peak', peak, peakVal));

    const gapVal = createValue(`${config.gapExtraPx}px`);
    const gap = createRange({ min: 0, max: 800, step: 10, value: config.gapExtraPx });
    panel.appendChild(makeControlRow('Extra gap above', gap, gapVal));

    const offsetVal = createValue(`${config.xOffsetPx}px`);
    const offset = createRange({ min: -400, max: 400, step: 1, value: config.xOffsetPx });
    panel.appendChild(makeControlRow('Mid stack X offset', offset, offsetVal));

    const blendVal = createValue(`${config.blendVariation}`);
    const blend = createRange({ min: -100, max: 100, step: 1, value: config.blendVariation });
    panel.appendChild(makeControlRow('Blend variation', blend, blendVal));

    const jitterXVal = createValue(`${config.jitterX}`);
    const jitterX = createRange({ min: 0, max: 100, step: 1, value: config.jitterX });
    panel.appendChild(makeControlRow('Jitter X', jitterX, jitterXVal));

    const jitterYVal = createValue(`${config.jitterY}`);
    const jitterY = createRange({ min: 0, max: 100, step: 1, value: config.jitterY });
    panel.appendChild(makeControlRow('Jitter Y', jitterY, jitterYVal));

    const presetInput = document.createElement('input');
    presetInput.type = 'text';
    presetInput.value = buildPresetString();
    presetInput.setAttribute('aria-label', 'Tenet 3 preset');
    presetInput.style.width = '100%';

    const presetApply = document.createElement('button');
    presetApply.type = 'button';
    presetApply.textContent = 'Apply';
    presetApply.style.minWidth = '72px';

    const presetRow = makeControlRow('Preset', presetInput, presetApply);
    panel.appendChild(presetRow);

    document.body.appendChild(panel);
    injectPanelStyles();

    // Build DOM
    tenet.dataset.slicesLabInit = '1';
    tenet.classList.add('tenet--strips20');
    tenet.innerHTML = '';

    const phraseSizer = document.createElement('span');
    phraseSizer.className = 'tenet-strips20__sizer';
    phraseSizer.innerHTML = originalHtml;
    tenet.appendChild(phraseSizer);

    const phraseStrips = document.createElement('span');
    phraseStrips.className = 'tenet-strips20';
    phraseStrips.setAttribute('aria-hidden', 'true');
    tenet.appendChild(phraseStrips);

    const biasStack = document.createElement('span');
    biasStack.className = 'tenet-biasStack';
    biasStack.setAttribute('aria-hidden', 'true');
    tenet.appendChild(biasStack);

    const layoutSteps = () => {
        if (!steps || !tenetStep) return;

        const vh = window.innerHeight || 0;
        const stickyTopPx = readStickyTopPx(tenet, vh / 2);

        // Push the entire block down by the user-selected gap plus the bias stack height,
        // so tall slices never peek above the reserved space.
        const sliceHCurrent = Math.max(1, Number(config.sliceHeightPx) || 44);
        const extraCurrent = Math.max(0, Math.min(60, Math.round(Number(config.extraSlices) || 20)));
        const biasHeight = extraCurrent * sliceHCurrent;
        const gapExtra = Math.max(0, Number(config.gapExtraPx) || 0);
        const offsetTop = gapExtra + biasHeight;
        steps.style.marginTop = `${offsetTop}px`;

        steps.style.paddingTop = `${Math.max(0, Math.ceil(stickyTopPx))}px`;

        const tenetHeight = Math.ceil(tenet.getBoundingClientRect().height);
        tenetStep.style.setProperty('--tenet-scroll', `${TENET_SCROLL_PX}px`);
        tenetStep.style.setProperty('--tenet-height', `${tenetHeight}px`);

        const gap = tenetStep.nextElementSibling;
        if (gap && gap.classList && gap.classList.contains('tenet-gap')) {
            const gapPx = Math.max(0, Math.ceil(stickyTopPx - tenetHeight)) + TENET_SCROLL_PX + gapExtra;
            gap.style.height = `${gapPx}px`;
        }
    };

    const rebuild = () => {
        const sliceH = Math.max(1, Number(config.sliceHeightPx) || 44);
        const extra = Math.max(0, Math.min(60, Math.round(Number(config.extraSlices) || 20)));
        const peakPx = clamp(Number(config.peakPx) || 0, 0, sliceH);

        const blendT = (t) => {
            const v = Math.max(-100, Math.min(100, Number(config.blendVariation) || 0));
            const mag = Math.abs(v) / 100;
            const exp = 1 + (mag * 2); // 1..3
            if (v > 0) return Math.pow(t, exp); // holds low, catches up late
            if (v < 0) return 1 - Math.pow(1 - t, exp); // jumps early, eases out
            return t;
        };

        // Phrase slices
        const rect = phraseSizer.getBoundingClientRect();
        const phraseH = Math.max(1, rect.height);
        const phraseCount = Math.max(1, Math.ceil(phraseH / sliceH));

        tenet.style.setProperty('--slice-h', `${sliceH.toFixed(2)}px`);
        tenet.style.setProperty('--strip20-h', `${sliceH.toFixed(2)}px`);
        tenet.style.setProperty('--strips20-h', `${(phraseCount * sliceH).toFixed(2)}px`);
        tenet.style.setProperty('--bias-count', String(extra));
        tenet.style.setProperty('--bias-h', `${(extra * sliceH).toFixed(2)}px`);

        phraseStrips.textContent = '';
        for (let i = 0; i < phraseCount; i += 1) {
            const row = document.createElement('span');
            row.className = 'tenet-strip20';
            row.style.setProperty('--strip20-i', String(i));

            const inner = document.createElement('span');
            inner.className = 'tenet-strip20__text';
            inner.innerHTML = originalHtml;
            // Normal slicing: each strip shows its own band.
            inner.style.top = `${(-i * sliceH).toFixed(2)}px`;
            row.appendChild(inner);

            const tRaw = phraseCount <= 1 ? 1 : (i / (phraseCount - 1));
            const tVar = blendT(tRaw);
            const jitterXN = Math.max(0, Math.min(100, Number(config.jitterX) || 0)) / 100;
            const jitterYN = Math.max(0, Math.min(100, Number(config.jitterY) || 0)) / 100;
            const jitterRangeX = 0.35 * jitterXN;
            const jitterRangeY = 0.35 * jitterYN;
            const jitterFalloff = 1 - tVar; // taper jitter to 0 at the bottom slice
            const jitterDeltaX = (Math.random() * 2 - 1) * jitterRangeX * jitterFalloff;
            const jitterDeltaY = (Math.random() * 2 - 1) * jitterRangeY * jitterFalloff;
            const tJitteredX = clamp01(tVar + jitterDeltaX);
            const tJitteredY = clamp01(tVar + jitterDeltaY);

            const xOffset = lerp(config.xOffsetPx, 0, tJitteredX);
            const yOffset = jitterDeltaY * sliceH;
            row.style.transform = `translate(${xOffset.toFixed(2)}px, ${yOffset.toFixed(2)}px)`;

            phraseStrips.appendChild(row);
        }

        // Bias extra slices above
        biasStack.textContent = '';
        for (let i = 0; i < extra; i += 1) {
            const tRaw = extra <= 1 ? 1 : (i / (extra - 1));
            const tVar = blendT(tRaw);
            const jitterXN = Math.max(0, Math.min(100, Number(config.jitterX) || 0)) / 100;
            const jitterYN = Math.max(0, Math.min(100, Number(config.jitterY) || 0)) / 100;
            const jitterRangeX = 0.35 * jitterXN; // cap jitter so it disrupts without exploding
            const jitterRangeY = 0.35 * jitterYN;
            const jitterDeltaX = (Math.random() * 2 - 1) * jitterRangeX;
            const jitterDeltaY = (Math.random() * 2 - 1) * jitterRangeY;
            const tJitteredX = clamp01(tVar + jitterDeltaX);
            const tJitteredY = clamp01(tVar + jitterDeltaY);

            const visible = lerp(peakPx, sliceH, tJitteredY);
            const xOffset = lerp(config.xOffsetPx, 0, tJitteredX);

            const row = document.createElement('span');
            row.className = 'tenet-biasSlice';
            row.style.setProperty('--bias-i', String(i));
            row.style.setProperty('--bias-visible', `${visible.toFixed(2)}px`);
            row.style.setProperty('--bias-offset', `${(sliceH - visible).toFixed(2)}px`);
            row.style.transform = `translateX(${xOffset.toFixed(2)}px)`;

            const visibleWrap = document.createElement('span');
            visibleWrap.className = 'tenet-biasSlice__visible';

            const text = document.createElement('span');
            text.className = 'tenet-biasSlice__text';
            text.innerHTML = biasHtml;

            visibleWrap.appendChild(text);
            row.appendChild(visibleWrap);
            biasStack.appendChild(row);
        }

        // Update peak slider max to keep it intuitive relative to slice height.
        peak.max = String(Math.max(0, Math.round(sliceH)));

        // Keep preset text in sync with current settings.
        presetInput.value = buildPresetString();

        layoutSteps();
    };

    slice.addEventListener('input', () => {
        config.sliceHeightPx = Number(slice.value) || config.sliceHeightPx;
        sliceVal.textContent = `${Math.round(config.sliceHeightPx)}px`;
        // Keep peak clamped so blends remain smooth.
        config.peakPx = clamp(Number(config.peakPx) || 0, 0, Number(config.sliceHeightPx) || 44);
        peak.value = String(config.peakPx);
        peakVal.textContent = `${Math.round(config.peakPx)}px`;
        rebuild();
    });

    peak.addEventListener('input', () => {
        config.peakPx = Number(peak.value) || 0;
        peakVal.textContent = `${Math.round(config.peakPx)}px`;
        rebuild();
    });

    gap.addEventListener('input', () => {
        config.gapExtraPx = Number(gap.value) || 0;
        gapVal.textContent = `${Math.round(config.gapExtraPx)}px`;
        rebuild();
    });

    offset.addEventListener('input', () => {
        config.xOffsetPx = Number(offset.value) || 0;
        offsetVal.textContent = `${Math.round(config.xOffsetPx)}px`;
        rebuild();
    });

    blend.addEventListener('input', () => {
        config.blendVariation = Number(blend.value) || 0;
        blendVal.textContent = `${Math.round(config.blendVariation)}`;
        rebuild();
    });

    jitterX.addEventListener('input', () => {
        config.jitterX = Number(jitterX.value) || 0;
        jitterXVal.textContent = `${Math.round(config.jitterX)}`;
        rebuild();
    });

    jitterY.addEventListener('input', () => {
        config.jitterY = Number(jitterY.value) || 0;
        jitterYVal.textContent = `${Math.round(config.jitterY)}`;
        rebuild();
    });

    presetApply.addEventListener('click', () => {
        const parsed = parsePresetString(presetInput.value || '');
        if (!parsed) return;

        if (parsed.sliceHeightPx !== undefined) config.sliceHeightPx = parsed.sliceHeightPx;
        if (parsed.peakPx !== undefined) config.peakPx = parsed.peakPx;
        if (parsed.extraSlices !== undefined) config.extraSlices = parsed.extraSlices;
        if (parsed.gapExtraPx !== undefined) config.gapExtraPx = parsed.gapExtraPx;
        if (parsed.xOffsetPx !== undefined) config.xOffsetPx = parsed.xOffsetPx;
        if (parsed.blendVariation !== undefined) config.blendVariation = parsed.blendVariation;
        if (parsed.jitterX !== undefined) config.jitterX = parsed.jitterX;
        if (parsed.jitterY !== undefined) config.jitterY = parsed.jitterY;

        slice.value = String(config.sliceHeightPx);
        sliceVal.textContent = `${Math.round(config.sliceHeightPx)}px`;
        peak.value = String(config.peakPx);
        peakVal.textContent = `${Math.round(config.peakPx)}px`;
        gap.value = String(config.gapExtraPx);
        gapVal.textContent = `${Math.round(config.gapExtraPx)}px`;
        offset.value = String(config.xOffsetPx);
        offsetVal.textContent = `${Math.round(config.xOffsetPx)}px`;
        blend.value = String(config.blendVariation);
        blendVal.textContent = `${Math.round(config.blendVariation)}`;
        jitterX.value = String(config.jitterX);
        jitterXVal.textContent = `${Math.round(config.jitterX)}`;
        jitterY.value = String(config.jitterY);
        jitterYVal.textContent = `${Math.round(config.jitterY)}`;

        rebuild();
    });

    window.addEventListener('resize', rebuild);

    rebuild();
});
