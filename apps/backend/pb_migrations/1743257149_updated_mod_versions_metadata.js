/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3646822515")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "file3166363787",
    "maxSelect": 1,
    "maxSize": 209715200,
    "mimeTypes": [],
    "name": "archive_file",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3646822515")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "file3166363787",
    "maxSelect": 1,
    "maxSize": 209715200,
    "mimeTypes": [],
    "name": "archive_file",
    "presentable": false,
    "protected": true,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
