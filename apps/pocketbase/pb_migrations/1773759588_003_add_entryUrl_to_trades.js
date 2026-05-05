/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");

  const existing = collection.fields.getByName("entryUrl");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("entryUrl"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "entryUrl",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("trades");
  collection.fields.removeByName("entryUrl");
  return app.save(collection);
})