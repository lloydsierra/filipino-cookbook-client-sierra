// js/ui.js
// ---------------------------------------------------------------------------
// Pure render functions. Every function here takes data and returns an HTML
// string — none of them call fetch(). main.js mounts the returned strings
// into #app and wires up events afterward.
// ---------------------------------------------------------------------------

import { normalizeIngredientList } from './data.js';

// --- small helpers -----------------------------------------------------

export function escapeHtml(value) {
  const str = value === null || value === undefined ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pluralize(count, noun) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

// --- shared states: loading / error / empty -----------------------------

export function renderLoading(label = 'Loading') {
  return `
    <div class="state state-loading" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      <p>${escapeHtml(label)}&hellip;</p>
    </div>
  `;
}

export function renderError(message, { retryHash = null } = {}) {
  const retry = retryHash
    ? `<a class="btn btn-secondary" href="${escapeHtml(retryHash)}">Try again</a>`
    : '';
  return `
    <div class="state state-error" role="alert">
      <p class="state-title">Something went wrong</p>
      <p>${escapeHtml(message)}</p>
      ${retry}
    </div>
  `;
}

export function renderEmpty(message, actionHtml = '') {
  return `
    <div class="state state-empty">
      <p>${escapeHtml(message)}</p>
      ${actionHtml}
    </div>
  `;
}

// --- navbar --------------------------------------------------------------

const NAV_LINKS = [
  { hash: '#/', label: 'Home', match: 'home' },
  { hash: '#/foods', label: 'Browse', match: 'foods' },
  { hash: '#/random', label: 'Random', match: 'random' },
  { hash: '#/categories', label: 'Categories', match: 'categories' },
  { hash: '#/ingredients', label: 'Ingredients', match: 'ingredients' },
  { hash: '#/search', label: 'Search', match: 'search' },
  { hash: '#/foods/new', label: 'Add a Food', match: 'food-new' },
];

export function renderNavbar(activeRoute) {
  const links = NAV_LINKS.map((link) => {
    const isActive = link.match === activeRoute;
    return `<a class="tab${isActive ? ' is-active' : ''}" href="${link.hash}"${
      isActive ? ' aria-current="page"' : ''
    }>${link.label}</a>`;
  }).join('');

  return `
    <header class="site-header">
      <div class="site-header-inner">
        <a class="brand" href="#/">
          <span class="brand-mark" aria-hidden="true">&#127859;</span>
          <span class="brand-text">
            <span class="brand-name">Lutong Bahay</span>
            <span class="brand-tagline">A field guide to the Filipino table</span>
          </span>
        </a>
        <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav">
          <span class="sr-only">Toggle navigation</span>
          <span class="nav-toggle-bar"></span>
        </button>
        <nav class="site-nav" id="site-nav" aria-label="Primary">
          ${links}
        </nav>
      </div>
    </header>
  `;
}

// --- home ------------------------------------------------------------------

export function renderHome(welcome) {
  const note = welcome && welcome.note ? welcome.note : '';
  const message = welcome && welcome.message ? welcome.message : 'Welcome';
  return `
    <section class="hero recipe-card">
      <p class="eyebrow">Filipino Cookbook API &middot; client</p>
      <h1>${escapeHtml(message)}</h1>
      ${note ? `<p class="hero-note">${escapeHtml(note)}</p>` : ''}
      <div class="hero-actions">
        <a class="btn btn-primary" href="#/foods">Browse the collection</a>
        <a class="btn btn-secondary" href="#/random">Surprise me</a>
      </div>
    </section>

    <section class="quick-links">
      <a class="quick-card" href="#/foods">
        <span class="quick-card-tag" style="--tab-color:#6B4226"></span>
        <h2>Browse foods</h2>
        <p>Every recipe on file, with category and origin at a glance.</p>
      </a>
      <a class="quick-card" href="#/categories">
        <span class="quick-card-tag" style="--tab-color:#C77F1E"></span>
        <h2>Categories</h2>
        <p>Appetizers, mains, noodle dishes, soups &mdash; the whole shelf.</p>
      </a>
      <a class="quick-card" href="#/ingredients">
        <span class="quick-card-tag" style="--tab-color:#4C7A57"></span>
        <h2>Ingredients</h2>
        <p>The full pantry behind every dish in the collection.</p>
      </a>
      <a class="quick-card" href="#/search">
        <span class="quick-card-tag" style="--tab-color:#2F5D50"></span>
        <h2>Search</h2>
        <p>Looking for something specific? Search by name.</p>
      </a>
    </section>
  `;
}

// --- food cards / lists ------------------------------------------------

function renderIngredientChips(ingredients, { limit = 4 } = {}) {
  if (!ingredients.length) {
    return `<p class="ingredients-note">Ingredients not shown here.</p>`;
  }
  const shown = ingredients.slice(0, limit);
  const remainder = ingredients.length - shown.length;
  const chips = shown.map((i) => `<span class="chip">${escapeHtml(i)}</span>`).join('');
  const more = remainder > 0 ? `<span class="chip chip-muted">+${remainder} more</span>` : '';
  return `<div class="chip-row">${chips}${more}</div>`;
}

function renderFoodCard(food) {
  const ingredients = normalizeIngredientList(food);
  return `
    <article class="recipe-card food-card" style="--tab-color:${escapeHtml(food.category_color)}">
      <span class="card-tab">${escapeHtml(food.category_name)}</span>
      <h2 class="food-card-title">
        <a href="#/foods/${encodeURIComponent(food.food_id)}">${escapeHtml(food.food_name)}</a>
      </h2>
      <p class="badge-row">
        <span class="badge badge-origin">&#128205; ${escapeHtml(food.origin_name)}</span>
        <span class="badge badge-count">${pluralize(ingredients.length, 'ingredient')}</span>
      </p>
      ${renderIngredientChips(ingredients)}
      <div class="card-actions">
        <a class="btn btn-small btn-secondary" href="#/foods/${encodeURIComponent(food.food_id)}">View</a>
        <a class="btn btn-small btn-ghost" href="#/foods/${encodeURIComponent(food.food_id)}/edit">Edit</a>
        <button type="button" class="btn btn-small btn-danger-ghost" data-action="delete-food" data-food-id="${escapeHtml(food.food_id)}" data-food-name="${escapeHtml(food.food_name)}">Delete</button>
      </div>
    </article>
  `;
}

export function renderFoodList(foods) {
  if (!foods.length) {
    return renderEmpty(
      'No foods on file yet.',
      '<a class="btn btn-primary" href="#/foods/new">Add the first one</a>'
    );
  }
  return `
    <div class="view-heading">
      <h1>Browse foods</h1>
      <span class="view-count">${pluralize(foods.length, 'recipe')}</span>
    </div>
    <div class="food-grid">${foods.map(renderFoodCard).join('')}</div>
  `;
}

export function renderFoodDetail(food) {
  const ingredients = normalizeIngredientList(food);
  const ingredientList = ingredients.length
    ? `<ul class="ingredient-list">${ingredients
        .map((i) => `<li>${escapeHtml(i)}</li>`)
        .join('')}</ul>`
    : `<p class="ingredients-note">No ingredients on file for this recipe.</p>`;

  return `
    <article class="recipe-card recipe-card-large" style="--tab-color:${escapeHtml(food.category_color)}">
      <span class="card-tab">${escapeHtml(food.category_name)}</span>
      <a class="btn btn-small btn-ghost back-link" href="#/foods">&larr; Back to all foods</a>
      <h1>${escapeHtml(food.food_name)}</h1>
      <p class="badge-row">
        <span class="badge badge-origin">&#128205; ${escapeHtml(food.origin_name)}</span>
        <span class="badge badge-count">${pluralize(ingredients.length, 'ingredient')}</span>
      </p>

      <h2 class="section-label">Instructions</h2>
      <p class="instructions">${escapeHtml(food.instructions || 'No instructions on file.')}</p>

      <h2 class="section-label">Ingredients</h2>
      ${ingredientList}

      <div class="card-actions">
        <a class="btn btn-secondary" href="#/foods/${encodeURIComponent(food.food_id)}/edit">Edit recipe</a>
        <button type="button" class="btn btn-danger-ghost" data-action="delete-food" data-food-id="${escapeHtml(food.food_id)}" data-food-name="${escapeHtml(food.food_name)}">Delete recipe</button>
      </div>
    </article>
  `;
}

export function renderRandomShell() {
  return `
    <div class="view-heading">
      <h1>Random recipe</h1>
      <button type="button" class="btn btn-secondary" data-action="reroll-random">Roll again</button>
    </div>
    <div id="random-slot"></div>
  `;
}

// --- categories / ingredients (reference tables) ------------------------

export function renderCategories(categories) {
  if (!categories.length) return renderEmpty('No categories on file.');
  const rows = categories
    .map((c) => {
      const color = (c.__color && c.__color.hex) || '#8C6A4A';
      return `
      <tr>
        <td><span class="swatch" style="--tab-color:${escapeHtml(color)}"></span></td>
        <td>${escapeHtml(c.category_name)}</td>
        <td class="cell-muted">#${escapeHtml(c.category_id)}</td>
      </tr>`;
    })
    .join('');
  return `
    <div class="view-heading">
      <h1>Categories</h1>
      <span class="view-count">${pluralize(categories.length, 'category').replace('categorys', 'categories')}</span>
    </div>
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th scope="col"></th><th scope="col">Name</th><th scope="col">ID</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

export function renderIngredients(ingredients) {
  if (!ingredients.length) return renderEmpty('No ingredients on file.');
  const sorted = [...ingredients].sort((a, b) => a.ingredient_id - b.ingredient_id);
  const rows = sorted
    .map(
      (i) => `
      <tr>
        <td>${escapeHtml(i.ingredient_name)}</td>
        <td class="cell-muted">#${escapeHtml(i.ingredient_id)}</td>
      </tr>`
    )
    .join('');
  return `
    <div class="view-heading">
      <h1>Ingredients</h1>
      <span class="view-count">${pluralize(sorted.length, 'ingredient')}</span>
    </div>
    <div class="table-card">
      <table class="data-table">
        <thead><tr><th scope="col">Name</th><th scope="col">ID</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// --- search ---------------------------------------------------------------

export function renderSearchForm(query = '') {
  return `
    <div class="view-heading"><h1>Search</h1></div>
    <form class="search-form recipe-card" id="search-form" role="search">
      <label for="search-input">Food name</label>
      <div class="search-row">
        <input type="search" id="search-input" name="q" placeholder="e.g. adobo" value="${escapeHtml(query)}" autocomplete="off" />
        <button type="submit" class="btn btn-primary">Search</button>
      </div>
    </form>
    <div id="search-results"></div>
  `;
}

export function renderSearchResults(foods, query) {
  if (!foods.length) {
    return renderEmpty(`No foods matched "${query}".`);
  }
  const cards = foods
    .map((food) => {
      return `
      <article class="recipe-card food-card" style="--tab-color:${escapeHtml(food.category_color)}">
        <span class="card-tab">${escapeHtml(food.category_name)}</span>
        <h2 class="food-card-title">
          <a href="#/foods/${encodeURIComponent(food.food_id)}">${escapeHtml(food.food_name)}</a>
        </h2>
        <p class="badge-row">
          <span class="badge badge-origin">&#128205; ${escapeHtml(food.origin_name)}</span>
        </p>
        <p class="ingredients-note">Ingredients not shown in search results &mdash; open the recipe to see them.</p>
        <div class="card-actions">
          <a class="btn btn-small btn-secondary" href="#/foods/${encodeURIComponent(food.food_id)}">View recipe</a>
        </div>
      </article>`;
    })
    .join('');
  return `
    <div class="view-heading">
      <span class="view-count">${pluralize(foods.length, 'match').replace('matchs', 'matches')} for &ldquo;${escapeHtml(query)}&rdquo;</span>
    </div>
    <div class="food-grid">${cards}</div>
  `;
}

// --- add / edit form --------------------------------------------------

function renderIngredientRow(value = '', index) {
  return `
    <div class="ingredient-row" data-ingredient-row>
      <input type="text" name="ingredient" value="${escapeHtml(value)}" placeholder="e.g. Soy sauce" required minlength="1" aria-label="Ingredient ${index + 1}" />
      <button type="button" class="btn btn-ghost btn-icon" data-action="remove-ingredient-row" aria-label="Remove ingredient">&times;</button>
    </div>
  `;
}

export function renderFoodForm({ mode, food = {}, categories = [], origins = [] }) {
  const isEdit = mode === 'edit';
  const title = isEdit ? `Edit ${food.food_name || 'recipe'}` : 'Add a food';
  const submitLabel = isEdit ? 'Save changes' : 'Add food';
  const ingredients = normalizeIngredientList(food);
  const ingredientRows = (ingredients.length ? ingredients : ['']).map(renderIngredientRow).join('');

  const categoryOptions = categories
    .map((c) => {
      const selected = String(c.category_id) === String(food.category_id) ? ' selected' : '';
      return `<option value="${escapeHtml(c.category_id)}"${selected}>${escapeHtml(c.category_name)}</option>`;
    })
    .join('');

  const originOptions = origins
    .map((o) => {
      const selected = String(o.origin_id) === String(food.origin_id) ? ' selected' : '';
      return `<option value="${escapeHtml(o.origin_id)}"${selected}>${escapeHtml(o.origin_name)}</option>`;
    })
    .join('');

  return `
    <div class="view-heading"><h1>${escapeHtml(title)}</h1></div>
    <form class="recipe-card food-form" id="food-form" data-mode="${escapeHtml(mode)}" data-food-id="${escapeHtml(food.food_id || '')}" novalidate>
      <div id="form-error-region" aria-live="assertive"></div>

      <fieldset>
        <legend>Basics</legend>
        <div class="field">
          <label for="field-name">Food name</label>
          <input type="text" id="field-name" name="food_name" required minlength="2" value="${escapeHtml(food.food_name || '')}" />
        </div>
        <div class="field-row">
          <div class="field">
            <label for="field-category">Category</label>
            <select id="field-category" name="category_id" required>
              <option value="" disabled${food.category_id ? '' : ' selected'}>Choose a category</option>
              ${categoryOptions}
            </select>
          </div>
          <div class="field">
            <label for="field-origin">Origin</label>
            <select id="field-origin" name="origin_id" required>
              <option value="" disabled${food.origin_id ? '' : ' selected'}>Choose an origin</option>
              ${originOptions}
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Instructions</legend>
        <div class="field">
          <label for="field-instructions">How it's made</label>
          <textarea id="field-instructions" name="instructions" rows="5" required minlength="10">${escapeHtml(food.instructions || '')}</textarea>
        </div>
      </fieldset>

      <fieldset>
        <legend>Ingredients</legend>
        <div id="ingredient-rows">${ingredientRows}</div>
        <button type="button" class="btn btn-ghost" id="add-ingredient-row">+ Add another ingredient</button>
      </fieldset>

      <div class="card-actions">
        <button type="submit" class="btn btn-primary" id="food-form-submit">${escapeHtml(submitLabel)}</button>
        <a class="btn btn-secondary" href="${isEdit ? `#/foods/${encodeURIComponent(food.food_id)}` : '#/foods'}">Cancel</a>
      </div>
    </form>
  `;
}

export function renderIngredientRowMarkup(index) {
  return renderIngredientRow('', index);
}

// --- toast -----------------------------------------------------------------

export function showToast(message, { type = 'info', duration = 4000 } = {}) {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.textContent = message;
  root.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('is-visible'));

  const remove = () => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 200);
  };
  setTimeout(remove, duration);
  toast.addEventListener('click', remove);
}

// --- confirm dialog (used instead of window.confirm for a consistent look)

export function confirmAction(message) {
  return new Promise((resolve) => {
    const root = document.getElementById('modal-root');
    if (!root) {
      resolve(window.confirm(message));
      return;
    }
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal-card" role="alertdialog" aria-modal="true" aria-labelledby="modal-message">
          <p id="modal-message">${escapeHtml(message)}</p>
          <div class="card-actions">
            <button type="button" class="btn btn-danger" data-modal-confirm>Delete</button>
            <button type="button" class="btn btn-secondary" data-modal-cancel>Cancel</button>
          </div>
        </div>
      </div>
    `;

    const cleanup = (result) => {
      root.innerHTML = '';
      resolve(result);
    };

    root.querySelector('[data-modal-confirm]').addEventListener('click', () => cleanup(true));
    root.querySelector('[data-modal-cancel]').addEventListener('click', () => cleanup(false));
    root.querySelector('[data-modal-backdrop]').addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-modal-backdrop')) cleanup(false);
    });
  });
}
