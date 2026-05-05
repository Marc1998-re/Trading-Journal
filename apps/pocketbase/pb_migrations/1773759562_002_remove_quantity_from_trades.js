/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.removeByName("quantity");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.add(new NumberField({
    name: "quantity"
  }));
  return app.save(collection);
})