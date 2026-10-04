migrate((app) => {
  const settings=app.settings();
  settings.meta.appName='The Trading Desk';
  settings.meta.senderName='The Trading Desk';
  app.save(settings);
}, () => {
  // A rollback must not restore obsolete branding or change the sender address.
});
