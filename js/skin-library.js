import { cacheCharacterTitles, getCachedCharacterTitles, getCharacterProfileUrl, getSearchLabel } from './character-data.js';
import { getProfileSkins, renderSkinCard } from './character-profile.js';
import { fallbackImage, fetchCharacterTitles, fetchWikiArticle } from './wiki-api.js';

export async function loadSkinLibrary() {
    const form = document.getElementById('skin-character-form');
    if (!form) return;
    const input = document.getElementById('skin-character-input');
    const options = document.getElementById('skin-character-options');
    const status = document.getElementById('skin-library-status');
    const pageTitle = new URLSearchParams(window.location.search).get('character') || 'Might Guy';
    input.value = pageTitle;
    const populate = (titles) => {
        options.replaceChildren(...[...titles].sort((first, second) => first.localeCompare(second)).map((title) => {
            const option = document.createElement('option'); option.value = title; return option;
        }));
    };
    populate(getCachedCharacterTitles());
    fetchCharacterTitles().then((titles) => { if (titles.length) { cacheCharacterTitles(titles); populate(titles); } }).catch(() => {});
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (input.value.trim()) window.location.href = `skins.html?${new URLSearchParams({ character: input.value.trim() }).toString()}`;
    });

    try {
        const { page, article } = await fetchWikiArticle(pageTitle, 500);
        const skins = getProfileSkins(article);
        if (!skins.length) { status.textContent = `No skin gallery is currently listed for ${pageTitle} on the ABA Wiki.`; return; }
        const label = getSearchLabel(pageTitle);
        document.title = `${label} Skins | ABA Wiki`;
        document.getElementById('skin-library-name').textContent = `${label} Skins`;
        const image = document.getElementById('skin-library-image');
        image.src = page.thumbnail?.source || fallbackImage;
        image.alt = `${label} in Anime Battle Arena`;
        const source = document.getElementById('skin-library-source');
        source.href = getCharacterProfileUrl(label, pageTitle);
        source.textContent = 'Open character profile';
        skins.forEach(({ source: skinSource, caption }, index) => renderSkinCard(document.getElementById('skin-library-grid'), skinSource, caption, index));
        status.textContent = `${skins.length} skins listed on the ABA Wiki.`;
        document.getElementById('skin-library-heading').hidden = false;
    } catch (error) {
        console.warn('Unable to load ABA skin library.', error);
        status.textContent = 'Unable to load this character\'s skins from the ABA Wiki.';
    }
}
