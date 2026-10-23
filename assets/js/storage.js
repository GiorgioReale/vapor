/**
 * Safe Web Storage helpers with namespaced keys.
 * Falls back gracefully when storage is unavailable.
 */

const PREFIX = "vapor.";

function getStorage() {
  try {
    const storage = window.localStorage;
    const probe = "__vapor_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @returns {unknown | null}
 */
export function load(key) {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(PREFIX + key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean}
 */
export function save(key, value) {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} key
 * @returns {boolean}
 */
export function remove(key) {
  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}
