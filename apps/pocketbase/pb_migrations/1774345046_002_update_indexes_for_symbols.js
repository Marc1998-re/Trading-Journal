/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("symbols");
  collection.indexes.push("CREATE UNIQUE INDEX idx_symbols_symbol ON symbols (symbol)");
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("symbols");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_symbols_symbol"));
  return app.save(collection);
})