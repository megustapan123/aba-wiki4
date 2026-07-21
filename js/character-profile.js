import { fallbackImage, fetchWikiArticle } from './wiki-api.js';

export function getProfileSkins(article) {
    const heading = [...article.querySelectorAll('h2, h3, h4')].find((item) => /^skins$/i.test(item.textContent.trim()));
    const section = [];
    for (let element = heading?.nextElementSibling; element && !['H2', 'H3', 'H4'].includes(element.tagName); element = element.nextElementSibling) section.push(element);
    const tab = [...article.querySelectorAll('.wds-tab__content')].find((item) => item.previousElementSibling?.querySelector('[data-hash="Skins"]'));
    const items = section.flatMap((element) => [...element.querySelectorAll('.wikia-gallery-item')]);
    const galleryItems = items.length ? items : [...(tab || article).querySelectorAll('.wikia-gallery-item')];

    return galleryItems.map((item) => item.querySelector('img[data-src], img[src]')).filter(Boolean).map((image) => {
        const captionElement = article.ownerDocument.createElement('div');
        captionElement.innerHTML = image.dataset.caption || image.alt || image.dataset.imageName || 'Character skin';
        return {
            source: image.dataset.src || image.src,
            caption: captionElement.textContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || 'Character skin'
        };
    }).filter((skin) => skin.source && !skin.source.startsWith('data:')).slice(0, 36);
}

export function renderSkinCard(grid, source, caption, index) {
    const card = document.createElement('figure');
    const image = document.createElement('img');
    const label = document.createElement('figcaption');
    card.className = 'skin-card';
    if (/legendary/i.test(caption)) card.classList.add('skin-card-legendary');
    image.src = source;
    image.alt = caption;
    image.loading = index > 7 ? 'lazy' : 'eager';
    label.textContent = caption;
    card.append(image, label);
    if (card.classList.contains('skin-card-legendary')) {
        const badge = document.createElement('span');
        badge.className = 'skin-legendary-badge';
        badge.textContent = 'Legendary';
        card.append(badge);
    }
    grid.append(card);
}

export function initializeMoveViewer() {
    const viewer = document.getElementById('move-viewer');
    const moves = document.getElementById('move-list');
    if (!viewer || !moves) return;
    const viewerImage = document.getElementById('move-viewer-image');
    const close = () => { viewer.hidden = true; viewerImage.removeAttribute('src'); };
    moves.addEventListener('click', (event) => {
        const trigger = event.target.closest('.move-preview-button');
        if (!trigger) return;
        const image = trigger.querySelector('img');
        viewerImage.src = image.currentSrc || image.src;
        viewerImage.alt = image.alt;
        document.getElementById('move-viewer-title').textContent = trigger.dataset.moveName;
        viewer.hidden = false;
        document.getElementById('move-viewer-close').focus();
    });
    document.getElementById('move-viewer-close').addEventListener('click', close);
    viewer.addEventListener('click', (event) => { if (event.target === viewer) close(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !viewer.hidden) close(); });
}

export async function loadCharacterProfile() {
    const profile = document.getElementById('profile-content');
    if (!profile) return;
    const loading = document.getElementById('profile-loading');
    const error = document.getElementById('profile-error');
    const parameters = new URLSearchParams(window.location.search);
    const pageTitle = parameters.get('page');
    const displayName = parameters.get('name') || pageTitle;
    if (!pageTitle) { loading.hidden = true; error.hidden = false; return; }

    try {
        const { page, article } = await fetchWikiArticle(pageTitle, 600);
        document.title = `${displayName} | ABA Wiki`;
        document.getElementById('profile-name').textContent = displayName;
        document.getElementById('profile-summary').textContent = getSummary(article);
        document.getElementById('profile-source').href = page.fullurl;
        const profileImage = document.getElementById('profile-image');
        profileImage.src = page.thumbnail?.source || fallbackImage;
        profileImage.alt = `${displayName} in Anime Battle Arena`;
        renderDetails(article);
        renderMoves(article);
        renderSkins(article);
        loading.hidden = true;
        profile.hidden = false;
    } catch (exception) {
        console.warn('Unable to load ABA character profile.', exception);
        loading.hidden = true;
        error.hidden = false;
    }
}

function getSummary(article) {
    return [...article.querySelectorAll('p')].map((item) => item.textContent.replace(/\s+/g, ' ').trim()).find((text) => text.length > 70 && !text.startsWith('Categories')) || 'No summary is currently available for this ABA character.';
}

function renderDetails(article) {
    const details = [...article.querySelectorAll('.pi-data')].map((row) => ({ label: row.querySelector('.pi-data-label')?.textContent.trim(), value: row.querySelector('.pi-data-value')?.textContent.replace(/\s+/g, ' ').trim() })).filter((item) => item.label && item.value).slice(0, 8);
    const list = document.getElementById('profile-details');
    if (!details.length) { list.innerHTML = '<dd>Details are not currently listed on the source page.</dd>'; return; }
    details.forEach(({ label, value }) => {
        const term = document.createElement('dt');
        const definition = document.createElement('dd');
        term.textContent = label;
        definition.textContent = value;
        list.append(term, definition);
    });
}

