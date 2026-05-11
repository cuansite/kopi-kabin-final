/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fix Bug: createRule null means only PocketBase superuser can create users.
  // Setting to admin role allows app-level admins to create staff accounts.
  const users = app.findCollectionByNameOrId("_pb_users_auth_")
  unmarshal({ "createRule": "@request.auth.role = 'admin'" }, users)
  app.save(users)

  // Fix Bug: same relation-field comparison issue as transactions.
  const requests = app.findCollectionByNameOrId("pbc_1003195976")
  unmarshal({
    "createRule": "@request.auth.role = 'kurir' || @request.auth.role = 'admin'",
  }, requests)
  return app.save(requests)
}, (app) => {
  const users = app.findCollectionByNameOrId("_pb_users_auth_")
  unmarshal({ "createRule": null }, users)
  app.save(users)

  const requests = app.findCollectionByNameOrId("pbc_1003195976")
  unmarshal({
    "createRule": "@request.auth.role = 'kurir' && kurirId = @request.auth.id",
  }, requests)
  return app.save(requests)
})
