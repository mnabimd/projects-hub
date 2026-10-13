# ProjectsHub API

REST API for **ProjectsHub** — the single backend serving the student web portal, admin panel and mobile app.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT auth (Passport)
- Joi validation
- Swagger docs (`/v1/docs` in development)
- Jest + Supertest

## Getting started

```bash
# install dependencies
yarn install

# create your env file and fill in the values
cp .env.example .env

# run in development (nodemon)
yarn dev
```

## Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start the dev server with nodemon |
| `yarn start` | Start in production with PM2 |
| `yarn test` | Run tests |
| `yarn coverage` | Run tests with coverage |
| `yarn lint` / `yarn lint:fix` | Lint the code |
| `yarn prettier` / `yarn prettier:fix` | Check / fix formatting |
| `yarn docker:dev` | Run with Docker (development) |

## Project structure

```
src/
├── config/        # Environment & app configuration
├── controllers/   # Route controllers
├── docs/          # Swagger definitions
├── middlewares/   # Express middlewares
├── models/        # Mongoose models
├── routes/        # API routes (v1)
├── services/      # Business logic
├── utils/         # Helpers
├── validations/   # Joi request schemas
├── app.js         # Express app
└── index.js       # Entry point
```

## Credits

Based on [node-express-boilerplate](https://github.com/hagopj13/node-express-boilerplate) by Hagop Jamkojian (MIT). See [LICENSE](./LICENSE).
