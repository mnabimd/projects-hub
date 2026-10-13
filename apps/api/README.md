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
npm install

# create your env file and fill in the values
cp .env.example .env

# run in development (nodemon)
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with nodemon |
| `npm start` | Start in production with PM2 |
| `npm test` | Run tests |
| `npm run coverage` | Run tests with coverage |
| `npm run lint` / `npm run lint:fix` | Lint the code |
| `npm run prettier` / `npm run prettier:fix` | Check / fix formatting |
| `npm run docker:dev` | Run with Docker (development) |

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
