/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3490650372",
    "max": 0,
    "min": 0,
    "name": "modinfo_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1005355821",
    "max": 0,
    "min": 0,
    "name": "modinfo_version",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2552227389",
    "max": 0,
    "min": 0,
    "name": "modinfo_url",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "bool3183952402",
    "name": "affect_saves",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3518522040",
    "max": 0,
    "min": 0,
    "name": "hash",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3785208867",
    "max": 0,
    "min": 0,
    "name": "archive_hash",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "bool1063119061",
    "name": "is_external_download",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "hidden": false,
    "id": "date4215628054",
    "max": "",
    "min": "",
    "name": "released",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1350908007")

  // remove field
  collection.fields.removeById("text3490650372")

  // remove field
  collection.fields.removeById("text1005355821")

  // remove field
  collection.fields.removeById("text2552227389")

  // remove field
  collection.fields.removeById("bool3183952402")

  // remove field
  collection.fields.removeById("text3518522040")

  // remove field
  collection.fields.removeById("text3785208867")

  // remove field
  collection.fields.removeById("bool1063119061")

  // remove field
  collection.fields.removeById("date4215628054")

  return app.save(collection)
})
