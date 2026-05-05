/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("trades");

  const existing = collection.fields.getByName("stopLossPercentageNote");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("stopLossPercentageNote"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "stopLossPercentageNote",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("trades");
    collection.fields.removeByName("stopLossPercentageNote");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})