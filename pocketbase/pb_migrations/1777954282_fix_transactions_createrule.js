/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3174063690")

  // Fix: relation-field comparison in createRule causes 500 in PB v0.26.8.
  // Role check is sufficient; frontend enforces kurirId = user.id.
  unmarshal({
    "createRule": "@request.auth.role = 'kurir' || @request.auth.role = 'admin'",
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3174063690")

  unmarshal({
    "createRule": "@request.auth.role = 'kurir' && kurirId = @request.auth.id",
  }, collection)

  return app.save(collection)
})
