/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "number3353735921",
    "max": null,
    "min": null,
    "name": "archive_size",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // remove field
  collection.fields.removeById("number3353735921")

  return app.save(collection)
})
