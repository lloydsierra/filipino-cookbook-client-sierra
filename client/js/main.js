// js/main.js
// ---------------------------------------------------------------------------
// Entry point. Wires the router to view functions, calls api.js, and hands
// the results to ui.js for rendering. This is the only file that mixes
// fetching and rendering together, on purpose — it's the orchestrator.
// ---------------------------------------------------------------------------

import * as api from './api.js';
import * as ui from './ui.js';
import * as data from './data.js';
import { startRouter, navigate } from './router.js';

const appRoot = document.getElementById('app');
const navRoot = document.getElementById('nav-root');

let categoriesLoadPromise = null;

/** Fetches categories once and caches them for the whole session. */
function ensureCategoriesLoaded() {
  if (data.getCategoriesCache()) return Promise.resolve(data.getCategoriesCache());
  if (!categoriesLoadPromise) {
    categoriesLoadPromise = api.getCategories().then((list) => {
      data.setCategoriesCache(list);
      return list;
    });
  }
  return categoriesLoadPromise;
}

function setActiveNav(routeName) {
  navRoot.innerHTML = ui.renderNavbar(routeName);
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('is-open');
    });
    nav.querySelectorAll('a').forEach((link) =>
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      })
    );
  }
}

function mount(html) {
  appRoot.innerHTML = html;
  appRoot.focus();
}

// --- view handlers ---------------------------------------------------------

async function viewHome() {
  mount(ui.renderLoading('Fetching the welcome message'));
  try {
    const welcome = await api.getWelcome();
    mount(ui.renderHome(welcome));
  } catch (err) {
    mount(ui.renderError(err.message, { retryHash: '#/' }));
  }
}

async function viewFoods() {
  mount(ui.renderLoading('Loading foods'));
  try {
    await ensureCategoriesLoaded();
    const foods = await api.getFoods();
    const enriched = foods.map(data.enrichFood);
    mount(ui.renderFoodList(enriched));
  } catch (err) {
    mount(ui.renderError(err.message, { retryHash: '#/foods' }));
  }
}

async function viewFoodDetail(id) {
  mount(ui.renderLoading('Loading recipe'));
  try {
    await ensureCategoriesLoaded();
    const food = await api.getFood(id);
    mount(ui.renderFoodDetail(data.enrichFood(food)));
  } catch (err) {
    if (err.status === 404) {
      mount(ui.renderError('Food not found.', { retryHash: '#/foods' }));
    } else {
      mount(ui.renderError(err.message, { retryHash: `#/foods/${encodeURIComponent(id)}` }));
    }
  }
}

async function viewRandom() {
  mount(ui.renderRandomShell());
  await loadRandomIntoSlot();
}

async function loadRandomIntoSlot() {
  const slot = document.getElementById('random-slot');
  if (!slot) return;
  slot.innerHTML = ui.renderLoading('Picking a recipe');
  try {
    await ensureCategoriesLoaded();
    const food = await api.getRandomFood();
    slot.innerHTML = ui.renderFoodDetail(data.enrichFood(food));
  } catch (err) {
    slot.innerHTML = ui.renderError(err.message);
  }
}

async function viewCategories() {
  mount(ui.renderLoading('Loading categories'));
  try {
    const categories = await api.getCategories();
    data.setCategoriesCache(categories);
    const withColor = categories.map((c) => ({ ...c, __color: data.categoryColor(c.category_id) }));
    mount(ui.renderCategories(withColor));
  } catch (err) {
    mount(ui.renderError(err.message, { retryHash: '#/categories' }));
  }
}

async function viewIngredients() {
  mount(ui.renderLoading('Loading ingredients'));
  try {
    const ingredients = await api.getIngredients();
    mount(ui.renderIngredients(ingredients));
  } catch (err) {
    mount(ui.renderError(err.message, { retryHash: '#/ingredients' }));
  }
}

async function viewSearch(query) {
  mount(ui.renderSearchForm(query || ''));
  wireSearchForm();
  if (query) {
    await runSearch(query);
  }
}

async function runSearch(query) {
  const resultsSlot = document.getElementById('search-results');
  if (!resultsSlot) return;
  resultsSlot.innerHTML = ui.renderLoading('Searching');
  try {
    await ensureCategoriesLoaded();
    const foods = await api.searchFoods(query);
    const enriched = foods.map(data.enrichFood);
    resultsSlot.innerHTML = ui.renderSearchResults(enriched, query);
  } catch (err) {
    resultsSlot.innerHTML = ui.renderError(err.message);
  }
}

