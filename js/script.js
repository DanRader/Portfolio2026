// Main JavaScript file

document.addEventListener('DOMContentLoaded', () => {
    console.log('Website loaded successfully!');

    const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /*
     * Stickers: click or drag anywhere in the scroll root to stamp random emoji.
     * (Keeping this commented for now to keep the launch lightweight.)
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
            // Keep the cursor "tip" pinned to the system pointer (no rotation).
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
                try { scrollbar.releasePointerCapture(e.pointerId); } catch { }
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

    // Intro eye tracker (reuses the lab interaction on the hero)
    const initIntroEye = () => {
        const eye = document.querySelector('.intro-eye[data-eye]');
        if (!eye) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const config = {
            movementScale: 0.16,
            distancePower: 0.5,
            distanceBoost: 3,
            ease: prefersReduced ? 1 : 0.12,
            leftBias: 2.6,
            blink: {
                closeMs: 85,
                holdMs: 20,
                openMs: 195,
                settleMs: 8000,
                settleJitterPct: 1.0,
                squashPx: 1,
                closeEase: 'cubic-bezier(0.42, 0, 0.58, 1)',
                openEase: 'ease-out',
            },
        };

        const layers = Array.from(eye.querySelectorAll('[data-layer]')).map((el) => ({
            el,
            depth: Number(el.dataset.depth) || 1,
            max: Number(el.dataset.max) || 18,
        }));

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        let raf = 0;

        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
        const lerp = (a, b, t) => a + ((b - a) * t);

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

            if (nx < 0) nx = clamp(nx * config.leftBias, -1, 1);

            // Elastic attraction when pointer is near the eye
            const attractRadius = 150;
            const attractMax = 12; // px translate at closest approach
            if (dist < attractRadius) {
                const t = 1 - (dist / attractRadius);
                const pullX = dist === 0 ? 0 : (dx / dist) * attractMax * t;
                const pullY = dist === 0 ? 0 : (dy / dist) * attractMax * t;
                eye.style.transform = `translate(${pullX.toFixed(2)}px, ${pullY.toFixed(2)}px)`;
            } else {
                eye.style.transform = '';
            }

            targetX = nx;
            targetY = ny;
            if (!raf) raf = window.requestAnimationFrame(tick);
        };

        const reset = () => {
            targetX = 0;
            targetY = 0;
            eye.style.transform = '';
            if (!raf) raf = window.requestAnimationFrame(tick);
        };

        window.addEventListener('pointermove', (e) => updateTarget(e.clientX, e.clientY), { passive: true });
        window.addEventListener('pointerleave', reset);
        window.addEventListener('resize', reset);

        applyTransforms();

        // Blink animation (JS-driven, mirrors eye lab defaults)
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

        startBlinkLoop();
    };

    initIntroEye();

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