function getMoves(article) {
    let section = 'Moves';
    return [...article.querySelectorAll('h2, h3, p')].flatMap((element) => {
        if (['H2', 'H3'].includes(element.tagName)) { section = element.textContent.replace(/\s+/g, ' ').trim(); return []; }
        const text = element.textContent.replace(/\s+/g, ' ').trim();
        if (!text.includes('Properties:')) return [];
        const [description, properties] = text.split('Properties:');
        let container = element;
        let image;
        while (container && container !== article && !image) { image = container.querySelector('img[data-src], img[src]'); container = container.parentElement; }
        const caption = [image?.alt, image?.closest('figure')?.querySelector('figcaption')?.textContent, image?.closest('figure')?.textContent].map((value) => value?.match(/using "([^"]+)"/i)?.[1]).find(Boolean);
        const match = description.match(/^(.{1,80}?):\s*(.*)$/);
        return [{ name: match?.[1] || caption || 'Move', description: match?.[2] || description, properties: properties?.trim() || '', image: image?.dataset.src || image?.src || '', section }];
    });
}

function renderMoves(article) {
    const moves = getMoves(article);
    const list = document.getElementById('move-list');
    if (!moves.length) { list.textContent = 'This character\'s moveset is still being documented on the ABA Wiki.'; return; }
    const renderGroup = (group) => group.forEach((move, index) => {
        const card = document.createElement('article');
        card.className = 'move-card';
        if (group.length % 2 && index === group.length - 1) card.classList.add('move-card-wide');
        card.innerHTML = '<h3></h3><p></p><small></small>';
        if (move.image && !move.image.startsWith('data:')) {
            const button = document.createElement('button');
            const image = document.createElement('img');
            button.className = 'move-preview-button'; button.type = 'button'; button.dataset.moveName = move.name; button.setAttribute('aria-label', `Expand ${move.name} move preview`);
            image.className = 'move-preview'; image.src = move.image; image.alt = `${move.name} move preview`; image.loading = 'lazy';
            button.append(image); card.prepend(button);
        }
        card.querySelector('h3').textContent = move.name;
        card.querySelector('p').textContent = move.description;
        renderProperties(card.querySelector('small'), move.properties);
        list.append(card);
    });
    renderGroup(moves.filter((move) => !/transformation/i.test(move.section)));
    getTransformations(article).forEach((transformation) => {
        const card = document.createElement('article');
        card.className = 'transformation-card';
        card.innerHTML = '<div><p class="eyebrow">Transformation</p><h3></h3><p></p></div>';
        if (transformation.image) { const image = document.createElement('img'); image.src = transformation.image; image.alt = `${transformation.name} transformation preview`; image.loading = 'lazy'; card.prepend(image); }
        card.querySelector('h3').textContent = transformation.name;
        card.querySelector('div > p:last-child').textContent = transformation.description;
        list.append(card); renderGroup(moves.filter((move) => move.section === transformation.section));
    });
}

function getTransformations(article) {
    return [...article.querySelectorAll('h2, h3')].filter((heading) => /transformation/i.test(heading.textContent)).map((heading) => {
        const section = [];
        for (let element = heading.nextElementSibling; element && !['H2', 'H3'].includes(element.tagName); element = element.nextElementSibling) section.push(element);
        const images = section.flatMap((item) => [...item.querySelectorAll('img[data-src], img[src]')]);
        const image = images.find((item) => (item.dataset.src || item.src) && !(item.dataset.src || item.src).startsWith('data:'));
        const description = section.flatMap((item) => [...item.querySelectorAll('figcaption, p')]).map((item) => item.textContent.replace(/\s+/g, ' ').trim()).find((text) => text.length > 12 && !text.includes('Properties:'));
        return { name: heading.textContent.replace(/\s*\(Transformation\)\s*/i, '').trim(), section: heading.textContent.replace(/\s+/g, ' ').trim(), description: description || 'This character gains access to a transformed moveset.', image: image?.dataset.src || image?.src || '' };
    });
}

function renderProperties(element, properties) {
    const definitions = [[/Guardbreakd?/i, 'move-property-guardbreak', 'Guardbreak'], [/Blockable/i, 'move-property-blockable', 'Blockable'], [/Combo Extender/i, 'move-property-combo-extender', 'Combo Extender']];
    const labels = definitions.filter(([expression]) => expression.test(properties));
    let remaining = properties;
    labels.forEach(([expression, className, label]) => { remaining = remaining.replace(new RegExp(`${expression.source}\\s*(\\([^)]*\\))?\\s*\\|?`, 'gi'), ''); const badge = document.createElement('span'); badge.className = `move-property ${className}`; badge.textContent = label; element.append(badge); });
    remaining = remaining.replace(/^\s*\|\s*/, '').trim();
    if (labels.length && remaining) element.append(' | ');
    const damage = remaining.match(/Damage:\s*([^|]+)/i);
    if (!damage) { element.append(remaining); return; }
    element.append(remaining.slice(0, damage.index + 'Damage:'.length));
    const value = document.createElement('span'); value.className = 'move-damage-value'; value.textContent = damage[1].trim(); element.append(value, remaining.slice(damage.index + damage[0].length));
}

function renderSkins(article) {
    const skins = getProfileSkins(article);
    if (!skins.length) return;
    const grid = document.getElementById('skin-grid');
    skins.forEach(({ source, caption }, index) => renderSkinCard(grid, source, caption, index));
    document.getElementById('skins').hidden = false;
    document.getElementById('skins-nav').hidden = false;
}
