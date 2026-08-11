// js/config.js
// ---------------------------------------------------------------------------
// Single source of truth for environment settings. Change this file (and
// only this file) to point the client at a different server, base path, or
// token.
// ---------------------------------------------------------------------------

// The Slim app's base path is set with $app->setBasePath(...) in
// public/index.php. Point this at wherever that file is actually served.
export const BASE_URL = 'http://localhost/devera-client/public/index.php';


export const API_TOKEN = 'dmmmsu-cookbook-token-2026';
export const AUTH_HEADER = 'Bearer ' + API_TOKEN;

export const APP_NAME = 'Lutong Bahay';
export const APP_TAGLINE = 'A field guide to the Filipino table';
