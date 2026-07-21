import { fallbackImage, fetchWikiArticle, fetchWikiPages } from './wiki-api.js';

export async function initializeMaps() {
    await Promise.all([loadMapProfile(), addMapThumbnails()]);
}

async function addMapThumbnails() {
    const tiles = [...document.querySelectorAll('.map-tile[data-map-title]')];
    if (!tiles.length) return;
    try {
        const pages = new Map();
        for (let index = 0; index < tiles.length; index += 45) {
            const titles = tiles.slice(index, index + 45).map((tile) => tile.dataset.mapTitle);
            (await fetchWikiPages(titles, 500)).forEach((page) => pages.set(page.title, page));
        }
        tiles.forEach((tile) => {
            const page = pages.get(tile.dataset.mapTitle);
            if (!page?.fullurl) return;
            tile.href = `map.html?${new URLSearchParams({ map: tile.dataset.mapTitle }).toString()}`;
            if (page.thumbnail?.source) {
                const image = document.createElement('img');
                image.src = page.thumbnail.source;
                image.alt = `${tile.textContent.trim()} map in Anime Battle Arena`;
                tile.prepend(image);
            }
        });
    } catch (error) { console.warn('Unable to load ABA map thumbnails.', error); }
}

async function loadMapProfile() {
    const content = document.getElementById('map-content');
    if (!content) return;
    const loading = document.getElementById('map-loading');
    const error = document.getElementById('map-error');
    const pageTitle = new URLSearchParams(window.location.search).get('map');
    if (!pageTitle) { loading.hidden = true; error.hidden = false; return; }
    try {
        const { page, article } = await fetchWikiArticle(pageTitle, 900);
        const sections = getArticleSections(article);
        const summary = [...article.querySelectorAll(':scope > p')].map((item) => item.textContent.replace(/\s+/g, ' ').trim()).find(Boolean) || 'Explore this Anime Battle Arena map.';
        document.title = `${pageTitle} | ABA Wiki`;
        document.getElementById('map-name').textContent = pageTitle;
        document.getElementById('map-summary').textContent = summary;
        document.getElementById('map-source').href = page.fullurl;
        const image = document.getElementById('map-image'); image.src = page.thumbnail?.source || fallbackImage; image.alt = `${pageTitle} map in Anime Battle Arena`;
        if (sections.length) {
            const list = document.getElementById('map-section-list');
            sections.forEach((section) => renderSection(list, section, pageTitle));
            document.getElementById('map-sections').hidden = false;
            document.getElementById('map-sections-nav').hidden = false;
        }
        loading.hidden = true; content.hidden = false;
    } catch (exception) { console.warn('Unable to load ABA map profile.', exception); loading.hidden = true; error.hidden = false; }
}

function getArticleSections(article) {
    return [...article.querySelectorAll('h2')].map((heading) => {
        const content = [];
        for (let element = heading.nextElementSibling; element && element.tagName !== 'H2'; element = element.nextElementSibling) if (['P', 'FIGURE', 'UL', 'OL'].includes(element.tagName)) content.push(element);
        return {
            heading: heading.textContent.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim(),
            text: content.filter((item) => item.tagName !== 'FIGURE').map((item) => item.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean),
            image: content.flatMap((item) => [...item.querySelectorAll('img[data-src], img[src]')]).map((item) => item.dataset.src || item.src).find((source) => source && !source.startsWith('data:'))
        };
    }).filter((section) => section.heading && (section.text.length || section.image));
}

function renderSection(list, section, pageTitle) {
    const article = document.createElement('article'); article.className = 'map-article-section';
    const title = document.createElement('h3'); title.textContent = section.heading; article.append(title);
    if (section.image) { const image = document.createElement('img'); image.src = section.image; image.alt = `${section.heading} on ${pageTitle}`; image.loading = 'lazy'; article.append(image); }
    section.text.forEach((text) => { const paragraph = document.createElement('p'); paragraph.textContent = text; article.append(paragraph); });
    list.append(article);
}
