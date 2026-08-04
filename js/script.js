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
            // the video reveal has full focus. Rather than a fixed timer (which
            // treats a slow drift and a deliberate scan the same), this tracks the
            // cursor's actual speed: fast movement reads as "about to move to
            // another item" and reveals a half-visible affordance; resting or
            // drifting slowly reads as "reading this one" and stays hidden.
            //
            // Speed is smoothed (an exponential moving average) so a single quick
            // flick doesn't instantly snap it on/off, and the on/off thresholds are
            // different (hysteresis) so the affordance doesn't flicker while
            // cruising right around one boundary value. Once revealed, "hold" keeps
            // it visible for a beat after the cursor stops/slows before it starts
            // fading, so it doesn't feel like it's snapping away.
            //
            // All of these are tunable at runtime via askSettings - see
            // createAskTuningPanel() below, opened with ?tune in the URL.
            const askSettings = {
                speedOn: 0.1, // px/ms - crossing this reveals the affordance
                speedOff: 0.2, // px/ms - dropping below this arms the hide (subject to hold)
                smoothing: 0.35, // 0-1, weight given to each new speed sample
                idleMs: 100, // no mousemove at all for this long = treated as stopped
                holdMs: 850, // once revealed, how long to stay visible before fading
                transitionMs: 300, // text/rule opacity fade duration
                videoTransitionMs: 600, // video (+ scrim) crossfade duration - independent of the text fade
            };

            document.documentElement.style.setProperty('--ask-transition-ms', `${askSettings.transitionMs}ms`);
            document.documentElement.style.setProperty('--ask-video-transition-ms', `${askSettings.videoTransitionMs}ms`);

            let lastMoveX = 0;
            let lastMoveY = 0;
            let lastMoveTime = 0;
            let smoothedSpeed = 0;
            let askIdleTimer = 0;
            let askHideTimer = 0;

            const setAskMoving = (isMoving) => {
                askList?.classList.toggle('is-moving', isMoving);
            };

            const cancelScheduledHide = () => {
                if (askHideTimer) {
                    window.clearTimeout(askHideTimer);
                    askHideTimer = 0;
                }
            };

            const scheduleHide = () => {
                if (!askList || !askList.classList.contains('is-moving') || askHideTimer) return;
                askHideTimer = window.setTimeout(() => {
                    setAskMoving(false);
                    askHideTimer = 0;
                }, askSettings.holdMs);
            };

            const resetAskSpeedTracking = () => {
                lastMoveTime = 0;
                smoothedSpeed = 0;
                if (askIdleTimer) {
                    window.clearTimeout(askIdleTimer);
                    askIdleTimer = 0;
                }
                cancelScheduledHide();
            };

            // Hopping from one item straight to an adjacent one fires that item's
            // mouseleave immediately before the next item's mouseenter - within the
            // same tick. Resetting speed/hold state on every such hop is what made
            // switching between nav points feel jumpy: the reveal/hold would drop
            // and have to rebuild from zero at every boundary instead of riding
            // straight through. So the full list-level cleanup (dropping
            // is-hovering/is-moving and resetting speed tracking) is deferred a
            // beat; if another item's mouseenter cancels it first, it never runs
            // and the hold keeps ticking uninterrupted across the hop.
            let askLeaveCleanupTimer = 0;

            const cancelAskLeaveCleanup = () => {
                if (askLeaveCleanupTimer) {
                    window.clearTimeout(askLeaveCleanupTimer);
                    askLeaveCleanupTimer = 0;
                }
            };

            const scheduleAskLeaveCleanup = () => {
                cancelAskLeaveCleanup();
                askLeaveCleanupTimer = window.setTimeout(() => {
                    askList?.classList.remove('is-hovering', 'is-moving');
                    resetAskSpeedTracking();
                    askLeaveCleanupTimer = 0;
                }, 80);
            };

            document.addEventListener('mousemove', (event) => {
                if (!askList || !askList.classList.contains('is-hovering')) return;

                const now = performance.now();
                if (lastMoveTime) {
                    const dt = now - lastMoveTime;
                    if (dt > 0) {
                        const dx = event.clientX - lastMoveX;
                        const dy = event.clientY - lastMoveY;
                        const instantSpeed = Math.sqrt(dx * dx + dy * dy) / dt;
                        smoothedSpeed += (instantSpeed - smoothedSpeed) * askSettings.smoothing;
                    }
                }
                lastMoveX = event.clientX;
                lastMoveY = event.clientY;
                lastMoveTime = now;

                if (smoothedSpeed >= askSettings.speedOn) {
                    setAskMoving(true);
                    cancelScheduledHide();
                } else if (smoothedSpeed <= askSettings.speedOff) {
                    scheduleHide();
                }
                // Between the two thresholds, leave the current state (and any
                // pending scheduled hide) as-is.

                if (askIdleTimer) window.clearTimeout(askIdleTimer);
                askIdleTimer = window.setTimeout(() => {
                    // No movement at all for a beat - the cursor has genuinely
                    // stopped, so speed is zero and the affordance is scheduled to hide.
                    smoothedSpeed = 0;
                    lastMoveTime = 0;
                    scheduleHide();
                }, askSettings.idleMs);
            });

            // Scrolling while hovering an item (e.g. trackpad/wheel with the cursor
            // held still) doesn't fire any mousemove events, so the speed tracking
            // above would never see it and the affordance would stay hidden even
            // though the user is clearly still actively browsing. Treat any scroll
            // the same as cursor movement at (at least) the reveal threshold, and
            // ride the exact same idle timer used by mousemove, so scrolling and
            // moving the cursor cooperate naturally - whichever happens most
            // recently is what keeps the reveal alive.
            window.addEventListener('scroll', () => {
                if (!askList || !askList.classList.contains('is-hovering')) return;

                smoothedSpeed = Math.max(smoothedSpeed, askSettings.speedOn);
                setAskMoving(true);
                cancelScheduledHide();
                // Re-baseline the movement clock (not the cursor position, which
                // hasn't actually changed) so that if a real mousemove follows
                // right after, it doesn't compute its speed against a stale,
                // possibly much older timestamp and read as artificially slow.
                lastMoveTime = performance.now();

                if (askIdleTimer) window.clearTimeout(askIdleTimer);
                askIdleTimer = window.setTimeout(() => {
                    smoothedSpeed = 0;
                    lastMoveTime = 0;
                    scheduleHide();
                }, askSettings.idleMs);
            }, { passive: true });

            askItems.forEach((item) => {
                const video = item.querySelector('.ask-item__video-el');
                if (!video) return;

                // Hovering is scoped to the whole item (title + gap + rule), and
                // css/styles.scss gives each item half the list's inter-item gap as
                // padding so neighboring items' hover areas meet with no dead zone
                // between them - the cursor is always "in" whichever item it's
                // closest to.
                item.addEventListener('mouseenter', () => {
                    // Still within the list - this is a hop between nav points, not
                    // a real exit, so let any in-flight hold/reveal keep going.
                    cancelAskLeaveCleanup();
                    item.classList.add('is-active');
                    askList?.classList.add('is-hovering');
                    video.currentTime = 0;
                    video.play().catch(() => {
                        // Autoplay can be rejected before the user has interacted with the page; ignore.
                    });
                });

                item.addEventListener('mouseleave', () => {
                    item.classList.remove('is-active');
                    video.pause();
                    scheduleAskLeaveCleanup();
                });
            });

            // Live tuning panel: append ?tune to the URL to show it. Lets you drag
            // sliders and see the hover affordance react immediately, without
            // touching code. Read the values out of askSettings once you land on
            // numbers you like.
            if (new URLSearchParams(window.location.search).has('tune')) {
                createAskTuningPanel(askSettings, (key, value) => {
                    if (key === 'transitionMs') {
                        document.documentElement.style.setProperty('--ask-transition-ms', `${value}ms`);
                    } else if (key === 'videoTransitionMs') {
                        document.documentElement.style.setProperty('--ask-video-transition-ms', `${value}ms`);
                    }
                });
            }
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

