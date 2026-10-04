migrate((app) => {
  const trades = app.findCollectionByNameOrId('trades');
  const fields = [
    new SelectField({ name: 'reviewStatus', values: ['draft', 'completed'], maxSelect: 1 }),
    new SelectField({ name: 'reviewSetup', values: ['yes', 'no', 'na'], maxSelect: 1 }),
    new SelectField({ name: 'reviewRisk', values: ['yes', 'no', 'na'], maxSelect: 1 }),
    new SelectField({ name: 'reviewTags', values: ['plan', 'early', 'late', 'risk', 'exit', 'patience'], maxSelect: 6 }),
    new TextField({ name: 'reviewLesson', max: 1000 }),
    new TextField({ name: 'reviewAction', max: 1000 }),
    new DateField({ name: 'reviewCompletedAt' }),
  ];
  for (const field of fields) if (!trades.fields.getByName(field.name)) trades.fields.add(field);
  app.save(trades);
}, () => {
  // Preserve review content on rollback. Existing notes are never rewritten.
});
