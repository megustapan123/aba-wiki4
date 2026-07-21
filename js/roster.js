import { getCharacterProfileUrl, rosterPageTitles } from './character-data.js';
import { fetchWikiPages } from './wiki-api.js';

export async function initializeRoster() {
    linkStaticRosterProfiles();
    await addRosterPortraits();
}

function linkStaticRosterProfiles() {
    document.querySelectorAll('.character-tile[href*="fandom.com/wiki/"]').forEach((tile) => {
        const wikiPath = new URL(tile.href).pathname.split('/wiki/')[1];
        const pageTitle = decodeURIComponent(wikiPath).replaceAll('_', ' ');
        const name = tile.querySelector('span')?.textContent.trim() || pageTitle;
        tile.href = getCharacterProfileUrl(name, pageTitle);
        tile.removeAttribute('target');
        tile.removeAttribute('rel');
    });
}

async function addRosterPortraits() {
    const tags = [...document.querySelectorAll('.tag-row > .tag')].filter((tag) => tag.tagName === 'SPAN');
    if (!tags.length) return;

    const characters = tags.map((tag) => ({
        name: tag.textContent.trim(),
        tag,
        pageTitle: rosterPageTitles[tag.textContent.trim()] || tag.textContent.trim()
    }));
    const pages = new Map();

    try {
        for (let index = 0; index < characters.length; index += 45) {
            const batch = [...new Set(characters.slice(index, index + 45).map((character) => character.pageTitle))];
            (await fetchWikiPages(batch, 300)).forEach((page) => pages.set(page.title, page));
        }
    } catch (error) {
        console.warn('Unable to load ABA roster portraits.', error);
        return;
    }

    characters.forEach(({ name, tag, pageTitle }) => {
        const page = pages.get(pageTitle);
        if (!page?.thumbnail?.source || !page.fullurl) return;
        const tile = document.createElement('a');
        const portrait = document.createElement('img');
        const label = document.createElement('span');
        tile.className = 'character-tile';
        tile.href = getCharacterProfileUrl(name, page.title);
        portrait.src = page.thumbnail.source;
        portrait.alt = `${name} in Anime Battle Arena`;
        label.textContent = name;
        tile.append(portrait, label);
        tag.replaceWith(tile);
    });

    document.querySelectorAll('.tag-row:not(:has(> .tag))').forEach((row) => {
        row.classList.replace('tag-row', 'character-grid');
    });
}
