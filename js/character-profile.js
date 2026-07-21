import { fallbackImage, fetchWikiArticle } from './wiki-api.js';

export function getProfileSkins(article) {
    const heading = [...article.querySelectorAll('h2, h3, h4')].find((item) => /^skins$/i.test(item.textContent.trim()));
    const section = [];
    for (let element = heading?.nextElementSibling; element && !['H2', 'H3', 'H4'].includes(element.tagName); element = element.nextElementSibling) section.push(element);
    const tab = [...article.querySelectorAll('.wds-tab__content')].find((item) => item.previousElementSibling?.querySelector('[data-hash="Skins"]'));
    const items = section.flatMap((element) => [...element.querySelectorAll('.wikia-gallery-item')]);
    const galleryItems = items.length ? items : [...(tab || article).querySelectorAll('.wikia-gallery-item')];
    return extractSkins(article, galleryItems);
}

function extractSkins(article, galleryItems) {
    const seen = new Set();
    const skins = galleryItems.map((item) => item.querySelector('img[data-src], img[src]')).filter(Boolean).map((image) => {
        const captionElement = article.ownerDocument.createElement('div');
        captionElement.innerHTML = image.dataset.caption || image.alt || image.dataset.imageName || 'Character skin';
        return {
            source: image.dataset.src || image.src,
            key: image.dataset.imageKey || image.dataset.imageName || image.dataset.src || image.src,
            caption: captionElement.textContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || 'Character skin'
        };
    }).filter((skin) => {
        if (!skin.source || skin.source.startsWith('data:') || seen.has(skin.key)) return false;
        seen.add(skin.key);
        return true;
    }).slice(0, 36);
    const variants = new Set();
    return skins.filter((skin) => {
        const match = skin.caption.match(/\b(?:\d+(?:st|nd|rd|th)?|gold|legendary|default)\s+skin\b/i);
        const identity = match?.[0].toLowerCase();
        if (!identity) return true;
        if (variants.has(identity)) return false;
        variants.add(identity);
        return true;
    });
}

