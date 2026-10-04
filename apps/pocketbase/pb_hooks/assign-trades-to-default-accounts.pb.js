/// <reference path="../pb_data/types.d.ts" />
// Validate account ownership; never silently attach a trade to somebody else's account.
onRecordCreateRequest((e) => {
  const accountId=e.record.getString('accountId');
  if(!accountId) throw new BadRequestError('Bitte wähle ein Handelskonto.');
  let account;
  try { account=e.app.findRecordById('tradingAccounts',accountId); }
  catch { throw new BadRequestError('Handelskonto nicht gefunden.'); }
  if(!e.auth || account.getString('userId')!==e.auth.id || e.record.getString('userId')!==e.auth.id) {
    throw new ForbiddenError('Dieses Handelskonto gehört nicht zu deinem Benutzer.');
  }
  e.next();
}, 'trades');
onRecordUpdateRequest((e) => {
  const account=e.app.findRecordById('tradingAccounts',e.record.getString('accountId'));
  if(!e.auth || account.getString('userId')!==e.auth.id || e.record.getString('userId')!==e.auth.id) {
    throw new ForbiddenError('Dieses Handelskonto gehört nicht zu deinem Benutzer.');
  }
  e.next();
}, 'trades');
