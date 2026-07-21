# JavaScript Guide

`main.js` starts the regular site features. It imports each area below so pages only run the code for DOM elements that exist.

| File | What to edit there |
| --- | --- |
| `site-ui.js` | Loader, top menu, homepage carousel, announcements |
| `character-data.js` | Character title corrections, profile URL helpers, search fallback list |
| `wiki-api.js` | Shared ABA Fandom API requests and fallback image |
| `roster.js` | Roster portrait tiles and local character links |
| `character-search.js` | Search field and search recommendations |
| `character-profile.js` | Character details, moves, transformations, move GIF viewer, profile skins |
| `skin-library.js` | Standalone `skins.html` picker and gallery |
| `maps.js` | Map tile thumbnails and local map profile articles |
| `main.js` | Application startup order only |

`combos.js` remains at the project root because it is the Firebase-only feature used by `combos.html`.
