/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "bool3883874661",
    "name": "is_variant",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

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

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1648238674",
    "max": 0,
    "min": 0,
    "name": "modinfo_path",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "json907403920",
    "maxSize": 0,
    "name": "localized_names",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // remove field
  collection.fields.removeById("bool3883874661")

  // remove field
  collection.fields.removeById("bool2441482531")

  // remove field
  collection.fields.removeById("text1648238674")

  // remove field
  collection.fields.removeById("json907403920")

  return app.save(collection)
})
