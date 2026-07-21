export function initializeSiteUi() {
    initializeLoader();
    initializeMenu();
    initializeCarousel();
    initializeAnnouncements();
}

function initializeLoader() {
    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        if (!loader) return;
        setTimeout(() => {
            loader.classList.add('hide');
            document.body.classList.add('loaded');
            setTimeout(() => loader.remove(), 600);
        }, 1400);
    });
}

function initializeMenu() {
    const toggle = document.getElementById('info-toggle');
    const panel = document.getElementById('topbar-info');
    if (!toggle || !panel) return;

    const setOpen = (isOpen) => {
        document.getElementById('hotbar').classList.toggle('open', isOpen);
        panel.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
    };

    toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        setOpen(!panel.classList.contains('open'));
    });
    document.getElementById('info-close')?.addEventListener('click', () => setOpen(false));
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.hotbar, .topbar-info')) setOpen(false);
    });
}

function initializeCarousel() {
    const image = document.getElementById('featured-image');
    const caption = document.getElementById('featured-caption');
    if (!image || !caption) return;

    const slides = [
        ['images/featured-2v1.jpg', 'https://static.wikia.nocookie.net/animebattlearenaaba/images/0/0c/2V1.jpg/revision/latest/scale-to-width-down/670?cb=20210406024101', 'Anime Battle Arena dynamic promotional art 1', 'ABA action showcased with fast-paced flair.'],
        ['images/featured-3000robux.jpeg', 'https://static.wikia.nocookie.net/animebattlearenaaba/images/2/2d/3000ROBUXSKIN.jpeg/revision/latest/scale-to-width-down/670?cb=20210606031339', 'ABA 3000 Robux skin promo art', 'A premium ABA skin reveal brightening the arena.'],
        ['images/featured-fightstronger.jpeg', 'https://static.wikia.nocookie.net/animebattlearenaaba/images/1/1d/FightAndBeStronger.jpeg/revision/latest/scale-to-width-down/670?cb=20210606022102', 'Fight and become stronger promotional image', 'Train harder and rise through ABA battles.'],
        ['images/featured-saiga.jpeg', 'https://static.wikia.nocookie.net/animebattlearenaaba/images/8/87/SaigaNoGetsugaro.jpeg/revision/latest/scale-to-width-down/670?cb=20210512005411', 'Saiga no Getsugaro ABA artwork', 'An intense ABA spotlight with vivid, dramatic energy.']
    ];
    let current = 0;
    const show = (index) => {
        current = (index + slides.length) % slides.length;
        const [source, fallback, alt, text] = slides[current];
        image.classList.add('fade-out');
        caption.classList.add('fade-out');
        setTimeout(() => {
            image.onerror = () => { image.onerror = null; image.src = fallback; };
            image.src = source;
            image.alt = alt;
            caption.textContent = text;
            image.classList.remove('fade-out');
            caption.classList.remove('fade-out');
        }, 400);
    };
    show(current);
    document.querySelectorAll('.carousel-btn').forEach((button) => button.addEventListener('click', () => show(current + (button.dataset.direction === 'next' ? 1 : -1))));
    setInterval(() => show(current + 1), 5000);
}

function initializeAnnouncements() {
    const toggle = document.getElementById('announcements-toggle');
    const sections = [document.getElementById('patch-notes'), document.getElementById('character-update-log')].filter(Boolean);
    if (!toggle || !sections.length) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
        const expanded = toggle.textContent.trim() !== 'Collapse';
        toggle.textContent = expanded ? 'Collapse' : 'Expand';
        toggle.setAttribute('aria-expanded', String(expanded));
        sections.forEach((section) => section.classList.toggle('visible', expanded));
    });
}
