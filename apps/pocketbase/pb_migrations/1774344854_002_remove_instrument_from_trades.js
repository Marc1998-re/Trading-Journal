/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.removeByName("instrument");
  return app.save(collection);
}, (app) => {

  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.add(new TextField({
    name: "instrument",
    required: true,
    min: 0,
    max: 0
  }));
  return app.save(collection);
})