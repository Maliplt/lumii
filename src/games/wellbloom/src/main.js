import { i18n } from './i18n/i18n.js';
import { progress } from './state/progress.js';
import { App } from './ui/app.js';

i18n.setLanguage(progress.settings.language ?? i18n.detect());
const app = new App();
app.start();

// opening the game with ?debug exposes the app in the console for testing
if (new URLSearchParams(window.location.search).has('debug')) window.wellbloom = { app, progress };
