# 🍕 jwt-pizza-service

- name: Update coverage
  run: |
    coverage=$(jq '.total.lines.pct' coverage/coverage-summary.json)
    color=$(echo "$coverage < 80" | bc | awk '{if ($1) print "red"; else print "green"}')
    curl -s -X POST "https://pizza-factory.cs329.click/api/badge/${{ secrets.cwarner0 }}/jwtpizzaservicecoverage?label=Coverage&value=$coverage%25&color=$color" -H "authorization: bearer ${{ secrets.db9dfdf3a148419d9012a2acd92e41d5 }}"
  
![Coverage badge](https://pizza-factory.cs329.click/api/badge/accountId/jwtpizzaservicecoverage)

Backend service for making JWT pizzas. This service tracks users and franchises and orders pizzas. All order requests are passed to the JWT Pizza Factory where the pizzas are made.

JWTs are used for authentication objects.

## Deployment

In order for the server to work correctly it must be configured by providing a `config.js` file.

```js
module.exports =  {
    // Your JWT secret can be any random string you would like. It just needs to be secret.
   jwtSecret: 'yourjwtsecrethere',
   db: {
   connection: {
      host: '127.0.0.1',
      user: 'root',
      password: 'yourpasswordhere',
      database: 'pizza',
      connectTimeout: 60000,
   },
   listPerPage: 10,
   },
   factory: {
   url: 'https://pizza-factory.cs329.click',
   apiKey: 'yourapikeyhere',
   },
};
```

## Endpoints

You can get the documentation for all endpoints by making the following request.

```sh
curl localhost:3000/api/docs
```

## Development notes

Install the required packages.
npm start
```sh
npm install express jsonwebtoken mysql2 bcrypt
```

Nodemon is assumed to be installed globally so that you can have hot reloading when debugging.

```sh
npm -g install nodemon
```
