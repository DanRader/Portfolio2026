// Main JavaScript file

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Website loaded successfully!');

    // Oversized pointer cursor for footer pills
    const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (finePointer) {
        const footerPills = document.querySelectorAll('.footer-pill');
        if (footerPills.length) {
            const bigCursor = document.createElement('div');
            bigCursor.className = 'big-pointer-cursor';
            bigCursor.setAttribute('aria-hidden', 'true');
            document.body.appendChild(bigCursor);

            let isActive = false;

            const setActive = (next) => {
                isActive = next;
                document.body.classList.toggle('is-big-cursor', isActive);
                if (!isActive) {
                    bigCursor.style.left = '-9999px';
                    bigCursor.style.top = '-9999px';
                }
            };

            const onMove = (e) => {
                if (!isActive) return;

                const tipX = 56;
                const tipY = 12;
                const left = e.clientX - tipX;
                const top = e.clientY - tipY;

                bigCursor.style.left = `${left}px`;
                bigCursor.style.top = `${top}px`;
            };

            footerPills.forEach((pill) => {
                pill.addEventListener('pointerenter', () => setActive(true));
                pill.addEventListener('pointerleave', () => setActive(false));
            });

            window.addEventListener('pointermove', onMove, { passive: true });
            window.addEventListener('blur', () => setActive(false));
        }
    }

    // Hero rotating word (adjust this value to change the cadence)
    const WORD_ROTATE_INTERVAL_MS = 3500;
    const ROTATING_WORDS = ['Design', 'Systems', 'Craft', 'Leaned-in', 'Dad-Joke'];
    const WORD_FADE_MS = 220;

    const rotator = document.querySelector('.intro-rotator');
    const rotatorWord = document.querySelector('.intro-rotator__word');

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
