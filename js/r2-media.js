export const r2MediaBaseUrl = 'https://pub-2fd8276d970f41d7a059a6e2b0fdd561.r2.dev';

let manifestPromise;

async function getManifest() {
    if (!manifestPromise) {
        manifestPromise = fetch('assets/manifest.json')
            .then((response) => response.ok ? response.json() : {})
            .catch(() => ({}));
    }
    return manifestPromise;
}

export async function resolveMediaUrl(source) {
    if (!source || source.startsWith('data:')) return source;
    const manifest = await getManifest();
    return manifest[source] ? `${r2MediaBaseUrl}/${manifest[source]}` : source;
}

export async function localizeArticleMedia(article) {
    const manifest = await getManifest();
    article.querySelectorAll('img[data-src], img[src]').forEach((image) => {
        const source = image.dataset.src || image.src;
        const key = manifest[source];
        if (!key) return;
        const localSource = `${r2MediaBaseUrl}/${key}`;
        image.src = localSource;
        if (image.dataset.src) image.dataset.src = localSource;
    });
}