// Floating slider panel for live-tuning the "Ask me about" hover affordance.
// Only ever built when ?tune is in the URL (see the call site above) - never
// shown to regular visitors. Function declarations are hoisted, so it's
// callable from inside the DOMContentLoaded handler even though it's defined
// down here.
function createAskTuningPanel(settings, onChange) {
    const controls = [
        { key: 'speedOn', label: 'Speed on (px/ms)', min: 0.05, max: 2, step: 0.05 },
        { key: 'speedOff', label: 'Speed off (px/ms)', min: 0.02, max: 1, step: 0.02 },
        { key: 'smoothing', label: 'Smoothing', min: 0.05, max: 1, step: 0.05 },
        { key: 'idleMs', label: 'Idle detect (ms)', min: 20, max: 400, step: 10 },
        { key: 'holdMs', label: 'Hold before fade (ms)', min: 0, max: 1500, step: 25 },
        { key: 'transitionMs', label: 'Text fade transition (ms)', min: 50, max: 800, step: 10 },
        { key: 'videoTransitionMs', label: 'Video crossfade (ms)', min: 100, max: 1500, step: 25 },
    ];

    const panel = document.createElement('div');
    panel.id = 'ask-tune-panel';
    panel.innerHTML = `
        <style>
            #ask-tune-panel {
                position: fixed;
                bottom: 16px;
                right: 16px;
                z-index: 9999;
                width: 260px;
                padding: 14px 16px;
                background: rgba(20, 20, 20, 0.88);
                color: #fff;
                font: 12px/1.4 -apple-system, BlinkMacSystemFont, sans-serif;
                border-radius: 10px;
                backdrop-filter: blur(8px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
            }
            #ask-tune-panel h3 {
                margin: 0 0 10px;
                font-size: 13px;
                font-weight: 600;
                letter-spacing: 0.02em;
            }
            #ask-tune-panel .ask-tune-row {
                margin-bottom: 10px;
            }
            #ask-tune-panel .ask-tune-row:last-child {
                margin-bottom: 0;
            }
            #ask-tune-panel label {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
                opacity: 0.85;
            }
            #ask-tune-panel input[type='range'] {
                width: 100%;
            }
            #ask-tune-panel .ask-tune-value {
                font-variant-numeric: tabular-nums;
            }
        </style>
        <h3>Ask hover tuning</h3>
        ${controls.map((c) => `
            <div class="ask-tune-row">
                <label for="ask-tune-${c.key}">
                    <span>${c.label}</span>
                    <span class="ask-tune-value" data-value-for="${c.key}">${settings[c.key]}</span>
                </label>
                <input type="range" id="ask-tune-${c.key}" data-key="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${settings[c.key]}" />
            </div>
        `).join('')}
    `;
    document.body.appendChild(panel);

    panel.querySelectorAll('input[type="range"]').forEach((input) => {
        input.addEventListener('input', () => {
            const key = input.dataset.key;
            const value = parseFloat(input.value);
            settings[key] = value;
            const valueEl = panel.querySelector(`[data-value-for="${key}"]`);
            if (valueEl) valueEl.textContent = value;
            if (onChange) onChange(key, value);
        });
    });
}
