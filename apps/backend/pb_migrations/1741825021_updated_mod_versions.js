/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "bool3087395605",
    "name": "skip_install",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // remove field
  collection.fields.removeById("bool3087395605")

  return app.save(collection)
})
