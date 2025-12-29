// Main JavaScript file

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Website loaded successfully!');

    // Grain parallax disabled (performance): keep the grain texture static.

    const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /*
    // Stickers: click or drag anywhere in the scroll root to stamp random emoji.
    const stickerRoot = document.querySelector('#infinite-scroll-root');
    if (finePointer && stickerRoot) {
        const stickerLayer = document.createElement('div');
        stickerLayer.className = 'site-stickers';
        stickerLayer.setAttribute('aria-hidden', 'true');
        stickerRoot.appendChild(stickerLayer);

        const EMOJIS = [
            '✨',
            '⭐️',
            '🌟',
            '💥',
            '💫',
            '🪩',
            '🫧',
            '🍕',
            '🧠',
            '🧩',
            '🛸',
            '🎈',
            '🧃',
            '🖍️',
            '🪐',
            '🧸',
            '🧨',
            '🎯',
            '🫶',
        ];

        const rand = (min, max) => min + (Math.random() * (max - min));
        const pick = (list) => list[Math.floor(Math.random() * list.length)];

        let stickerZ = 10;
        let isStamping = false;
        let lastClientX = 0;
        let lastClientY = 0;
        let lastStampT = 0;

        const MIN_STAMP_DIST_PX = 32;
        const MIN_STAMP_MS = 50;

        // Dragging can generate a lot of stickers; throttle it more aggressively.
        const MIN_DRAG_STAMP_DIST_PX = 112;
        const MIN_DRAG_STAMP_MS = 180;
        const MAX_STICKERS = 220;

        const isInteractiveTarget = (target) =>
            !!(target && target.closest && target.closest('a, button, input, textarea, select, label'));

        const stampAt = (clientX, clientY) => {
            const rect = stickerRoot.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

            const sticker = document.createElement('div');
            sticker.className = 'site-sticker';
            sticker.textContent = pick(EMOJIS);

            const sizePx = Math.round(rand(28, 140));
            const rotateDeg = rand(-90, 90);
            const flip = Math.random() < 0.35 ? -1 : 1;
            const scale = rand(0.85, 1.15);

            sticker.style.left = `${x}px`;
            sticker.style.top = `${y}px`;
            sticker.style.zIndex = `${++stickerZ}`;
            sticker.style.fontSize = `${sizePx}px`;
            sticker.style.setProperty('--sticker-rotate', `${rotateDeg.toFixed(1)}deg`);
            sticker.style.setProperty('--sticker-flip', `${flip}`);
            sticker.style.setProperty('--sticker-scale', `${scale.toFixed(2)}`);

            stickerLayer.appendChild(sticker);

            // Prevent the hero from getting slower over time by keeping DOM size bounded.
            while (stickerLayer.childElementCount > MAX_STICKERS) {
                stickerLayer.removeChild(stickerLayer.firstElementChild);
            }
        };

        const stopStamping = (e) => {
            if (!isStamping) return;
            isStamping = false;
            try {
                stickerRoot.releasePointerCapture(e.pointerId);
            } catch {
                // ignore
            }
        };

        stickerRoot.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (isInteractiveTarget(e.target)) return;

            isStamping = true;
            lastClientX = e.clientX;
            lastClientY = e.clientY;
            lastStampT = window.performance ? window.performance.now() : Date.now();

            stickerRoot.setPointerCapture(e.pointerId);
            stampAt(e.clientX, e.clientY);
        });

        stickerRoot.addEventListener('pointermove', (e) => {
            if (!isStamping) return;

            const now = window.performance ? window.performance.now() : Date.now();
            const dx = e.clientX - lastClientX;
            const dy = e.clientY - lastClientY;
            const dist2 = (dx * dx) + (dy * dy);
            const minDist2 = MIN_DRAG_STAMP_DIST_PX * MIN_DRAG_STAMP_DIST_PX;

            if (dist2 < minDist2 && (now - lastStampT) < MIN_DRAG_STAMP_MS) return;

            stampAt(e.clientX, e.clientY);
            lastClientX = e.clientX;
            lastClientY = e.clientY;
            lastStampT = now;
        });

        stickerRoot.addEventListener('pointerup', stopStamping);
        stickerRoot.addEventListener('pointercancel', stopStamping);
        stickerRoot.addEventListener('lostpointercapture', () => {
            isStamping = false;
        });
    }
    */

    // Custom hand cursor (Font Awesome masked) + smooth transitions between states
    if (finePointer) {
        const cursor = document.createElement('div');
        cursor.className = 'site-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        document.body.appendChild(cursor);
        document.body.classList.add('has-custom-cursor');

        let isBig = false;
        let hoveredLink = null;

        const BOUNCE_OUT_MS = 220;
        const HAND_SWAP_POINT = 0.25;
        const HAND_RELEASE_DELAY_MS = Math.round(BOUNCE_OUT_MS * HAND_SWAP_POINT);
        let handReleaseTimer = 0;
        let activeHoverCursorClass = '';

        const getHoverCursorClassForTarget = (target) => {
            if (!target || !target.matches) return 'cursor--hand';
            if (
                target.matches(
                    'a.footer-pill--email[href^="mailto:itsdanrader"], a.footer-pill--email[href*="itsdanrader@gmail.com"]'
                )
            ) {
                return 'cursor--email-horns';
            }
            return 'cursor--hand';
        };

        let tipX = 70;
        let tipY = 16;

        const readCursorTip = () => {
            const styles = window.getComputedStyle(cursor);
            const x = parseFloat(styles.getPropertyValue('--cursor-tip-x'));
            const y = parseFloat(styles.getPropertyValue('--cursor-tip-y'));
            tipX = Number.isFinite(x) ? x : 70;
            tipY = Number.isFinite(y) ? y : 16;
        };

        readCursorTip();

        const setBig = (next) => {
            isBig = next;
            document.body.classList.toggle('cursor--big', isBig);

            // Ensure tip offsets match the active cursor state (e.g., finger-tip hotspot on hover).
            window.requestAnimationFrame(readCursorTip);
        };

        const onMove = (e) => {
            // Radial rotation: make the cursor's *bottom* (down direction) face the
            // viewport center.
            const vw = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
            const vh = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
            const cx = vw / 2;
            const cy = vh / 2;

            const dx = cx - e.clientX;
            const dy = cy - e.clientY;

            // atan2 gives angle from +X; subtract 90deg so +Y (down) points toward center.
            const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
            cursor.style.setProperty('--cursor-rotate', `${angleDeg.toFixed(2)}deg`);

            // Keep the cursor "tip" pinned to the system pointer.
            // We set CSS transform-origin to the tip point, so rotation/scale happen around it.
            cursor.style.left = `${e.clientX - tipX}px`;
            cursor.style.top = `${e.clientY - tipY}px`;
        };

        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('resize', readCursorTip);
        window.addEventListener('blur', () => {
            cursor.style.left = '-9999px';
            cursor.style.top = '-9999px';
            setBig(false);
            if (handReleaseTimer) window.clearTimeout(handReleaseTimer);
            handReleaseTimer = 0;
            if (activeHoverCursorClass) document.body.classList.remove(activeHoverCursorClass);
            activeHoverCursorClass = '';
            hoveredLink = null;
        });

        // Big cursor on hover for any link (and Ask-me-about cards + theme toggle).
        // Use event delegation so this also works for dynamically cloned content.
        document.addEventListener('pointerover', (e) => {
            const target = e.target && e.target.closest ? e.target.closest('a, .card, button.theme-toggle') : null;
            if (!target) return;

            // Ignore movement within the same target.
            if (e.relatedTarget && target.contains(e.relatedTarget)) return;

            hoveredLink = target;

            if (handReleaseTimer) window.clearTimeout(handReleaseTimer);
            handReleaseTimer = 0;

            if (activeHoverCursorClass) document.body.classList.remove(activeHoverCursorClass);
            activeHoverCursorClass = getHoverCursorClassForTarget(target);
            document.body.classList.add(activeHoverCursorClass);
            setBig(true);
        });

        document.addEventListener('pointerout', (e) => {
            const target = e.target && e.target.closest ? e.target.closest('a, .card, button.theme-toggle') : null;
            if (!target) return;

            // Ignore movement within the same target.
            if (e.relatedTarget && target.contains(e.relatedTarget)) return;

            if (hoveredLink === target) hoveredLink = null;
            setBig(false);

            // Keep the hand visible through most of the shrink so the user sees it contract.
            if (handReleaseTimer) window.clearTimeout(handReleaseTimer);
            handReleaseTimer = window.setTimeout(() => {
                if (!document.body.classList.contains('cursor--big')) {
                    if (activeHoverCursorClass) document.body.classList.remove(activeHoverCursorClass);
                    activeHoverCursorClass = '';
                }
                handReleaseTimer = 0;
            }, HAND_RELEASE_DELAY_MS);
        });
    }

    // Core Tenets: each tenet sticks for TENET_SCROLL_PX when its top hits the vertical center.
    // NOTE: infinite scroll clones remove IDs, so we target aria-label and re-init on DOM mutations.
    const TENET_SCROLL_PX = 700;
    const TENET_EXTRA_GAP_PX = 200;

    // Tenet 1 stack (ported from the Tenet 1 lab defaults).
    const TENET1 = {
        negPosPx: 510,
        zeroHoldPx: 420,
        layers: 9,
        spreadPx: 59,
        startOffsetVh: 20.5,
        endOpacity: 0.08,
        negEdgeOpacityDelta: 1,
        maxBlurPx: 45,
        negEdgeBlurDeltaPx: -25,
        stretchX: 0.8,
        originXPercent: 16,
        originYPercent: 100,
        grainEnabled: true,
        grainFrequency: 1.04,
        grainScale: 0.95,
        grainContrast: 1.3,
    };

    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const getTenet1TotalScrollPx = () => {
        const seg = Math.max(0, Number(TENET1.negPosPx) || 0);
        const zero = Math.max(0, Number(TENET1.zeroHoldPx) || 0);
        return Math.max(1, (2 * seg) + zero);
    };
    const readStickyTopPx = (el, fallbackPx) => {
        if (!el) return fallbackPx;
        const top = window.getComputedStyle(el).top;
        const px = parseFloat(top);
        return Number.isFinite(px) ? px : fallbackPx;
    };
    const tenetLayoutForSection = (section) => {
        const halfVh = (window.innerHeight || 0) / 2;
        const steps = section.querySelector('.tenet-steps');
        if (!steps) return;

        // Lead-in so the first step starts in the negative state.
        const firstTenet = steps.querySelector('.tenet-step .tenet');
        if (firstTenet) {
            const stickyTopPx = readStickyTopPx(firstTenet, halfVh);
            steps.style.paddingTop = `${Math.max(0, Math.ceil(stickyTopPx))}px`;
        }

        const tenet1ScrollPx = getTenet1TotalScrollPx();

        const stepEls = Array.from(steps.querySelectorAll('.tenet-step'));
        for (const step of stepEls) {
            const tenet = step.querySelector('.tenet');
            if (!tenet) continue;

            // Per-step sticky duration: Tenet 1 uses the lab’s 3-phase scroll,
            // other tenets keep the main-site duration.
            const isTenet1 = Boolean(step.matches(':first-child'));
            const scrollPx = isTenet1 ? tenet1ScrollPx : TENET_SCROLL_PX;
            step.style.setProperty('--tenet-scroll', `${scrollPx}px`);

            const h = Math.ceil(tenet.getBoundingClientRect().height);
            step.style.setProperty('--tenet-height', `${h}px`);

            // Gap sizing should respect the actual sticky top offset (currently 40vh in CSS).
            const stickyTopPx = readStickyTopPx(tenet, halfVh);

            const gap = step.nextElementSibling;
            if (gap && gap.classList && gap.classList.contains('tenet-gap')) {
                // Ensure the next tenet doesn't enter early: account for sticky duration + spacing.
                const gapPx = Math.max(0, Math.ceil(stickyTopPx - h)) + scrollPx + TENET_EXTRA_GAP_PX;
                gap.style.height = `${gapPx}px`;
            }
        }
    };

    const ensureFirstTenetStack = (section) => {
        const firstTenet = section.querySelector('.tenet-steps .tenet-step:first-child .tenet');
        if (!firstTenet) return;

        const existingText = (firstTenet.dataset.tenetStackText || '').trim();
        const initialText = (firstTenet.textContent || '').trim();
        const text = existingText || initialText;
        if (!text) return;

        // Only apply the Tenet 1 stack effect to the actual Tenet 1 phrase.
        // (Prevents the effect from hijacking tenet-2/tenet-3 standalone pages.)
        if (text.replace(/\s+/g, ' ').trim().toUpperCase() !== 'GIVE A DAMN') return;

        // Rebuild if the layer count changes (or if this is a fresh init).
        const builtLayers = Number(firstTenet.dataset.tenetStackLayers || 0);
        if (firstTenet.dataset.tenetStackInit === '1' && builtLayers === TENET1.layers) return;

        firstTenet.dataset.tenetStackInit = '1';
        firstTenet.dataset.tenetStackText = text;
        firstTenet.dataset.tenetStackLayers = String(TENET1.layers);
        firstTenet.classList.add('tenet--stack');

        // Keep one in-flow copy to preserve layout/height and accessibility.
        firstTenet.textContent = '';
        const sizer = document.createElement('span');
        sizer.className = 'tenet-stack__sizer';
        sizer.textContent = text;
        firstTenet.appendChild(sizer);

        const origin = `${Math.max(0, Math.min(100, Number(TENET1.originXPercent) || 50))}% ${Math.max(0, Math.min(100, Number(TENET1.originYPercent) || 100))}%`;
        for (let i = 0; i < TENET1.layers; i += 1) {
            const layer = document.createElement('span');
            layer.className = 'tenet-stack__layer';
            layer.setAttribute('aria-hidden', 'true');
            layer.textContent = text;
            layer.style.transformOrigin = origin;
            firstTenet.appendChild(layer);
        }
    };

    const tenetStacks = new Map();
    const syncTenetStacksIn = (container) => {
        const tenets = Array.from(container.querySelectorAll('h2.tenet.tenet--stack'));
        for (const tenet of tenets) {
            const step = tenet.closest('.tenet-step');
            if (!step) continue;
            if (tenetStacks.has(tenet)) continue;

            const layers = Array.from(tenet.querySelectorAll('.tenet-stack__layer'));
            if (layers.length !== TENET1.layers) continue;

            tenetStacks.set(tenet, {
                tenet,
                step,
                layers,
            });
        }

        // Prune removed nodes (infinite scroll deletes copies).
        for (const [tenet] of tenetStacks) {
            if (!document.documentElement.contains(tenet)) tenetStacks.delete(tenet);
        }
    };

    // --- SVG grain filter wiring (optional; degrades gracefully if missing) ---
    const TENET_GRAIN_FILTER_ID = 'tenet-grain';
    const getTenetGrainNodes = () => {
        const filter = document.getElementById(TENET_GRAIN_FILTER_ID);
        if (!filter) return null;
        const turbulence = filter.querySelector('feTurbulence');
        const grainMix = filter.querySelector('feComposite#tenet-grain-mix');
        const grainFuncA = filter.querySelector('feFuncA#tenet-grain-contrast-a');
        const grainDither = filter.querySelector('feComposite#tenet-grain-dither');
        return { filter, turbulence, grainMix, grainFuncA, grainDither };
    };

    const updateTenetGrainControls = () => {
        const nodes = getTenetGrainNodes();
        if (!nodes) return;

        if (nodes.turbulence) nodes.turbulence.setAttribute('baseFrequency', String(TENET1.grainFrequency));
        const c = Math.max(0, Number(TENET1.grainContrast) || 0);
        if (nodes.grainFuncA) nodes.grainFuncA.setAttribute('slope', String(c));
    };

    const tenetLayerFilter = (blurPx) => {
        const blurPart = `blur(${Math.max(0, blurPx).toFixed(2)}px)`;
        if (!TENET1.grainEnabled) return blurPart;
        if (!document.getElementById(TENET_GRAIN_FILTER_ID)) return blurPart;
        return `${blurPart} url(#${TENET_GRAIN_FILTER_ID})`;
    };

    const updateFirstTenetStacks = () => {
        if (!tenetStacks.size) return;
        const vh = window.innerHeight || 0;
        const baseOffsetPx = (vh * TENET1.startOffsetVh) / 100;

        // Keep filter params in sync if the filter exists.
        updateTenetGrainControls();

        for (const { tenet, step, layers } of tenetStacks.values()) {
            const stickyTopPx = readStickyTopPx(tenet, vh / 2);
            const stepTop = step.getBoundingClientRect().top;

            const segPx = Math.max(0, Number(TENET1.negPosPx) || 0);
            const zeroHoldPx = Math.max(0, Number(TENET1.zeroHoldPx) || 0);
            const totalScrollPx = Math.max(1, (2 * segPx) + zeroHoldPx);

            const distPx = Math.max(0, Math.min(totalScrollPx, stickyTopPx - stepTop));

            let s;
            if (segPx <= 0) {
                if (distPx <= 0) s = -1;
                else if (distPx < zeroHoldPx) s = 0;
                else s = 1;
            } else if (distPx < segPx) {
                const t = distPx / segPx;
                s = -1 + t;
            } else if (distPx < segPx + zeroHoldPx) {
                s = 0;
            } else {
                const t = (distPx - segPx - zeroHoldPx) / segPx;
                s = Math.max(0, Math.min(1, t));
            }

            const spread = Math.abs(s);
            const spreadPos = spread * spread;

            const blurPx = (Number(TENET1.maxBlurPx) || 0) * spread;

            // If grain is enabled and the filter exists, drive strength by blur amount.
            if (TENET1.grainEnabled) {
                const nodes = getTenetGrainNodes();
                if (nodes) {
                    const maxBlur = Math.max(0.0001, Number(TENET1.maxBlurPx) || 0);
                    const blurStrength = Math.max(0, Math.min(1, blurPx / maxBlur));
                    const strength = Math.max(0, Math.min(1, Number(TENET1.grainScale) || 0));
                    const a = strength * blurStrength;

                    if (nodes.grainDither) nodes.grainDither.setAttribute('k3', String(a.toFixed(4)));
                    if (nodes.grainMix) {
                        nodes.grainMix.setAttribute('k2', String((1 - a).toFixed(4)));
                        nodes.grainMix.setAttribute('k3', String(a.toFixed(4)));
                    }
                }
            }

            const centerIndex = Math.floor((layers.length - 1) / 2);

            const endOpacity = Math.max(0, Math.min(1, Number(TENET1.endOpacity)));
            const endOpacityFactor = 1 - ((1 - endOpacity) * spread);

            const edgePhase = clamp01(Math.abs(s));
            const layerCount = Math.max(1, layers.length);
            const negOpacityDelta = Math.max(-1, Math.min(1, Number(TENET1.negEdgeOpacityDelta) || 0));
            const negBlurDeltaPx = Number(TENET1.negEdgeBlurDeltaPx) || 0;
            const maxStretchX = Math.max(0, Number(TENET1.stretchX) || 0);

            for (let i = 0; i < layers.length; i += 1) {
                const layer = layers[i];
                const centered = i - ((layers.length - 1) / 2);
                const t = layerCount <= 1 ? 0 : (i / (layerCount - 1));
                const y = (centered * (Number(TENET1.spreadPx) || 0) * spreadPos) + (baseOffsetPx * spreadPos);

                const baseOpacity = (i === centerIndex ? 1 : spread) * endOpacityFactor;
                const negOpacityFactor = clamp01(1 - (t * negOpacityDelta * edgePhase));
                const opacity = baseOpacity * negOpacityFactor;

                const layerBlurPx = blurPx + (t * negBlurDeltaPx * edgePhase);

                let stretchT;
                if (s < 0) stretchT = 1 - t;
                else if (s > 0) stretchT = t;
                else stretchT = 0;
                const stretchFactor = 1 + (maxStretchX * edgePhase * clamp01(stretchT));

                layer.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scaleX(${stretchFactor.toFixed(4)})`;
                layer.style.filter = tenetLayerFilter(layerBlurPx);
                layer.style.opacity = `${opacity.toFixed(3)}`;

                // Ensure we never leave old letter-spacing behind.
                layer.style.letterSpacing = '';
            }
        }
    };

    const ensureTenetSteps = (section) => {
        const content = section.querySelector('.split-content');
        if (!content) return;
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

    const initTenetsIn = (container) => {
        const sections = Array.from(container.querySelectorAll('section[aria-label="Core Tenets"]'));
        if (!sections.length) return;

        for (const section of sections) {
            ensureTenetSteps(section);
            ensureFirstTenetStack(section);
            tenetLayoutForSection(section);
        }

        syncTenetStacksIn(container);
        updateFirstTenetStacks();
    };

    const scrollRoot = document.querySelector('#infinite-scroll-root') || document;
    initTenetsIn(scrollRoot);

    // Drive the first-tenet blur stack with scroll.
    let tenetAnimRaf = 0;
    const scheduleTenetAnim = () => {
        if (tenetAnimRaf) return;
        tenetAnimRaf = window.requestAnimationFrame(() => {
            tenetAnimRaf = 0;
            updateFirstTenetStacks();
        });
    };
    window.addEventListener('scroll', scheduleTenetAnim, { passive: true });

    // Re-init when infinite-scroll adds/removes copies.
    if (scrollRoot && scrollRoot.nodeType === 1) {
        let tenetInitRaf = 0;
        const scheduleTenetInit = () => {
            if (tenetInitRaf) return;
            tenetInitRaf = window.requestAnimationFrame(() => {
                tenetInitRaf = 0;
                initTenetsIn(scrollRoot);
            });
        };

        const mo = new MutationObserver(scheduleTenetInit);
        mo.observe(scrollRoot, { childList: true, subtree: true });

        let resizeRaf = 0;
        window.addEventListener('resize', () => {
            if (resizeRaf) window.cancelAnimationFrame(resizeRaf);
            resizeRaf = window.requestAnimationFrame(() => {
                resizeRaf = 0;
                initTenetsIn(scrollRoot);
                updateFirstTenetStacks();
            });
        });
    }

    // Hero rotating word (adjust this value to change the cadence)
    const WORD_ROTATE_INTERVAL_MS = 3500;
    const ROTATING_WORDS = ['Design', 'Systems', 'Craft', 'Leaned-in', 'Dad-Joke'];
    const WORD_FADE_MS = 220;

    // With infinite scrolling copies, there may be multiple .intro-rotator nodes.
    // The real/source hero keeps id="top" (clone IDs are removed), so scope to that.
    const introRoot = document.querySelector('#top') || document;
    const rotator = introRoot.querySelector('.intro-rotator');
    const rotatorWord = rotator ? rotator.querySelector('.intro-rotator__word') : null;

    if (rotator && rotatorWord) {
        const sizer = document.createElement('span');
        sizer.className = 'intro-em intro-rotator__sizer';
        sizer.setAttribute('aria-hidden', 'true');
        rotator.appendChild(sizer);

        const setRotatorWidth = (text) => {
            sizer.textContent = text;
            const width = Math.ceil(sizer.getBoundingClientRect().width);
            rotator.style.setProperty('--rotator-width', `${width}px`);
        };

        let index = 0;
        rotatorWord.textContent = ROTATING_WORDS[index];
        setRotatorWidth(ROTATING_WORDS[index]);

        const tick = () => {
            const nextIndex = (index + 1) % ROTATING_WORDS.length;
            const nextWord = ROTATING_WORDS[nextIndex];

            rotator.classList.add('is-fading');
            window.setTimeout(() => {
                rotatorWord.textContent = nextWord;
                setRotatorWidth(nextWord);
                rotator.classList.remove('is-fading');
                index = nextIndex;
            }, WORD_FADE_MS);
        };

        window.setInterval(tick, WORD_ROTATE_INTERVAL_MS);

        let resizeRaf = 0;
        window.addEventListener('resize', () => {
            if (resizeRaf) window.cancelAnimationFrame(resizeRaf);
            resizeRaf = window.requestAnimationFrame(() => {
                setRotatorWidth(rotatorWord.textContent || '');
            });
        });
    }

    // Ask-me-about custom scrollbar
    const askSection = document.querySelector('#ask');
    if (askSection) {
        const cards = askSection.querySelector('.cards');
        const scrollbar = askSection.querySelector('.cards-scrollbar');
        const inner = askSection.querySelector('.cards-scrollbar__inner');
        const thumb = askSection.querySelector('.cards-scrollbar__thumb');

        if (cards && scrollbar && inner && thumb) {
            const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

            const update = () => {
                const trackWidth = inner.clientWidth;
                const maxScroll = cards.scrollWidth - cards.clientWidth;

                if (trackWidth <= 0 || maxScroll <= 0) {
                    thumb.style.width = `${trackWidth}px`;
                    thumb.style.transform = `translateY(-50%) translateX(0px)`;
                    return;
                }

                const ratio = cards.clientWidth / cards.scrollWidth;
                const thumbWidth = clamp(Math.round(trackWidth * ratio), 24, trackWidth);
                const maxThumbX = trackWidth - thumbWidth;
                const progress = cards.scrollLeft / maxScroll;
                const thumbX = Math.round(maxThumbX * progress);

                thumb.style.width = `${thumbWidth}px`;
                thumb.style.transform = `translateY(-50%) translateX(${thumbX}px)`;
            };

            let isPointerDown = false;
            let pointerStartX = 0;
            let scrollStart = 0;
            let trackWidthAtStart = 0;
            let maxScrollAtStart = 0;

            const onPointerDown = (e) => {
                isPointerDown = true;
                scrollbar.setPointerCapture(e.pointerId);

                const rect = inner.getBoundingClientRect();
                pointerStartX = e.clientX - rect.left;
                scrollStart = cards.scrollLeft;
                trackWidthAtStart = inner.clientWidth;
                maxScrollAtStart = cards.scrollWidth - cards.clientWidth;

                if (maxScrollAtStart > 0) {
                    const clickProgress = clamp(pointerStartX / trackWidthAtStart, 0, 1);
                    cards.scrollLeft = clickProgress * maxScrollAtStart;
                }
            };

            const onPointerMove = (e) => {
                if (!isPointerDown) return;
                const rect = inner.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const dx = x - pointerStartX;
                if (trackWidthAtStart <= 0 || maxScrollAtStart <= 0) return;

                const scrollPerPx = maxScrollAtStart / trackWidthAtStart;
                cards.scrollLeft = scrollStart + dx * scrollPerPx;
            };

            const onPointerUp = (e) => {
                if (!isPointerDown) return;
                isPointerDown = false;
                try { scrollbar.releasePointerCapture(e.pointerId); } catch {}
            };

            cards.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update);
            scrollbar.addEventListener('pointerdown', onPointerDown);
            scrollbar.addEventListener('pointermove', onPointerMove);
            scrollbar.addEventListener('pointerup', onPointerUp);
            scrollbar.addEventListener('pointercancel', onPointerUp);

            update();
        }
    }

    // Theme toggle functionality (use delegation so it survives infinite-scroll cloning).
    const body = document.body;

    // Check for saved theme preference (guarded for privacy-mode/storage errors).
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') body.classList.add('light-mode');
    } catch {
        // ignore
    }

    document.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('button.theme-toggle') : null;
        if (!btn) return;

        body.classList.toggle('light-mode');
        const isLight = body.classList.contains('light-mode');
        try {
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        } catch {
            // ignore
        }
    });

    // Hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            // Add your menu open/close logic here
            console.log('Menu toggled');
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Example: Add active class to current section
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('nav a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});
