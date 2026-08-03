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

        // Big cursor on hover for any link (and the theme toggle).
        // Use event delegation so this also works for dynamically cloned content.
        document.addEventListener('pointerover', (e) => {
            const target = e.target && e.target.closest ? e.target.closest('a, button.theme-toggle') : null;
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
            const target = e.target && e.target.closest ? e.target.closest('a, button.theme-toggle') : null;
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

    // Ask-me-about: play the preview video behind an item on hover
    const askList = document.querySelector('.ask-list');
    const askItems = document.querySelectorAll('.ask-item');

    if (askItems.length) {
        if (finePointer) {
            // While one item is active, the other titles stay hidden (opacity 0) so
            // the video reveal isn't competing with them. Moving the mouse bumps them
            // up to a half-visible affordance; once the mouse settles again they sink
            // back to 0. ASK_MOVE_IDLE_MS is how long the mouse must be still before
            // that happens.
            const ASK_MOVE_IDLE_MS = 200;
            let askMoveIdleTimer = 0;

            const clearAskMoveIdleTimer = () => {
                if (askMoveIdleTimer) {
                    window.clearTimeout(askMoveIdleTimer);
                    askMoveIdleTimer = 0;
                }
            };

            document.addEventListener('mousemove', () => {
                if (!askList || !askList.classList.contains('is-hovering')) return;
                askList.classList.add('is-moving');
                clearAskMoveIdleTimer();
                askMoveIdleTimer = window.setTimeout(() => {
                    askList.classList.remove('is-moving');
                }, ASK_MOVE_IDLE_MS);
            });

            askItems.forEach((item) => {
                const video = item.querySelector('.ask-item__video-el');
                const hitArea = item.querySelector('.ask-item__text');
                if (!video || !hitArea) return;

                // Hovering is scoped to the title text itself (not the gap or rule
                // below it), so there's a real dead zone between items instead of
                // the whole row (title + gap + rule) being one hoverable block.
                hitArea.addEventListener('mouseenter', () => {
                    item.classList.add('is-active');
                    askList?.classList.add('is-hovering');
                    video.currentTime = 0;
                    video.play().catch(() => {
                        // Autoplay can be rejected before the user has interacted with the page; ignore.
                    });
                });

                hitArea.addEventListener('mouseleave', () => {
                    item.classList.remove('is-active');
                    askList?.classList.remove('is-hovering', 'is-moving');
                    clearAskMoveIdleTimer();
                    video.pause();
                });
            });
        }
    }

    // Theme toggle functionality
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
