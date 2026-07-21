export const characterSearchFallback = [
    'Monkey D. Luffy (Pre-Timeskip)',
    'Roronoa Zoro (Post-Timeskip)',
    'Vinsmoke Sanji (Pre-Timeskip)',
    'Trafalgar D. Water Law (Pre & Post-Timeskip)',
    'Portgas D. Ace',
    'Satoru Gojo',
    'Naruto Uzumaki (Shippuden)',
    'Son Goku (Dragon Ball Super)',
    'Ichigo Kurosaki',
    'Might Guy'
];

export const rosterPageTitles = {
    'Son Goku': 'Son Goku (Dragon Ball Super)',
    Vegito: 'Vegito (Dragon Ball Super)',
    'Future Trunks': 'Future Trunks (Cell Saga)',
    'Naruto Uzumaki': 'Naruto Uzumaki (Shippuden)',
    'Sasuke Uchiha': 'Sasuke Uchiha (Shippuden)',
    'Todo Aoi': 'Aoi Todo',
    'Okkotsu Yuta': 'Yuta Okkotsu',
    'Dio Brando': 'Dio Brando (Stardust Crusaders)',
    'Yoshikage Kira': 'Yoshikage Kira (Diamond Is Unbreakable)',
    'Killua Zoldyck': 'KIllua Zoldyck',
    Broly: 'Broly (Dragon Ball Super)',
    Byakuya: 'Byakuya Kuchiki',
    Frieza: 'Frieza (Dragon Ball Super)',
    Grimmjow: 'Grimmjow Jaegerjaquez',
    'Joseph Joestar': 'Joseph Joestar (Stardust Crusaders)',
    'Josuke Higashikata': 'Josuke Higashikata (Diamond Is Unbreakable)',
    'Jotaro Kujo': 'Jotaro Kujo (Stardust Crusaders)',
    Nanami: 'Kento Nanami',
    Rukia: 'Rukia Kuchiki',
    'Sōsuke Aizen': 'Sōsuke Aizen (LEGACY)',
    Vegeta: 'Vegeta (Dragon Ball Super)',
    Yamamoto: 'Yamamoto Genryusai (TYBW Rework)',
    'Izuku Midoriya': 'Deku (Izuku Midoriya)',
    'Emiya Shirou': 'Shirou Emiya',
    Sinon: 'Sinon (Asada Shino)',
    'All Might': 'All Might (Toshinori Yagi)',
    Hisoka: 'Hisoka Morow',
    Illumi: 'Illumi Zoldyck',
    Iskandar: 'Rider (Iskandar)',
    Kirito: 'Kirito (Kirigaya Kazuto)',
    Raiden: 'Raiden (MGS2)',
    Saber: 'Saber (Artoria Pendragon)',
    Yusuke: 'Yusuke Urameshi',
    'Reigen Arataka': 'Reigen',
    'Maka and Soul': 'Maka & Soul'
};

export function getCharacterProfileUrl(name, pageTitle) {
    return `character.html?${new URLSearchParams({ name, page: pageTitle }).toString()}`;
}

export function getSearchLabel(title) {
    return title.replace(/\s*\((?:Pre|Post)-Timeskip\)$/, '').trim();
}

export function getCachedCharacterTitles() {
    const stored = sessionStorage.getItem('aba-character-search');
    return stored ? JSON.parse(stored) : [...characterSearchFallback];
}

export function cacheCharacterTitles(titles) {
    sessionStorage.setItem('aba-character-search', JSON.stringify([...new Set(titles)]));
}
