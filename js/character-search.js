import { cacheCharacterTitles, getCachedCharacterTitles, getCharacterProfileUrl, getSearchLabel } from './character-data.js';
import { fetchCharacterTitles } from './wiki-api.js';

export function initializeCharacterSearch() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;

    const search = document.createElement('form');
    search.className = 'site-search';
    search.setAttribute('role', 'search');
    search.innerHTML = '<label class="visually-hidden" for="character-search">Search characters</label><input id="character-search" type="search" placeholder="Search characters" autocomplete="off"><div class="search-results" hidden></div>';
    topbar.insertBefore(search, document.getElementById('hotbar'));

    const input = search.querySelector('input');
    const results = search.querySelector('.search-results');
    let characters = getCachedCharacterTitles();
    let activeIndex = -1;
    const open = (title) => { window.location.href = getCharacterProfileUrl(getSearchLabel(title), title); };
    const ranked = (query) => characters.filter((title) => title.toLowerCase().includes(query)).sort((first, second) => Number(second.toLowerCase().startsWith(query)) - Number(first.toLowerCase().startsWith(query)) || first.localeCompare(second)).slice(0, 5);
    const show = () => {
        const matches = input.value.trim() ? ranked(input.value.trim().toLowerCase()) : characters.slice(0, 5);
        activeIndex = -1;
        results.replaceChildren(...matches.map((title) => {
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'search-result';
            option.textContent = title;
            option.addEventListener('click', () => open(title));
            return option;
        }));
        results.hidden = !matches.length;
    };

    input.addEventListener('focus', show);
    input.addEventListener('input', show);
    input.addEventListener('keydown', (event) => {
        const options = [...results.querySelectorAll('.search-result')];
        if (event.key === 'Escape') results.hidden = true;
        if (!options.length || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
        event.preventDefault();
        activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options.forEach((option, index) => option.classList.toggle('active', index === activeIndex));
    });
    search.addEventListener('submit', (event) => {
        event.preventDefault();
        const options = [...results.querySelectorAll('.search-result')];
        const title = options[activeIndex]?.textContent || options[0]?.textContent;
        if (title) open(title);
    });
    document.addEventListener('click', (event) => { if (!search.contains(event.target)) results.hidden = true; });

    fetchCharacterTitles().then((titles) => {
        if (titles.length) {
            characters = [...new Set(titles)];
            cacheCharacterTitles(characters);
        }
    }).catch(() => {});
}
