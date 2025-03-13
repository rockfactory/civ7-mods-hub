/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "bool1923559629",
    "name": "download_error",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // remove field
  collection.fields.removeById("bool1923559629")

  return app.save(collection)
})
