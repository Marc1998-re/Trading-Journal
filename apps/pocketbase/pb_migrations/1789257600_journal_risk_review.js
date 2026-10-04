migrate((app) => {
  const trades=app.findCollectionByNameOrId('trades');
  const additions=[
    new NumberField({name:'riskAmount',min:0}),
    new NumberField({name:'fees',min:0}),
    new TextField({name:'setup',max:80}),
    new SelectField({name:'side',values:['long','short'],maxSelect:1})
  ];
  for(const field of additions) if(!trades.fields.getByName(field.name))trades.fields.add(field);
  app.save(trades);
  const users=app.findCollectionByNameOrId('users');
  users.createRule='@request.body.verified != true';
  users.listRule='id = @request.auth.id';
  users.viewRule='id = @request.auth.id';
  users.updateRule='id = @request.auth.id && @request.body.verified:changed = false';
  users.deleteRule='id = @request.auth.id';
  users.manageRule=null;
  users.fields.getByName('password').min=12;
  app.save(users);
  const settings=app.settings();
  settings.meta.appName='The Trading Desk';
  settings.meta.senderName='The Trading Desk';
  if($os.getenv('APP_URL'))settings.meta.appUrl=$os.getenv('APP_URL');
  app.save(settings);
  for(const name of ['trades','tradingAccounts','userSettings','symbols','cookieConsent']) {
    const c=app.findCollectionByNameOrId(name);
    const owner='@request.auth.id != "" && @request.auth.verified = true && userId = @request.auth.id';
    c.listRule=owner;c.viewRule=owner;c.deleteRule=owner;
    c.createRule=owner;
    c.updateRule=owner+' && @request.body.userId:changed = false';
    app.save(c);
  }
}, () => {
  // Intentionally preserve risk snapshots and ownership protections on rollback.
});
