const KEY = "lumina_jwt";

function readStorage() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const payload = JSON.parse(atob(raw.split(".")[1]));
    return payload.exp * 1000 > Date.now() ? raw : null;
  } catch {
    return null;
  }
}

let _token = readStorage();

export const tokenStore = {
  get: () => _token,
  set: (t) => {
    _token = t;
    if (t) localStorage.setItem(KEY, t);
    else localStorage.removeItem(KEY);
  },
  clear: () => {
    _token = null;
    localStorage.removeItem(KEY);
  },
};
