/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("userSettings");
  const field = collection.fields.getByName("commissionPercentage");
  field.required = false;
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("userSettings");
  const field = collection.fields.getByName("commissionPercentage");
  field.required = true;
  return app.save(collection);
})