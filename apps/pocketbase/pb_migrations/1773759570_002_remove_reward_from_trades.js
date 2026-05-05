/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.removeByName("reward");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.add(new NumberField({
    name: "reward"
  }));
  return app.save(collection);
})