function getProfileSkinGroups(article) {
    const heading = [...article.querySelectorAll('h2, h3, h4')].find((item) => /^skins$/i.test(item.textContent.trim()));
    const tabber = heading?.nextElementSibling?.matches('.wds-tabber') ? heading.nextElementSibling : null;
    if (!tabber) return [{ label: 'Skins', skins: getProfileSkins(article) }];
    const labels = [...tabber.querySelectorAll(':scope > .wds-tabs__wrapper .wds-tabs__tab-label')].map((item) => item.textContent.trim());
    return [...tabber.querySelectorAll(':scope > .wds-tab__content')].map((content, index) => ({
        label: labels[index] || `Skins ${index + 1}`,
        skins: extractSkins(article, [...content.querySelectorAll('.wikia-gallery-item')])
    })).filter((group) => group.skins.length);
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
    const cleanMoveName = (value) => value.replace(/[\[\]]/g, '').replace(/:\s*/g, ': ').replace(/\s+/g, ' ').trim();
    const moves = [...article.querySelectorAll('h2, h3, p')].flatMap((element) => {
        if (['H2', 'H3'].includes(element.tagName)) { section = element.textContent.replace(/\s+/g, ' ').trim(); return []; }
        const text = element.textContent.replace(/\s+/g, ' ').trim();
        if (!text.includes('Properties:')) return [];
        const [description, properties] = text.split('Properties:');
        let nameElement = element.previousElementSibling;
        while (nameElement && (!nameElement.matches('p, li') || !nameElement.querySelector('b, strong'))) nameElement = nameElement.previousElementSibling;
        const strongName = nameElement?.querySelector('b, strong') ? cleanMoveName(nameElement.querySelector('b, strong').textContent).replace(/:$/, '') : '';
        const match = description.match(/^\s*(?:\[)?(.{1,80}?)(?:\])?\s*:\s*(.*)$/);
        const name = match?.[1] ? cleanMoveName(match[1]) : strongName || 'Move';
        const descriptionText = match?.[2] || description.replace(/^\s*\[[^\]]+\]\s*/, '').trim();
        const image = [...article.querySelectorAll('img[data-src], img[src]')].find((item) => {
            const imageText = `${item.alt} ${item.dataset.caption || ''}`.replace(/\s+/g, ' ');
            const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normalize(imageText).includes(normalize(name));
        });
        return [{ name, description: descriptionText, properties: properties?.trim() || '', image: image?.dataset.src || image?.src || '', section }];
    });
    const seen = new Set();
    return moves.filter((move) => {
        const key = `${move.section}|${move.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
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
    const transformations = getTransformations(article);
    const transformationsBySection = new Map(transformations.map((transformation) => [transformation.section, transformation]));
    const renderedSections = new Set();
    const renderTransformation = (transformation) => {
        const card = document.createElement('article');
        card.className = 'transformation-card';
        card.innerHTML = '<div><p class="eyebrow">Transformation</p><h3></h3><p></p></div>';
        if (transformation.media) {
            const media = document.createElement(transformation.mediaType === 'video' ? 'video' : 'img');
            media.src = transformation.media;
            if (media.tagName === 'VIDEO') { media.controls = true; media.preload = 'metadata'; media.muted = true; media.playsInline = true; }
            else { media.alt = `${transformation.name} transformation preview`; media.loading = 'lazy'; }
            card.prepend(media);
        }
        card.querySelector('h3').textContent = transformation.name;
        card.querySelector('div > p:last-child').textContent = transformation.description;
        list.append(card);
    };

    [...article.querySelectorAll('h2, h3')].forEach((heading) => {
        const section = heading.textContent.replace(/\s+/g, ' ').trim();
        const transformation = transformationsBySection.get(section);
        if (transformation) {
            renderTransformation(transformation);
            renderedSections.add(section);
            transformation.moveSections.forEach((moveSection) => {
                renderGroup(moves.filter((move) => move.section === moveSection));
                renderedSections.add(moveSection);
            });
            return;
        }
        if (renderedSections.has(section)) return;
        const sectionMoves = moves.filter((move) => move.section === section);
        if (sectionMoves.length) renderGroup(sectionMoves);
        renderedSections.add(section);
    });
}

function getTransformations(article) {
    const headings = [...article.querySelectorAll('h2, h3')];
    const getSectionName = (heading) => heading.textContent.replace(/\s+/g, ' ').trim();
    return headings.filter((heading) => /transformation/i.test(heading.textContent)).map((heading) => {
        const section = [];
        for (let element = heading.nextElementSibling; element && !['H2', 'H3'].includes(element.tagName); element = element.nextElementSibling) section.push(element);
        const mediaItems = section.flatMap((item) => [...item.querySelectorAll('img[data-src], img[src], video[src]')]);
        const media = mediaItems.find((item) => (item.dataset.src || item.currentSrc || item.src) && !(item.dataset.src || item.currentSrc || item.src).startsWith('data:'));
        const description = section.flatMap((item) => [...item.querySelectorAll('figcaption, p')]).map((item) => item.textContent.replace(/\s+/g, ' ').trim()).find((text) => text.length > 12 && !text.includes('Properties:'));
        const nextHeading = headings[headings.indexOf(heading) + 1];
        const moveSections = nextHeading && /(?:awakening|transformed|mode).*moves/i.test(nextHeading.textContent) ? [getSectionName(nextHeading)] : [];
        return {
            name: heading.textContent.replace(/\s*\(Transformation\)\s*/i, '').replace(/[\[\]]/g, '').trim(),
            section: getSectionName(heading),
            moveSections,
            description: description || 'This character gains access to a transformed moveset.',
            media: media?.dataset.src || media?.currentSrc || media?.src || '',
            mediaType: media?.tagName === 'VIDEO' ? 'video' : 'image'
        };
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
    const groups = getProfileSkinGroups(article);
    if (!groups.length) return;
    const container = document.getElementById('skin-grid');
    container.className = 'skin-tabs';
    container.replaceChildren();
    const tabList = document.createElement('div');
    tabList.className = 'skin-tab-list';
    tabList.setAttribute('role', 'tablist');
    const panels = groups.map((group, index) => {
        const tab = document.createElement('button');
        const panel = document.createElement('div');
        const tabId = `skin-tab-${index}`;
        const panelId = `skin-panel-${index}`;
        tab.className = 'skin-tab'; tab.type = 'button'; tab.textContent = group.label;
        tab.id = tabId; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', panelId); tab.setAttribute('aria-selected', String(index === 0));
        panel.className = 'skin-grid'; panel.id = panelId; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tabId); panel.hidden = index !== 0;
        group.skins.forEach(({ source, caption }, skinIndex) => renderSkinCard(panel, source, caption, skinIndex));
        tab.addEventListener('click', () => panels.forEach(({ tab: otherTab, panel: otherPanel }) => {
            const selected = otherTab === tab;
            otherTab.setAttribute('aria-selected', String(selected));
            otherPanel.hidden = !selected;
        }));
        tabList.append(tab);
        return { tab, panel };
    });
    container.append(tabList, ...panels.map(({ panel }) => panel));
    document.getElementById('skins').hidden = false;
    document.getElementById('skins-nav').hidden = false;
}
