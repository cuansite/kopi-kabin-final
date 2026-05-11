/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fix Bug: PB v0.37 doesn't auto-add created/updated fields.
  // Sort by -created in admin RequestManagement (and others) returned 400.
  const collections = ["pbc_1003195976", "pbc_3174063690", "pbc_3573984430"]

  for (const id of collections) {
    const c = app.findCollectionByNameOrId(id)

    c.fields.add(new Field({
      "hidden": false,
      "id": "autodate_created",
      "name": "created",
      "onCreate": true,
      "onUpdate": false,
      "presentable": false,
      "system": false,
      "type": "autodate"
    }))

    c.fields.add(new Field({
      "hidden": false,
      "id": "autodate_updated",
      "name": "updated",
      "onCreate": true,
      "onUpdate": true,
      "presentable": false,
      "system": false,
      "type": "autodate"
    }))

    app.save(c)
  }
}, (app) => {
  const collections = ["pbc_1003195976", "pbc_3174063690", "pbc_3573984430"]
  for (const id of collections) {
    const c = app.findCollectionByNameOrId(id)
    c.fields.removeById("autodate_created")
    c.fields.removeById("autodate_updated")
    app.save(c)
  }
})
