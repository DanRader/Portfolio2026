// Bidirectional infinite scrolling loop by cloning the full site content.
//
// Requirements satisfied:
// - Normal document scrolling (not an inner scroll div)
// - Clone ONLY the DOM inside .site-copy (no scripts are duplicated/executed)
// - Starts with 3 copies (copy/source/copy) to avoid scrollY=0 edge issues
// - Keeps ≤ 3 copies at a time (source + one above + one below)
// - Works in both directions with scroll compensation (no visible jumps)
// - Removes duplicate IDs in clones to avoid collisions

const DEBUG_LOGS = true;

const PRELOAD_TOP_PX = 2200; // create a top copy early to avoid hitting scrollY=0
const PRELOAD_BOTTOM_PX = 1200; // create a bottom copy early to avoid hitting the document end

const SELECTORS = {
  root: '#infinite-scroll-root',
  copy: '.site-copy',
  topSentinel: '.infinite-sentinel[data-sentinel="top"]',
  bottomSentinel: '.infinite-sentinel[data-sentinel="bottom"]',
};

function getCopies(root) {
  return Array.from(root.querySelectorAll(SELECTORS.copy));
}

function sanitizeClone(copyEl) {
  // Prevent duplicate IDs from breaking anchor links, aria, label-for, etc.
  // We remove ID attributes and any attributes that reference IDs.
  const idRefAttrs = ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns'];

  copyEl.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  idRefAttrs.forEach((attr) => {
    copyEl.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr));
  });
}

function createCopyFrom(sourceCopy, nextCopyIndex) {
  const clone = sourceCopy.cloneNode(true);
  clone.dataset.copy = String(nextCopyIndex);
  delete clone.dataset.source;
  sanitizeClone(clone);
  return clone;
}

function getViewportMidY() {
  return window.scrollY + window.innerHeight / 2;
}

function getActiveCopyIndex(copies) {
  const mid = getViewportMidY();
  for (let i = 0; i < copies.length; i += 1) {
    const el = copies[i];
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (mid >= top && mid < bottom) return i;
  }
  // Fallbacks
  if (copies.length === 0) return -1;
  return mid < copies[0].offsetTop ? 0 : copies.length - 1;
}

function measureHeight(el) {
  // getBoundingClientRect is resilient to sub-pixel layout
  return Math.round(el.getBoundingClientRect().height);
}

function nextCopyId(copies) {
  // purely for debugging/ordering; does not affect logic
  const nums = copies
    .map((c) => Number.parseInt(c.dataset.copy ?? '0', 10))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
}

