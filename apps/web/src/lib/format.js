export const money = (value, sign = false) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', signDisplay: sign ? 'exceptZero' : 'auto' }).format(value);
export const decimal = (value, digits = 2) => value === null || value === undefined || Number.isNaN(Number(value)) ? '—' : value === Infinity ? '∞' : new Intl.NumberFormat('de-DE', {minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
export const percent = (value, { digits = 1, sign = false } = {}) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('de-DE', {
  style: 'percent', minimumFractionDigits: digits, maximumFractionDigits: digits,
  signDisplay: sign ? 'exceptZero' : 'auto',
}).format(Number(value) / 100);
export const rValue = (value) => value === null || value === undefined ? '—' : `${value>0?'+':''}${decimal(value)} R`;
export const shortMoney = (value) => Math.abs(value)>=1000 ? new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(value/1000)+' k€' : new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(value)+' €';
