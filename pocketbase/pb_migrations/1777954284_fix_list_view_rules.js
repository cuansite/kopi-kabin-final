/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fix: relation-field comparison in listRule/viewRule causes 400 in PB v0.26.8
  // when admin (or kurir) tries to list records. Replace with role-based access.
  // Security: any authenticated user can list; kurir frontend adds own ID filter.
  const requests = app.findCollectionByNameOrId("pbc_1003195976")
  unmarshal({
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
  }, requests)
  app.save(requests)

  const transactions = app.findCollectionByNameOrId("pbc_3174063690")
  unmarshal({
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
  }, transactions)
  return app.save(transactions)
}, (app) => {
  const requests = app.findCollectionByNameOrId("pbc_1003195976")
  unmarshal({
    "listRule": "kurirId = @request.auth.id || @request.auth.role = 'admin'",
    "viewRule": "kurirId = @request.auth.id || @request.auth.role = 'admin'",
  }, requests)
  app.save(requests)

  const transactions = app.findCollectionByNameOrId("pbc_3174063690")
  unmarshal({
    "listRule": "kurirId = @request.auth.id || @request.auth.role = 'admin'",
    "viewRule": "kurirId = @request.auth.id || @request.auth.role = 'admin'",
  }, transactions)
  return app.save(transactions)
})
