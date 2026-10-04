const today = new Date();
const date = offset => new Date(today.getFullYear(), today.getMonth() + offset, 10).toLocaleDateString('sv-SE');
const accounts = [
  { id: 'qa-a', accountName: 'Testkonto A', startingBalance: 10000 },
  { id: 'qa-b', accountName: 'Testkonto B', startingBalance: 20000 },
];
let records = [
  { id: 'qa-one', symbol: 'TEST/ONE', accountId: 'qa-a', entryDate: date(0), entryTime: '09:00', notes: '', profitLoss: 200, riskAmount: 100, fees: 4 },
  { id: 'qa-two', symbol: 'TEST/TWO', accountId: 'qa-a', entryDate: date(0), entryTime: '10:00', notes: '', profitLoss: -100, riskAmount: 100, fees: 4 },
  { id: 'qa-old', symbol: 'TEST/OLD', accountId: 'qa-a', entryDate: date(-1), entryTime: '12:00', notes: 'Bereits gespeichert', profitLoss: 100, riskAmount: 100, fees: 4 },
  { id: 'qa-other', symbol: 'TEST/OTHER', accountId: 'qa-b', entryDate: date(0), entryTime: '11:00', notes: '', profitLoss: 50, riskAmount: 100, fees: 4 },
];
let fail = false, hold = false, pending;
export const writes = [];
export const setFailure = value => { fail = value; };
export const setHold = value => { hold = value; };
export const release = () => { pending?.(); pending = null; };

export default {
  filter: () => 'qa-user-only',
  collection(name) {
    if (!['trades', 'tradingAccounts'].includes(name)) throw new Error('Unexpected test collection.');
    return {
      async getFullList() { return structuredClone(name === 'trades' ? records : accounts); },
      async update(id, patch) {
        if (name !== 'trades') throw new Error('Only test notes may be saved.');
        if (hold) await new Promise(resolve => { pending = resolve; });
        if (fail) throw new Error('Simulated save failure.');
        records = records.map(record => record.id === id ? { ...record, ...patch } : record);
        writes.push({ id, ...patch });
        return structuredClone(records.find(record => record.id === id));
      },
    };
  },
};
