import { localizeArticleMedia, resolveMediaUrl } from './r2-media.js';

const WIKI_API = 'https://animebattlearenaaba.fandom.com/api.php';

export const fallbackImage = 'https://static.wikia.nocookie.net/animebattlearenaaba/images/e/e6/Site-logo.png/revision/latest?cb=20210628140132';

export async function fetchWikiPages(titles, thumbnailSize = 500) {
    const response = await fetch(`${WIKI_API}?action=query&format=json&origin=*&prop=pageimages%7Cinfo&inprop=url&pithumbsize=${thumbnailSize}&titles=${encodeURIComponent(titles.join('|'))}`);
    const data = await response.json();
    const pages = Object.values(data.query?.pages || {});
    await Promise.all(pages.map(async (page) => {
        if (page.thumbnail?.source) page.thumbnail.source = await resolveMediaUrl(page.thumbnail.source);
    }));
    return pages;
}

export async function fetchWikiArticle(title, thumbnailSize = 600) {
    const [pages, articleResponse] = await Promise.all([
        fetchWikiPages([title], thumbnailSize),
        fetch(`${WIKI_API}?action=parse&format=json&origin=*&page=${encodeURIComponent(title)}&prop=text`)
    ]);
    const articleData = await articleResponse.json();
    const page = pages[0];

    if (!page?.fullurl || !articleData.parse?.text?.['*']) {
        throw new Error('Wiki article unavailable');
    }

    const document = new DOMParser().parseFromString(articleData.parse.text['*'], 'text/html');
    const article = document.querySelector('.mw-parser-output') || document.body;
    await localizeArticleMedia(article);
    await Promise.all([...article.querySelectorAll('video[src]')].map(async (video) => {
        video.src = await resolveMediaUrl(video.src);
    }));
    return { page, article };
}

export async function fetchCharacterTitles() {
    const response = await fetch(`${WIKI_API}?action=query&format=json&origin=*&list=categorymembers&cmtitle=Category%3ACharacters&cmnamespace=0&cmlimit=500`);
    const data = await response.json();
    return data.query?.categorymembers?.map((member) => member.title).filter(Boolean) || [];
}
