/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("tradingAccounts");

  const existing = collection.fields.getByName("startingBalance");
  if (existing) {
    if (existing.type === "number") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("startingBalance"); // exists with wrong type, remove first
  }

  collection.fields.add(new NumberField({
    name: "startingBalance",
    required: true,
    min: 0
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("tradingAccounts");
    collection.fields.removeByName("startingBalance");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})