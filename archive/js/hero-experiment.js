/**
 * Hero Section Experiment
 * Per-letter proximity effect
 */

document.addEventListener('DOMContentLoaded', () => {
    const cursor = document.querySelector('.site-cursor');
    const intensitySlider = document.querySelector('#intensity');
    const radiusSlider = document.querySelector('#radius');

    // Configuration
    const config = {
        weight: { min: 100, max: 900, default: 300 },
        width: { min: 50, max: 150, default: 100 },
        proximity: {
            radius: parseInt(radiusSlider.value),
            intensity: parseInt(intensitySlider.value) / 100
        }
    };

    // UI Updates
    intensitySlider.addEventListener('input', (e) => config.proximity.intensity = e.target.value / 100);
    radiusSlider.addEventListener('input', (e) => config.proximity.radius = parseInt(e.target.value));

    // Split text into spans, preserving HTML structure (like <br> tags)
    function splitElement(el) {
        const nodes = Array.from(el.childNodes);
        el.innerHTML = '';

        nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                const fragment = document.createDocumentFragment();
                [...text].forEach(char => {
                    // Ignore actual character newlines in the code, but keep spaces
                    if (char === '\n' || char === '\r') return;

                    const span = document.createElement('span');
                    span.className = 'char';
                    span.innerText = char === ' ' ? '\u00A0' : char;
                    fragment.appendChild(span);
                });
                el.appendChild(fragment);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // If it's a <br>, just re-append it without splitting
                if (node.tagName === 'BR') {
                    el.appendChild(node);
                } else if (node.classList.contains('split-text') || node.children.length > 0 || node.textContent.trim().length > 0) {
                    // Recurse into elements to find more text nodes
                    splitElement(node);
                    el.appendChild(node);
                } else {
                    el.appendChild(node);
                }
            }
        });
    }

    const mainTitle = document.querySelector('.intro-title.split-text');
    if (mainTitle) splitElement(mainTitle);

    const characters = document.querySelectorAll('.char');

    const updateEffect = (e) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;

        // Update cursor position
        if (cursor) {
            cursor.style.left = `${clientX}px`;
            cursor.style.top = `${clientY}px`;
        }

        // Global mouse influence (baseline for weight/width)
        const xPercent = clientX / innerWidth;
        const yPercent = clientY / innerHeight;

        const targetWidth = config.width.min + (config.width.max - config.width.min) * xPercent;
        const targetWeight = config.weight.min + (config.weight.max - config.weight.min) * yPercent;

        characters.forEach(char => {
            const rect = char.getBoundingClientRect();
            const charX = rect.left + rect.width / 2;
            const charY = rect.top + rect.height / 2;

            const dist = Math.sqrt((clientX - charX) ** 2 + (clientY - charY) ** 2);

            // Calculate proximity influence (0 to 1)
            // Gaussian-like falloff
            let influence = Math.exp(-(dist ** 2) / (2 * (config.proximity.radius / 2) ** 2));
            influence *= config.proximity.intensity;

            // Blend between default and target based on influence
            const currentWeight = config.weight.default + (targetWeight - config.weight.default) * influence;
            const currentWidth = config.width.default + (targetWidth - config.width.default) * influence;

            char.style.setProperty('--char-wght', currentWeight);
            char.style.setProperty('--char-wdth', currentWidth);
        });
    };

    window.addEventListener('mousemove', updateEffect);

    // Initial show cursor
    window.addEventListener('mouseover', () => {
        if (cursor) cursor.style.opacity = '1';
    }, { once: true });
});
