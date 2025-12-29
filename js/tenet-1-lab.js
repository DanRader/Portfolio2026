// Tenet 1 Lab: isolated iteration playground (no dependencies on the main site script)

document.addEventListener('DOMContentLoaded', () => {
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    const section = document.querySelector('section[aria-label="Core Tenets"]');
    if (!section) return;

    const content = section.querySelector('.split-content');
    if (!content) return;

    // --- SVG grain filter wiring (optional) ---
    const grainFilterId = 'tenet-grain';
    const turbulence = document.querySelector(`#${grainFilterId} feTurbulence`);
    const grainMix = document.querySelector(`#${grainFilterId} feComposite#tenet-grain-mix`);
    const grainFuncA = document.querySelector(`#${grainFilterId} feFuncA#tenet-grain-contrast-a`);
    const grainDither = document.querySelector(`#${grainFilterId} feComposite#tenet-grain-dither`);

    // --- Config (live-editable via UI) ---
    const config = {
        // Timing model (requested): total scroll height is the sum of
        // negative -> 0 -> positive segments.
        // - negPosPx: how many px to go from -1 (full) to 0, and from 0 to +1
        // - zeroHoldPx: how many px to hold at 0 (crisp midpoint)
        negPosPx: 510,
        zeroHoldPx: 420,
        extraGapPx: 200,
        layers: 9,
        maxBlurPx: 45,
        endOpacity: 0.08,
        negEdgeOpacityDelta: 1,
        negEdgeBlurDeltaPx: -25,
        stretchX: 0.8,
        originXPercent: 16,
        originYPercent: 100,
        clipOverlap: false,
        spreadPx: 59,
        startOffsetVh: 20.5,
        grainEnabled: true,
        grainFrequency: 1.04,
        grainScale: 0.95,
        grainContrast: 1.3,
    };

    // Filled once the UI is constructed (used for copyable shorthand readouts).
    let originPresetInput = null;
    let fullPresetInput = null;

    const buildPresetString = () => {
        const seg = Math.round(Number(config.negPosPx) || 0);
        const zero = Math.round(Number(config.zeroHoldPx) || 0);
        const copies = Math.round(Number(config.layers) || 1);
        const spread = Math.round(Number(config.spreadPx) || 0);
        const offset = Number(config.startOffsetVh) || 0;
        const endOp = Number(config.endOpacity) ?? 1;
        const negOpD = Number(config.negEdgeOpacityDelta) || 0;
        const stretch = Number(config.stretchX) || 0;
        const ox = Math.round(Number(config.originXPercent) || 0);
        const oy = Math.round(Number(config.originYPercent) || 0);
        const clip = config.clipOverlap ? 1 : 0;
        const blur = Number(config.maxBlurPx) || 0;
        const negBlurD = Number(config.negEdgeBlurDeltaPx) || 0;
        const gOn = config.grainEnabled ? 1 : 0;
        const ga = Number(config.grainScale) || 0;
        const gf = Number(config.grainFrequency) || 0;
        const gc = Number(config.grainContrast) || 0;

        return `t1(seg=${seg},zero=${zero},copies=${copies},spread=${spread},offset=${offset},endOp=${endOp},negOpD=${negOpD},stretch=${stretch},ox=${ox},oy=${oy},clip=${clip},blur=${blur},negBlurD=${negBlurD},grain=${gOn},ga=${ga},gf=${gf},gc=${gc})`;
    };

    const syncPresetReadout = () => {
        if (fullPresetInput) fullPresetInput.value = buildPresetString();
    };

    const getTotalScrollPx = () => {
        const seg = Math.max(0, Number(config.negPosPx) || 0);
        const zero = Math.max(0, Number(config.zeroHoldPx) || 0);
        return Math.max(1, (2 * seg) + zero);
    };

    // --- Build steps container (tenet-step + tenet-gap) ---
    const ensureTenetSteps = () => {
        if (content.querySelector('.tenet-steps')) return;

        const tenets = Array.from(content.querySelectorAll('h2.tenet')).filter((t) => !t.closest('.tenet-steps'));
        if (!tenets.length) return;

        const steps = document.createElement('div');
        steps.className = 'tenet-steps';
        steps.setAttribute('aria-hidden', 'true');

        for (const tenet of tenets) {
            const step = document.createElement('div');
            step.className = 'tenet-step';
            step.appendChild(tenet);

            const gap = document.createElement('div');
            gap.className = 'tenet-gap';
            gap.setAttribute('aria-hidden', 'true');

            steps.appendChild(step);
            steps.appendChild(gap);
        }

        const label = content.querySelector('.section-label');
        if (label && label.nextSibling) {
            content.insertBefore(steps, label.nextSibling);
        } else {
            content.appendChild(steps);
        }
    };

    const readStickyTopPx = (el, fallbackPx) => {
        if (!el) return fallbackPx;
        const top = window.getComputedStyle(el).top;
        // Handles e.g. "40vh" by resolving via computed style (should be px here).
        const px = parseFloat(top);
        return Number.isFinite(px) ? px : fallbackPx;
    };

    // --- First tenet stack (layered blur/spread) ---
    const ensureFirstTenetStack = () => {
        const firstTenet = section.querySelector('.tenet-steps .tenet-step:first-child .tenet');
        if (!firstTenet) return;

        const existingText = (firstTenet.dataset.tenetStackText || '').trim();
        const initialText = (firstTenet.textContent || '').trim();
        const text = existingText || initialText;
        if (!text) return;

        // If we already built the stack with the same layer count, do nothing.
        const builtLayers = Number(firstTenet.dataset.tenetStackLayers || 0);
        if (firstTenet.dataset.tenetStackInit === '1' && builtLayers === config.layers) return;

        firstTenet.dataset.tenetStackInit = '1';
        firstTenet.dataset.tenetStackText = text;
        firstTenet.dataset.tenetStackLayers = String(config.layers);
        firstTenet.classList.add('tenet--stack');

        // Rebuild contents
        firstTenet.textContent = '';

        const sizer = document.createElement('span');
        sizer.className = 'tenet-stack__sizer';
        sizer.textContent = text;
        firstTenet.appendChild(sizer);

        for (let i = 0; i < config.layers; i += 1) {
            const layer = document.createElement('span');
            layer.className = 'tenet-stack__layer';
            layer.setAttribute('aria-hidden', 'true');
            layer.textContent = text;
            layer.style.transformOrigin = `${Math.max(0, Math.min(100, Number(config.originXPercent) || 50))}% ${Math.max(0, Math.min(100, Number(config.originYPercent) || 100))}%`;
            firstTenet.appendChild(layer);
        }
    };

    const applyTransformOriginToStack = () => {
        const state = getStackState();
        if (!state) return;

        const x = Math.max(0, Math.min(100, Number(config.originXPercent) || 0));
        const y = Math.max(0, Math.min(100, Number(config.originYPercent) || 0));
        const origin = `${x}% ${y}%`;

        if (originPresetInput) {
            originPresetInput.value = `origin=${Math.round(x)},${Math.round(y)}`;
        }

        syncPresetReadout();

        for (const layer of state.layers) {
            layer.style.transformOrigin = origin;
        }
    };

    const getStackState = () => {
        const tenet = section.querySelector('h2.tenet.tenet--stack');
        if (!tenet) return null;
        const step = tenet.closest('.tenet-step');
        if (!step) return null;
        const layers = Array.from(tenet.querySelectorAll('.tenet-stack__layer'));
        if (!layers.length) return null;
        return { tenet, step, layers };
    };

    // --- Layout (step height + gap) ---
    const layout = () => {
        const steps = section.querySelector('.tenet-steps');
        if (!steps) return;

        const totalScrollPx = getTotalScrollPx();
        steps.style.setProperty('--tenet-scroll', `${totalScrollPx}px`);

        const halfVh = (window.innerHeight || 0) / 2;
        const stepEls = Array.from(steps.querySelectorAll('.tenet-step'));

        // Ensure we actually *start* in negative state when the section is reached.
        // Without some lead-in space, the first step can begin already past the sticky trigger
        // (making it feel like it's already scrolled).
        const firstTenet = steps.querySelector('.tenet-step .tenet');
        if (firstTenet) {
            const stickyTopPx = readStickyTopPx(firstTenet, halfVh);
            steps.style.paddingTop = `${Math.max(0, Math.ceil(stickyTopPx))}px`;
        }

        for (const step of stepEls) {
            const tenet = step.querySelector('.tenet');
            if (!tenet) continue;

            const h = Math.ceil(tenet.getBoundingClientRect().height);
            step.style.setProperty('--tenet-height', `${h}px`);

            const stickyTopPx = readStickyTopPx(tenet, halfVh);

            const gap = step.nextElementSibling;
            if (gap && gap.classList && gap.classList.contains('tenet-gap')) {
                const gapPx = Math.max(0, Math.ceil(stickyTopPx - h)) + totalScrollPx + config.extraGapPx;
                gap.style.height = `${gapPx}px`;
            }
        }

    };

    // --- Animation update ---
    const updateFilterControls = () => {
        if (turbulence) turbulence.setAttribute('baseFrequency', String(config.grainFrequency));
        // Note: composite strengths are driven dynamically in `update()`.

        const c = Math.max(0, Number(config.grainContrast) || 0);
        if (grainFuncA) grainFuncA.setAttribute('slope', String(c));
    };

    const layerFilter = (blurPx) => {
        // Per-layer blur is done via CSS so we can vary blur per copy.
        // Grain (SVG filter) runs on the already-blurred result.
        const blurPart = `blur(${Math.max(0, blurPx).toFixed(2)}px)`;
        if (!config.grainEnabled) return blurPart;
        return `${blurPart} url(#${grainFilterId})`;
    };

    const update = () => {
        const state = getStackState();
        if (!state) return;

        const { tenet, step, layers } = state;

        const vh = window.innerHeight || 0;
        const stickyTopPx = readStickyTopPx(tenet, vh / 2);
        const stepTop = step.getBoundingClientRect().top;
        // Timing model (requested): total scroll is the sum of 3 states.
        // -1 .. 0 consumes `negPosPx`
        //  0 hold consumes `zeroHoldPx`
        //  0 .. +1 consumes `negPosPx`
        // This guarantees the very top of the step is always full negative (-1).
        const segPx = Math.max(0, Number(config.negPosPx) || 0);
        const zeroHoldPx = Math.max(0, Number(config.zeroHoldPx) || 0);
        const totalScrollPx = Math.max(1, (2 * segPx) + zeroHoldPx);

        const distPx = Math.max(0, Math.min(totalScrollPx, stickyTopPx - stepTop));

        let s;
        if (segPx <= 0) {
            // Degenerate case: no ramp segments.
            if (distPx <= 0) s = -1;
            else if (distPx < zeroHoldPx) s = 0;
            else s = 1;
        } else if (distPx < segPx) {
            // Negative state phase (-1 -> 0)
            const t = distPx / segPx;
            s = -1 + t;
        } else if (distPx < segPx + zeroHoldPx) {
            // 0 state hold
            s = 0;
        } else {
            // Positive state phase (0 -> +1)
            const t = (distPx - segPx - zeroHoldPx) / segPx;
            s = Math.max(0, Math.min(1, t));
        }

        // Spread collapses to 0 at the 0 state, and returns to 1 at both ends.
        const spread = Math.abs(s);
        const spreadPos = spread * spread;

        // Blur is state-driven (requested):
        // negative: 100% blur, 0: 0 blur, positive: 100% blur.
        const blurPx = config.maxBlurPx * spread;

        // Make grain/texture affect only the blur:
        // scale the grain strength down to 0 at the crisp midpoint.
        if (config.grainEnabled) {
            const maxBlur = Math.max(0.0001, Number(config.maxBlurPx) || 0);
            const blurStrength = Math.max(0, Math.min(1, blurPx / maxBlur));

            // Inject noise into the blur alpha before quantization.
            if (grainDither) {
                const strength = Math.max(0, Math.min(1, Number(config.grainScale) || 0));
                const dither = strength * blurStrength;
                grainDither.setAttribute('k3', String(dither.toFixed(4)));
            }

            // Drive stipple mix amount only when blurred.
            if (grainMix) {
                const strength = Math.max(0, Math.min(1, Number(config.grainScale) || 0));
                const a = strength * blurStrength;
                grainMix.setAttribute('k2', String((1 - a).toFixed(4)));
                grainMix.setAttribute('k3', String(a.toFixed(4)));
            }
        }

        const baseOffsetPx = (vh * config.startOffsetVh) / 100;
        const centerIndex = Math.floor((layers.length - 1) / 2);

        const edgePhase = clamp01(Math.abs(s));
        const layerCount = Math.max(1, layers.length);

        // Opacity scaling: at the ends (|s|=1) apply endOpacity, at center (|s|=0) force 1.
        const endOpacity = Math.max(0, Math.min(1, Number(config.endOpacity)));
        const endOpacityFactor = 1 - ((1 - endOpacity) * spread);

        const negOpacityDelta = Math.max(-1, Math.min(1, Number(config.negEdgeOpacityDelta) || 0));
        const negBlurDeltaPx = Number(config.negEdgeBlurDeltaPx) || 0;

        // Stretch experiment (more performant than letter-spacing).
        const maxStretchX = Math.max(0, Number(config.stretchX) || 0);

        for (let i = 0; i < layers.length; i += 1) {
            const layer = layers[i];
            const centered = i - ((layers.length - 1) / 2);
            const x = 0;
            const y = (centered * config.spreadPx * spreadPos) + (baseOffsetPx * spreadPos);
            const baseOpacity = (i === centerIndex ? 1 : spread) * endOpacityFactor;

            // t=0 is first copy, t=1 is last copy.
            const t = layerCount <= 1 ? 0 : (i / (layerCount - 1));
            const negOpacityFactor = clamp01(1 - (t * negOpacityDelta * edgePhase));
            const opacity = baseOpacity * negOpacityFactor;

            const layerBlurPx = blurPx + (t * negBlurDeltaPx * edgePhase);

            // Flip the stretch gradient between - and + phases.
            let stretchT;
            if (s < 0) stretchT = 1 - t;
            else if (s > 0) stretchT = t;
            else stretchT = 0;

            const stretchFactor = 1 + (maxStretchX * edgePhase * clamp01(stretchT));

            layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scaleX(${stretchFactor.toFixed(4)})`;
            layer.style.filter = layerFilter(layerBlurPx);
            layer.style.opacity = `${opacity.toFixed(3)}`;

            // Ensure we never leave old letter-spacing behind.
            layer.style.letterSpacing = '';

            // Optional clipping to avoid overlap between copies.
            if (config.clipOverlap && layerCount > 1) {
                const slice = 100 / layerCount;
                const topPct = i * slice;
                const bottomPct = 100 - ((i + 1) * slice);
                layer.style.clipPath = `inset(${topPct.toFixed(3)}% 0 ${bottomPct.toFixed(3)}% 0)`;
            } else {
                layer.style.clipPath = '';
            }
        }
    };

    // --- Minimal UI ---
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

    const makeSection = (titleText) => {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'tenet-lab__section';

        const titleEl = document.createElement('div');
        titleEl.className = 'tenet-lab__section-title';
        titleEl.textContent = titleText;
        sectionEl.appendChild(titleEl);

        return sectionEl;
    };

    const makeAccordion = (titleText, { open = false } = {}) => {
        const details = document.createElement('details');
        details.className = 'tenet-lab__accordion';
        details.open = Boolean(open);

        const summary = document.createElement('summary');
        summary.className = 'tenet-lab__accordion-title';
        summary.textContent = titleText;

        details.appendChild(summary);
        return details;
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

    const createValue = () => {
        const v = document.createElement('span');
        v.className = 'tenet-lab__value';
        v.textContent = '';
        return v;
    };

    const panel = document.createElement('div');
    panel.className = 'tenet-lab';
    panel.setAttribute('aria-label', 'Tenet Lab Controls');

    const title = document.createElement('div');
    title.className = 'tenet-lab__title';
    title.textContent = 'Tenet 1 Lab';
    panel.appendChild(title);

    // --- Controls ---
    const totalVal = document.createElement('span');
    totalVal.className = 'tenet-lab__value';
    totalVal.textContent = `${getTotalScrollPx()}px`;

    const segVal = createValue();
    const seg = createRange({ min: 0, max: 2200, step: 10, value: config.negPosPx });
    segVal.textContent = `${config.negPosPx}px`;

    const zeroVal = createValue();
    const zero = createRange({ min: 0, max: 900, step: 10, value: config.zeroHoldPx });
    zeroVal.textContent = `${config.zeroHoldPx}px`;

    const spreadVal = createValue();
    const spread = createRange({ min: 0, max: 140, step: 1, value: config.spreadPx });
    spreadVal.textContent = `${config.spreadPx}px`;

    const offsetVal = createValue();
    const offset = createRange({ min: 0, max: 30, step: 0.5, value: config.startOffsetVh });
    offsetVal.textContent = `${config.startOffsetVh}vh`;

    const endOpacityVal = createValue();
    const endOpacity = createRange({ min: 0, max: 1, step: 0.01, value: config.endOpacity });
    endOpacityVal.textContent = String(config.endOpacity);

    const blurVal = createValue();
    const blur = createRange({ min: 0, max: 60, step: 0.5, value: config.maxBlurPx });
    blurVal.textContent = `${config.maxBlurPx}px`;

    const steps = document.createElement('input');
    steps.type = 'number';
    steps.min = '1';
    steps.max = '30';
    steps.step = '1';
    steps.value = String(config.layers);

    const negOpacityDeltaVal = createValue();
    const negOpacityDelta = createRange({ min: -1, max: 1, step: 0.01, value: config.negEdgeOpacityDelta });
    negOpacityDeltaVal.textContent = String(config.negEdgeOpacityDelta);

    const negBlurDeltaVal = createValue();
    const negBlurDelta = createRange({ min: -60, max: 60, step: 0.5, value: config.negEdgeBlurDeltaPx });
    negBlurDeltaVal.textContent = `${config.negEdgeBlurDeltaPx}px`;

    const stretchVal = createValue();
    const stretch = createRange({ min: 0, max: 0.8, step: 0.01, value: config.stretchX });
    stretchVal.textContent = `+${Math.round(Number(config.stretchX) * 100)}%`;

    const originXVal = createValue();
    const originX = createRange({ min: 0, max: 100, step: 1, value: config.originXPercent });
    originXVal.textContent = `${Math.round(Number(config.originXPercent))}%`;

    const originYVal = createValue();
    const originY = createRange({ min: 0, max: 100, step: 1, value: config.originYPercent });
    originYVal.textContent = `${Math.round(Number(config.originYPercent))}%`;

    const originPreset = document.createElement('input');
    originPreset.type = 'text';
    originPreset.readOnly = true;
    originPreset.spellcheck = false;
    originPreset.autocapitalize = 'off';
    originPreset.autocomplete = 'off';
    originPreset.value = `origin=${Math.round(Number(config.originXPercent))},${Math.round(Number(config.originYPercent))}`;

    // Convenience: click-to-select for easy copy.
    originPreset.addEventListener('click', () => originPreset.select());

    const fullPreset = document.createElement('textarea');
    fullPreset.rows = 2;
    fullPreset.readOnly = true;
    fullPreset.spellcheck = false;
    fullPreset.autocapitalize = 'off';
    fullPreset.autocomplete = 'off';
    fullPreset.value = buildPresetString();
    fullPreset.addEventListener('click', () => fullPreset.select());

    const clipToggle = document.createElement('input');
    clipToggle.type = 'checkbox';
    clipToggle.checked = Boolean(config.clipOverlap);

    const grainScaleVal = createValue();
    const grainScale = createRange({ min: 0, max: 1, step: 0.01, value: config.grainScale });
    grainScaleVal.textContent = String(config.grainScale);

    const grainFreqVal = createValue();
    const grainFreq = createRange({ min: 0.02, max: 1.5, step: 0.02, value: config.grainFrequency });
    grainFreqVal.textContent = String(config.grainFrequency);

    const grainContrastVal = createValue();
    const grainContrast = createRange({ min: 0.5, max: 6, step: 0.1, value: config.grainContrast });
    grainContrastVal.textContent = String(config.grainContrast);

    // --- Grouped layout ---
    const timing = makeSection('Timing');
    timing.appendChild(makeControlRow('Total scroll', totalVal, null));
    timing.appendChild(makeControlRow('± segment', seg, segVal));
    timing.appendChild(makeControlRow('0 hold', zero, zeroVal));
    panel.appendChild(timing);

    const shape = makeSection('Shape');
    shape.appendChild(makeControlRow('Copies', steps, null));
    shape.appendChild(makeControlRow('Stack height', spread, spreadVal));
    shape.appendChild(makeControlRow('Start offset', offset, offsetVal));
    shape.appendChild(makeControlRow('± opacity', endOpacity, endOpacityVal));
    shape.appendChild(makeControlRow('Neg opacity Δ', negOpacityDelta, negOpacityDeltaVal));
    shape.appendChild(makeControlRow('Stretch', stretch, stretchVal));
    shape.appendChild(makeControlRow('Origin X', originX, originXVal));
    shape.appendChild(makeControlRow('Origin Y', originY, originYVal));
    shape.appendChild(makeControlRow('Origin preset', originPreset, null));
    shape.appendChild(makeControlRow('Preset (copy)', fullPreset, null));
    shape.appendChild(makeControlRow('Clip overlap', clipToggle, null));
    panel.appendChild(shape);

    const blurSec = makeSection('Blur');
    blurSec.appendChild(makeControlRow('Max blur', blur, blurVal));
    blurSec.appendChild(makeControlRow('Neg blur Δ', negBlurDelta, negBlurDeltaVal));
    panel.appendChild(blurSec);

    const grainSec = makeAccordion('Grain', { open: false });
    grainSec.appendChild(makeControlRow('Grain amount', grainScale, grainScaleVal));
    grainSec.appendChild(makeControlRow('Grain freq', grainFreq, grainFreqVal));
    grainSec.appendChild(makeControlRow('Grain contrast', grainContrast, grainContrastVal));
    panel.appendChild(grainSec);

    document.body.appendChild(panel);

    // --- Wire UI -> config ---
    const relayout = () => {
        layout();
        update();
    };

    const updateTotalReadout = () => {
        totalVal.textContent = `${getTotalScrollPx()}px`;
    };

    seg.addEventListener('input', () => {
        config.negPosPx = Number(seg.value) || 0;
        segVal.textContent = `${config.negPosPx}px`;
        updateTotalReadout();
        syncPresetReadout();
        relayout();
    });

    spread.addEventListener('input', () => {
        config.spreadPx = Number(spread.value) || config.spreadPx;
        spreadVal.textContent = `${config.spreadPx}px`;
        syncPresetReadout();
        update();
    });

    offset.addEventListener('input', () => {
        config.startOffsetVh = Number(offset.value) || config.startOffsetVh;
        offsetVal.textContent = `${config.startOffsetVh}vh`;
        syncPresetReadout();
        update();
    });

    blur.addEventListener('input', () => {
        config.maxBlurPx = Number(blur.value) || config.maxBlurPx;
        blurVal.textContent = `${config.maxBlurPx}px`;
        syncPresetReadout();
        update();
    });

    const syncCopies = () => {
        const next = Math.max(1, Math.min(30, Math.round(Number(steps.value) || 1)));
        steps.value = String(next);
        if (next === config.layers) return;
        config.layers = next;
        ensureFirstTenetStack();
        applyTransformOriginToStack();
        syncPresetReadout();
        relayout();
    };

    steps.addEventListener('input', syncCopies);
    steps.addEventListener('change', syncCopies);

    endOpacity.addEventListener('input', () => {
        config.endOpacity = Number(endOpacity.value);
        endOpacityVal.textContent = String(config.endOpacity);
        syncPresetReadout();
        update();
    });

    negOpacityDelta.addEventListener('input', () => {
        config.negEdgeOpacityDelta = Number(negOpacityDelta.value) || 0;
        negOpacityDeltaVal.textContent = String(config.negEdgeOpacityDelta);
        syncPresetReadout();
        update();
    });

    negBlurDelta.addEventListener('input', () => {
        config.negEdgeBlurDeltaPx = Number(negBlurDelta.value) || 0;
        negBlurDeltaVal.textContent = `${config.negEdgeBlurDeltaPx}px`;
        syncPresetReadout();
        update();
    });

    stretch.addEventListener('input', () => {
        config.stretchX = Number(stretch.value) || 0;
        stretchVal.textContent = `+${Math.round(Number(config.stretchX) * 100)}%`;
        syncPresetReadout();
        update();
    });

    originX.addEventListener('input', () => {
        config.originXPercent = Number(originX.value) || 0;
        originXVal.textContent = `${Math.round(Number(config.originXPercent))}%`;
        applyTransformOriginToStack();
        syncPresetReadout();
        update();
    });

    originY.addEventListener('input', () => {
        config.originYPercent = Number(originY.value) || 0;
        originYVal.textContent = `${Math.round(Number(config.originYPercent))}%`;
        applyTransformOriginToStack();
        syncPresetReadout();
        update();
    });

    clipToggle.addEventListener('change', () => {
        config.clipOverlap = clipToggle.checked;
        syncPresetReadout();
        update();
    });

    zero.addEventListener('input', () => {
        config.zeroHoldPx = Number(zero.value) || 0;
        zeroVal.textContent = `${config.zeroHoldPx}px`;
        updateTotalReadout();
        syncPresetReadout();
        relayout();
    });

    grainScale.addEventListener('input', () => {
        config.grainScale = Number(grainScale.value) || config.grainScale;
        grainScaleVal.textContent = String(config.grainScale);
        syncPresetReadout();
        update();
    });

    grainFreq.addEventListener('input', () => {
        config.grainFrequency = Number(grainFreq.value) || config.grainFrequency;
        grainFreqVal.textContent = String(config.grainFrequency);
        updateFilterControls();
        syncPresetReadout();
        update();
    });

    grainContrast.addEventListener('input', () => {
        config.grainContrast = Number(grainContrast.value) || config.grainContrast;
        grainContrastVal.textContent = String(config.grainContrast);
        updateFilterControls();
        syncPresetReadout();
        update();
    });

    // --- Init ---
    ensureTenetSteps();
    ensureFirstTenetStack();
    originPresetInput = originPreset;
    fullPresetInput = fullPreset;
    applyTransformOriginToStack();
    updateFilterControls();
    updateTotalReadout();
    syncPresetReadout();
    layout();
    update();

    let raf = 0;
    const requestUpdate = () => {
        if (raf) return;
        raf = window.requestAnimationFrame(() => {
            raf = 0;
            update();
        });
    };

    const onScroll = () => {
        requestUpdate();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        layout();
        update();
    });
});
