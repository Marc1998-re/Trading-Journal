export const reviewTags = [
  ['plan', 'Plan eingehalten'], ['early', 'Zu früher Einstieg'], ['late', 'Zu später Einstieg'],
  ['risk', 'Risiko überschritten'], ['exit', 'Ausstieg überdenken'], ['patience', 'Geduld bewahrt'],
];
export const reviewStatusLabels = { open: 'Offen', draft: 'Entwurf', completed: 'Abgeschlossen' };

export function reviewForm(trade) {
  return {
    notes: trade.notes || '', reviewSetup: trade.reviewSetup || '', reviewRisk: trade.reviewRisk || '',
    reviewTags: Array.isArray(trade.reviewTags) ? [...trade.reviewTags].sort() : [],
    reviewLesson: trade.reviewLesson || '', reviewAction: trade.reviewAction || '',
  };
}

export function reviewStatus(trade) {
  if (trade.reviewStatus === 'completed') return 'completed';
  const form = reviewForm(trade);
  return trade.reviewStatus === 'draft' || Object.values(form).some(value => Array.isArray(value) ? value.length : value.trim()) ? 'draft' : 'open';
}

export function reviewPayload(form, status) {
  if (!['draft', 'completed'].includes(status)) throw new Error('Ungültiger Review-Status.');
  const value = reviewForm(form);
  for (const field of ['notes', 'reviewLesson', 'reviewAction']) {
    value[field] = value[field].trim();
    if (value[field].length > (field === 'notes' ? 5000 : 1000)) throw new Error('Bitte kürze deinen Text auf die angegebene Länge.');
  }
  for (const field of ['reviewSetup', 'reviewRisk']) {
    if (!['', 'yes', 'no', 'na'].includes(value[field])) throw new Error('Ungültige Antwort im Regel-Check.');
  }
  value.reviewTags = [...new Set(value.reviewTags)].sort();
  if (value.reviewTags.some(tag => !reviewTags.some(([id]) => id === tag))) throw new Error('Unbekannter Lern-Tag.');
  if (status === 'completed' && (!value.reviewLesson || !value.reviewAction)) {
    throw new Error('Halte eine Erkenntnis und einen nächsten Schritt fest, bevor du den Review abschließt.');
  }
  return { ...value, reviewStatus: status };
}

export function summarizeReviews(trades) {
  const counts = { open: 0, draft: 0, completed: 0 };
  const tags = new Map();
  for (const trade of trades) {
    const status = reviewStatus(trade);
    counts[status]++;
    if (status === 'completed') for (const tag of new Set(trade.reviewTags || [])) tags.set(tag, (tags.get(tag) || 0) + 1);
  }
  return { ...counts, tags: reviewTags.filter(([id]) => tags.has(id)).map(([id, label]) => ({ id, label, count: tags.get(id) })) };
}
