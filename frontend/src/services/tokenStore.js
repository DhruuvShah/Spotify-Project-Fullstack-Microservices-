let _token = null;

export const tokenStore = {
  get: () => _token,
  set: (t) => { _token = t; },
  clear: () => { _token = null; },
};
