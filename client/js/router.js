// js/router.js
// ---------------------------------------------------------------------------
// A tiny hash-based router. It only knows how to parse location.hash into a
// route name + params/query and notify a listener — it does not know how to
// render anything. main.js maps route names to view functions.
// ---------------------------------------------------------------------------

// Order matters: more specific patterns must come before ones they'd
// otherwise be swallowed by (e.g. '/foods/new' before '/foods/:id').
const ROUTE_TABLE = [
  { name: 'home', pattern: '/' },
  { name: 'foods', pattern: '/foods' },
  { name: 'food-new', pattern: '/foods/new' },
  { name: 'random', pattern: '/random' },
  { name: 'categories', pattern: '/categories' },
  { name: 'ingredients', pattern: '/ingredients' },
  { name: 'search', pattern: '/search' },
  { name: 'food-edit', pattern: '/foods/:id/edit' },
  { name: 'food-detail', pattern: '/foods/:id' },
];

function splitHash(hash) {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, queryString = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryString));
  return { path: path || '/', query };
}

function matchPath(path) {
  const pathParts = path.split('/').filter(Boolean);

  for (const route of ROUTE_TABLE) {
    const routeParts = route.pattern.split('/').filter(Boolean);
    if (routeParts.length !== pathParts.length) continue;

    const params = {};
    let matched = true;

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];
      if (routePart.startsWith(':')) {
        params[routePart.slice(1)] = decodeURIComponent(pathPart);
      } else if (routePart !== pathPart) {
        matched = false;
        break;
      }
    }
    if (matched) return { name: route.name, params };
  }
  return null;
}

export function parseRoute(hash) {
  const { path, query } = splitHash(hash);
  const match = matchPath(path);
  if (!match) return { name: 'not-found', params: {}, query };
  return { ...match, query };
}

/** Starts listening for hash changes and calls onRouteChange(route) each time. */
export function startRouter(onRouteChange) {
  const handle = () => onRouteChange(parseRoute(window.location.hash));
  window.addEventListener('hashchange', handle);
  handle();
}

export function navigate(path) {
  window.location.hash = path;
}
