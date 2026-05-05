/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");

  const existing = collection.fields.getByName("rrSecured");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("rrSecured"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "rrSecured",
    required: true
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.removeByName("rrSecured");
  return app.save(collection);
})