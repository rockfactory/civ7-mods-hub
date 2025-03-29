/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3646822515")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_LMSLjIUEnJ` ON `mod_versions_metadata` (`version_id`)"
    ]
  }, collection)

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_1350908007",
    "hidden": false,
    "id": "relation1270621957",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "version_id",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3646822515")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_1350908007",
    "hidden": false,
    "id": "relation1270621957",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "version_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