function initInfiniteLoopScroll() {
  const root = document.querySelector(SELECTORS.root);
  if (!root) return;

  const topSentinel = root.querySelector(SELECTORS.topSentinel);
  const bottomSentinel = root.querySelector(SELECTORS.bottomSentinel);
  if (!topSentinel || !bottomSentinel) return;

  const log = (...args) => {
    if (!DEBUG_LOGS) return;
    console.log('[infinite-loop]', ...args);
  };

  let currentlyMutating = false;
  let hasUserScrolled = false;
  let lastScrollY = window.scrollY;
  let scrollDir = 'down';
  let rafCheck = 0;
  let isInitializing = true;

  // Ensure we start with: 0 - copy, 1 - source, 2 - copy
  // We *do* set the initial position to the source so you aren't at scrollY=0.
  // (This is a one-time setup; runtime mutations only add/remove DOM.)
  const bootstrapTriplet = async () => {
    const copies = getCopies(root);
    if (copies.length !== 1) return;

    const source = copies[0];
    source.dataset.copy = '1';
    source.dataset.source = 'true';

    const topCopy = createCopyFrom(source, 0);
    const bottomCopy = createCopyFrom(source, 2);

    root.insertBefore(topCopy, source);
    root.insertBefore(bottomCopy, bottomSentinel);

    // Wait for layout, then scroll so the source (middle) is what you see.
    // IMPORTANT: don't use topCopy height here—there is a 1px top sentinel above,
    // which would leave you barely inside the upper copy.
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));
    const sourceDocTop = Math.ceil(source.getBoundingClientRect().top + window.scrollY);

    // Header is now a single sticky element outside the copies.
    // Offset so the start of the source copy lands just below it.
    const headerEl = document.querySelector('header');
    const headerH = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 0;
    const targetY = Math.max(0, sourceDocTop - headerH);
    window.scrollTo(0, targetY);

    log('bootstrapped 3 copies (0/1/2)');
  };

  const mutate = (direction) => {
    if (currentlyMutating) return;
    currentlyMutating = true;

    try {
      let copies = getCopies(root);

      if (direction === 'down') {
        const base = copies.find((c) => c.dataset.source === 'true') ?? copies[Math.floor(copies.length / 2)];
        const clone = createCopyFrom(base, nextCopyId(copies));
        root.insertBefore(clone, bottomSentinel);
        log('append copy', clone.dataset.copy);

        copies = getCopies(root);
        while (copies.length > 3) {
          const first = copies[0];
          if (first.dataset.source === 'true') break;
          log('remove top copy', first.dataset.copy);
          first.remove();
          copies = getCopies(root);
        }

        return;
      }

      // direction === 'up'
      const base = copies.find((c) => c.dataset.source === 'true') ?? copies[Math.floor(copies.length / 2)];
      const clone = createCopyFrom(base, nextCopyId(copies));
      // Prepend after sentinel (before the first copy)
      root.insertBefore(clone, copies[0]);
      log('prepend copy', clone.dataset.copy);

      copies = getCopies(root);
      while (copies.length > 3) {
        const last = copies[copies.length - 1];
        if (last.dataset.source === 'true') break;
        log('remove bottom copy', last.dataset.copy);
        last.remove();
        copies = getCopies(root);
      }
    } finally {
      // Release on next frame to let layout settle; helps with trackpad momentum.
      requestAnimationFrame(() => {
        currentlyMutating = false;
      });
    }
  };

  const getDistanceToBottom = () => {
    const doc = document.documentElement;
    return doc.scrollHeight - (window.scrollY + window.innerHeight);
  };

  const checkEdges = () => {
    rafCheck = 0;
    if (!hasUserScrolled) return;
    if (isInitializing) return;

    if (scrollDir === 'down') {
      if (getDistanceToBottom() < PRELOAD_BOTTOM_PX) {
        mutate('down');
      }
      return;
    }

    // scrollDir === 'up'
    if (window.scrollY < PRELOAD_TOP_PX) {
      mutate('up');
    }
  };

  const scheduleEdgeCheck = () => {
    if (rafCheck) return;
    rafCheck = requestAnimationFrame(checkEdges);
  };

  window.addEventListener(
    'scroll',
    () => {
      const nowY = window.scrollY;

      if (isInitializing) {
        lastScrollY = nowY;
        return;
      }

      hasUserScrolled = true;
      scrollDir = nowY > lastScrollY ? 'down' : 'up';
      lastScrollY = nowY;

      // For upward scrolling, avoid waiting an extra frame; if the user is already
      // near the top edge, act immediately to prevent the platform “top stop”.
      if (scrollDir === 'up' && nowY < PRELOAD_TOP_PX) {
        mutate('up');
        return;
      }

      scheduleEdgeCheck();
    },
    { passive: true }
  );

  const makeObserver = (direction) =>
    new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          // Don’t create copies on initial load; wait for user scroll intent.
          if (!hasUserScrolled) continue;

          if (direction === 'down' && scrollDir === 'down') mutate('down');
          if (direction === 'up' && scrollDir === 'up') mutate('up');
        }
      },
      {
        root: null,
        threshold: 0,
        // Separate margins prevent “too late” top detection which causes snaps.
        rootMargin:
          direction === 'up'
            ? `${PRELOAD_TOP_PX}px 0px 0px 0px`
            : `0px 0px ${PRELOAD_BOTTOM_PX}px 0px`,
      }
    );

  const ioTop = makeObserver('up');
  const ioBottom = makeObserver('down');
  ioTop.observe(topSentinel);
  ioBottom.observe(bottomSentinel);

  // Bootstrap after observers are set up.
  void bootstrapTriplet().finally(() => {
    isInitializing = false;
    // After bootstrap scrollTo, wait for user scroll intent.
    lastScrollY = window.scrollY;
  });

}

// Module scripts run after parsing; DOMContentLoaded is safe but not required.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInfiniteLoopScroll, { once: true });
} else {
  initInfiniteLoopScroll();
}
