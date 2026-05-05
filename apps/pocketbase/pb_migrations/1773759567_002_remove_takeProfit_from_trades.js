/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.removeByName("takeProfit");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.add(new NumberField({
    name: "takeProfit"
  }));
  return app.save(collection);
})