/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = 'kurir' && kurirId = @request.auth.id",
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "help": "",
        "hidden": false,
        "id": "relation3055533318",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "kurirId",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text3569661496",
        "max": 100,
        "min": 0,
        "name": "kurirName",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "help": "",
        "hidden": false,
        "id": "json3776899405",
        "maxSize": 0,
        "name": "items",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "json"
      },
      {
        "help": "",
        "hidden": false,
        "id": "number3225882586",
        "max": null,
        "min": null,
        "name": "totalAmount",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select2363381545",
        "maxSelect": 1,
        "name": "type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "sale",
          "restock",
          "adjustment"
        ]
      }
    ],
    "id": "pbc_3174063690",
    "indexes": [],
    "listRule": "kurirId = @request.auth.id || @request.auth.role = 'admin'",
    "name": "transactions",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": "kurirId = @request.auth.id || @request.auth.role = 'admin'"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3174063690");

  return app.delete(collection);
})
