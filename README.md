# mk-petstore-frontend

React and TypeScript frontend for the pet store migration. API requests use the
Vite development proxy and are forwarded to the backend at
`http://localhost:8080`.

## Requirements

- Node.js and npm
- The `mk-petstore-backend` component running on port `8080`

## Running

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev

npm run dev -- --host 0.0.0.0
```

Then open <http://localhost:5173>.

Start the backend in a separate terminal:

```bash
cd ../mk-petstore-backend
mvn spring-boot:run
```

## Verification

```bash
npm run lint
npm run build
```