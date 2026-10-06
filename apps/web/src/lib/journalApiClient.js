// Collection-shaped interface preserves journal components while transport changes to our API.
export function createJournalApiClient(baseUrl = '/api', fetcher = (...args) => fetch(...args)) {
  const base = baseUrl.replace(/\/$/, '');
  const listeners = new Set();
  const active = new Map();
  let record = null;
  const authStore = {
    get model() { return record; },
    get record() { return record; },
    get isValid() { return Boolean(record); },
    get token() { return ''; },
    save(_token, value) { record = value; for (const listener of listeners) listener('', record); },
    clear() { this.save('', null); },
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
  async function request(path, { method = 'GET', body, signal, timeoutMs = 15000 } = {}) {
    let response;
    try {
      response = await fetcher(base + path, { method, credentials: 'same-origin', headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: signal || AbortSignal.timeout(timeoutMs) });
    } catch (cause) {
      const error = new Error('Der Server ist nicht erreichbar.', { cause });
      error.status = 0; error.isAbort = cause.name === 'AbortError'; throw error;
    }
    let data = null;
    if (response.status !== 204) {
      try { data = await response.json(); }
      catch {
        const error = new Error('Der Server hat keine gueltige API-Antwort geliefert.');
        error.status = response.status; throw error;
      }
    }
    if (!response.ok) {
      const error = new Error(data?.message || 'Die Anfrage ist fehlgeschlagen.');
      error.status = response.status; error.response = data; throw error;
    }
    return data;
  }
  function query(page, perPage, options) {
    const params = new URLSearchParams({ page, perPage: Math.min(200, perPage) });
    if (options.sort) params.set('sort', options.sort);
    const filters = options.filter || {};
    if (typeof filters !== 'object' || Array.isArray(filters)) throw new Error('Journal filters must be structured objects.');
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, value);
    return '?' + params.toString();
  }
  async function authenticate(path, body) {
    const data = await request(path, body ? { method: 'POST', body } : {});
    authStore.save('', data.record);
    return data;
  }
  const client = {
    usesCookies: true, authStore,
    filter(_expression, values) { return { userId: values.user }; },
    async logout() { await request('/auth/logout', { method: 'POST' }); authStore.clear(); },
    async deleteUser(password) { await request('/users/me', { method: 'DELETE', body: { password } }); authStore.clear(); },
    moveAndDeleteAccount(id, targetAccountId) { return request('/accounts/' + encodeURIComponent(id) + '/move-and-delete', { method: 'POST', body: { targetAccountId } }); },
    collection(name) {
      const path = '/records/' + encodeURIComponent(name);
      return {
        async getList(page = 1, perPage = 100, options = {}) { return request(path + query(page, perPage, options)); },
        async getFullList(options = {}) {
          const key = options.requestKey;
          if (key) active.get(key)?.abort();
          const controller = new AbortController();
          if (key) active.set(key, controller);
          const timeout = setTimeout(() => controller.abort(), 60000);
          const items = [];
          try {
            for (let page = 1; ; page++) {
              const result = await request(path + query(page, 200, options), { signal: controller.signal });
              items.push(...result.items);
              if (page >= result.totalPages) return items;
            }
          } finally {
            clearTimeout(timeout);
            if (key && active.get(key) === controller) active.delete(key);
          }
        },
        getOne(id) { return request(path + '/' + encodeURIComponent(id)); },
        create(body) { return request(name === 'users' ? '/auth/signup' : path, { method: 'POST', body }); },
        async update(id, body) {
          const value = await request((name === 'users' ? '/users/' : path + '/') + encodeURIComponent(id), { method: 'PATCH', body });
          if (name === 'users') authStore.save('', value);
          return value;
        },
        delete(id) { return request(path + '/' + encodeURIComponent(id), { method: 'DELETE' }); },
        authWithPassword(identity, password) { return authenticate('/auth/login', { identity, password }); },
        authRefresh() { return authenticate('/auth/session'); },
        requestVerification(email) { return request('/auth/verify/request', { method: 'POST', body: { email }, timeoutMs: 45000 }); },
        confirmVerification(token) { return request('/auth/verify/confirm', { method: 'POST', body: { token } }); },
        requestPasswordReset(email) { return request('/auth/reset/request', { method: 'POST', body: { email }, timeoutMs: 45000 }); },
        confirmPasswordReset(token, password, passwordConfirm) { return request('/auth/reset/confirm', { method: 'POST', body: { token, password, passwordConfirm } }); },
      };
    },
  };
  return client;
}
