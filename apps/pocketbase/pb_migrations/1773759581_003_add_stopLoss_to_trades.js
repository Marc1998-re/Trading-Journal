/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");

  const existing = collection.fields.getByName("stopLoss");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("stopLoss"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "stopLoss",
    required: true
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.removeByName("stopLoss");
  return app.save(collection);
})