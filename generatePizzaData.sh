#!/bin/bash

# Set the host
host=http://localhost:3000

# Log in as admin and get token
response=$(curl -s -X PUT $host/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@jwt.com","password":"admin"}')

token=$(echo $response | jq -r '.token')
echo "Token: $token"

# Add users
curl -X POST $host/api/auth -H "Content-Type: application/json" -d '{"name":"pizza diner","email":"d@jwt.com","password":"diner"}'
curl -X POST $host/api/auth -H "Content-Type: application/json" -d '{"name":"pizza franchisee","email":"f@jwt.com","password":"franchisee"}'

# Add menu items
curl -X PUT $host/api/order/menu -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"title":"Veggie","description":"A garden of delight","image":"pizza1.png","price":0.0038}'
curl -X PUT $host/api/order/menu -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"title":"Pepperoni","description":"Spicy treat","image":"pizza2.png","price":0.0042}'
curl -X PUT $host/api/order/menu -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"title":"Margarita","description":"Essential classic","image":"pizza3.png","price":0.0042}'
curl -X PUT $host/api/order/menu -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"title":"Crusty","description":"A dry mouthed favorite","image":"pizza4.png","price":0.0028}'
curl -X PUT $host/api/order/menu -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"title":"Charred Leopard","description":"For those with a darker side","image":"pizza5.png","price":0.0099}'

# Add franchise and store
curl -X POST $host/api/franchise -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"name":"pizzaPocket","admins":[{"email":"f@jwt.com"}]}'
curl -X POST $host/api/franchise/1/store -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d '{"franchiseId":1,"name":"SLC"}'

# Verify menu
curl -s $host/api/order/menu | jq '.[].description'
