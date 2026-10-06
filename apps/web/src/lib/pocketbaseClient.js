import Pocketbase from 'pocketbase';
import { createJournalApiClient } from './journalApiClient';

const POCKETBASE_API_URL = import.meta.env.VITE_POCKETBASE_URL || "/hcgi/platform";

const backend = import.meta.env.VITE_DATA_BACKEND || 'mysql';
if (!['mysql', 'pocketbase'].includes(backend)) throw new Error('VITE_DATA_BACKEND must be mysql or pocketbase.');
// Keep an explicit rollback option; the existing import path remains a compatibility boundary.
const pocketbaseClient = backend === 'pocketbase' ? new Pocketbase(POCKETBASE_API_URL) : createJournalApiClient(import.meta.env.VITE_API_URL || '/api');
if (backend === 'pocketbase') {
  const legacy = pocketbaseClient;
  const collection = legacy.collection.bind(legacy);
  legacy.collection = name => {
    const service = collection(name);
    return new Proxy(service, { get(target, key) {
      if (['getList', 'getFullList'].includes(key)) return (...args) => {
        const index = key === 'getList' ? 2 : 0;
        const options = { ...(args[index] || {}) };
        if (options.filter && typeof options.filter === 'object') {
          options.filter = Object.entries(options.filter).map(([field, value]) => {
            if (!['userId', 'accountId'].includes(field)) throw new Error('Unsupported legacy filter.');
            return legacy.filter(`${field} = {:value}`, { value });
          }).join(' && ');
        }
        args[index] = options;
        return target[key](...args);
      };
      const value = Reflect.get(target, key);
      return typeof value === 'function' ? value.bind(target) : value;
    } });
  };
}

export default pocketbaseClient;

export { pocketbaseClient };
