import { initializeCharacterSearch } from './character-search.js';
import { initializeMoveViewer, loadCharacterProfile } from './character-profile.js';
import { initializeMaps } from './maps.js';
import { initializeRoster } from './roster.js';
import { loadSkinLibrary } from './skin-library.js';
import { initializeSiteUi } from './site-ui.js';

initializeSiteUi();
initializeCharacterSearch();
initializeRoster();
initializeMoveViewer();
loadCharacterProfile();
loadSkinLibrary();
initializeMaps();
