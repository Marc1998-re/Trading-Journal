/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");

  const existing = collection.fields.getByName("stopLossPips");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("stopLossPips"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "stopLossPips",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.removeByName("stopLossPips");
  return app.save(collection);
})