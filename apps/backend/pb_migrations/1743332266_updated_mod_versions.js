/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // remove field
  collection.fields.removeById("bool2441482531")

  // add field
  collection.fields.addAt(22, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1350908007",
    "hidden": false,
    "id": "relation2093856798",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "version_parent_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "bool2441482531",
    "name": "variant_parent_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // remove field
  collection.fields.removeById("relation2093856798")

  return app.save(collection)
})
