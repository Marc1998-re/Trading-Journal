/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.removeByName("entryPrice");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.add(new NumberField({
    name: "entryPrice"
  }));
  return app.save(collection);
})