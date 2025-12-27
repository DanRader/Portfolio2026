// Main JavaScript file

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Website loaded successfully!');

    // Grain parallax: drift the grain very slowly behind scroll.
    const grainLayer = document.querySelector('.grain');
    if (grainLayer) {
        const PARALLAX_FACTOR = 0.0225;
        let raf = 0;
        let lastY = 0;

        const update = () => {
            raf = 0;
            const y = window.scrollY || window.pageYOffset || 0;
            if (y === lastY) return;
            lastY = y;
            const offsetPx = Math.round(y * PARALLAX_FACTOR);
            grainLayer.style.setProperty('--grain-parallax-y', `${offsetPx}px`);
        };

        const schedule = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
    }

    // Custom hand cursor (Font Awesome masked) + smooth transitions between states
    const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
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
            // Rotate based on horizontal position:
            // left edge => -60deg, center => 0deg, right edge => +60deg.
            const vw = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
            const t = Math.max(0, Math.min(1, e.clientX / vw));
            const xNorm = (t * 2) - 1;
            const angleDeg = xNorm * 60;
            cursor.style.setProperty('--cursor-rotate', `${angleDeg.toFixed(2)}deg`);

            // Keep the cursor "tip" pinned to the system pointer even as rotation changes.
            // We rotate around the element's top-left; therefore the hotspot offset must rotate too.
            const theta = (angleDeg * Math.PI) / 180;
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);
            const scale = isBig ? 1 : 0.22;

            const dx = (tipX * cos - tipY * sin) * scale;
            const dy = (tipX * sin + tipY * cos) * scale;

            cursor.style.left = `${e.clientX - dx}px`;
            cursor.style.top = `${e.clientY - dy}px`;
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

    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        const isLight = body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });

    // Hamburger menu functionality
    const hamburger = document.querySelector('.hamburger');
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        // Add your menu open/close logic here
        console.log('Menu toggled');
    });

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