function wireSearchForm() {
  const form = document.getElementById('search-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = form.elements.q.value.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  });
}

async function viewFoodNew() {
  mount(ui.renderLoading('Preparing the form'));
  try {
    await ensureCategoriesLoaded();
    mount(ui.renderFoodForm({ mode: 'create', categories: data.getCategoriesCache(), origins: data.ORIGINS }));
    wireFoodForm();
  } catch (err) {
    mount(ui.renderError(err.message, { retryHash: '#/foods/new' }));
  }
}

async function viewFoodEdit(id) {
  mount(ui.renderLoading('Loading recipe to edit'));
  try {
    await ensureCategoriesLoaded();
    const food = await api.getFood(id);
    mount(
      ui.renderFoodForm({
        mode: 'edit',
        food,
        categories: data.getCategoriesCache(),
        origins: data.ORIGINS,
      })
    );
    wireFoodForm();
  } catch (err) {
    if (err.status === 404) {
      mount(ui.renderError('Food not found.', { retryHash: '#/foods' }));
    } else {
      mount(ui.renderError(err.message, { retryHash: `#/foods/${encodeURIComponent(id)}/edit` }));
    }
  }
}

function wireFoodForm() {
  const form = document.getElementById('food-form');
  if (!form) return;

  const rowsContainer = document.getElementById('ingredient-rows');
  const addRowBtn = document.getElementById('add-ingredient-row');

  addRowBtn.addEventListener('click', () => {
    const index = rowsContainer.querySelectorAll('[data-ingredient-row]').length;
    rowsContainer.insertAdjacentHTML('beforeend', ui.renderIngredientRowMarkup(index));
  });

  rowsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-action="remove-ingredient-row"]');
    if (!removeBtn) return;
    const rows = rowsContainer.querySelectorAll('[data-ingredient-row]');
    if (rows.length <= 1) {
      // Keep at least one row; just clear it instead of removing.
      removeBtn.closest('[data-ingredient-row]').querySelector('input').value = '';
      return;
    }
    removeBtn.closest('[data-ingredient-row]').remove();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorRegion = document.getElementById('form-error-region');
    errorRegion.innerHTML = '';

    if (!form.reportValidity()) return;

    const mode = form.dataset.mode;
    const foodId = form.dataset.foodId;
    const submitBtn = document.getElementById('food-form-submit');

    const ingredients = Array.from(form.querySelectorAll('input[name="ingredient"]'))
      .map((input) => input.value.trim())
      .filter(Boolean);

    if (!ingredients.length) {
      errorRegion.innerHTML = `<p class="form-error">Add at least one ingredient.</p>`;
      return;
    }

    const payload = {
      food_name: form.elements.food_name.value.trim(),
      category_id: Number(form.elements.category_id.value),
      origin_id: Number(form.elements.origin_id.value),
      instructions: form.elements.instructions.value.trim(),
      ingredients,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'edit' ? 'Saving…' : 'Adding…';

    try {
      if (mode === 'edit') {
        await api.updateFood(foodId, payload);
        ui.showToast('Recipe updated.', { type: 'success' });
        navigate(`/foods/${encodeURIComponent(foodId)}`);
      } else {
        const result = await api.createFood(payload);
        ui.showToast('Recipe added.', { type: 'success' });
        navigate(`/foods/${encodeURIComponent(result.food_id)}`);
      }
    } catch (err) {
      errorRegion.innerHTML = `<p class="form-error">${ui.escapeHtml(err.message)}</p>`;
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'edit' ? 'Save changes' : 'Add food';
    }
  });
}

// --- delete (delegated globally so it works from list, detail, etc.) ------

async function handleDeleteClick(button) {
  const foodId = button.dataset.foodId;
  const foodName = button.dataset.foodName || 'this recipe';
  const confirmed = await ui.confirmAction(`Delete "${foodName}"? This can't be undone.`);
  if (!confirmed) return;

  button.disabled = true;
  try {
    await api.deleteFood(foodId);
    ui.showToast('Recipe deleted.', { type: 'success' });
    navigate('/foods');
    // If we were already on /foods, hash won't change/fire — refresh manually.
    if (window.location.hash.replace(/^#/, '') === '/foods' || window.location.hash === '') {
      viewFoods();
    }
  } catch (err) {
    ui.showToast(err.message, { type: 'error' });
    button.disabled = false;
  }
}

document.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('[data-action="delete-food"]');
  if (deleteBtn) {
    handleDeleteClick(deleteBtn);
    return;
  }
  const rerollBtn = e.target.closest('[data-action="reroll-random"]');
  if (rerollBtn) {
    loadRandomIntoSlot();
  }
});

// --- route table ------------------------------------------------------

const HANDLERS = {
  home: () => viewHome(),
  foods: () => viewFoods(),
  'food-detail': (route) => viewFoodDetail(route.params.id),
  'food-edit': (route) => viewFoodEdit(route.params.id),
  'food-new': () => viewFoodNew(),
  random: () => viewRandom(),
  categories: () => viewCategories(),
  ingredients: () => viewIngredients(),
  search: (route) => viewSearch(route.query.q || ''),
  'not-found': () =>
    mount(ui.renderError("That page doesn't exist.", { retryHash: '#/' })),
};

startRouter((route) => {
  setActiveNav(route.name);
  const handler = HANDLERS[route.name] || HANDLERS['not-found'];
  handler(route);
});
