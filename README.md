# FreshCart (React + Vite)
## Run locally
```
npm install
cp .env.example .env   # optional; defaults to the Route API
npm run dev            # http://localhost:5173
npm run build          # production build in dist/
```
Deploy to Vercel/Netlify as-is (`vercel.json` handles SPA rewrites).
## Structure
src/api.js (Axios + interceptors) · src/context/AppContext.jsx (auth, cart, wishlist, persistence)
src/components (Navbar, ProductCard, Guard, skeletons) · src/pages (Catalog, Auth, Shop) · src/App.jsx (routes)
## Persistence
JWT in localStorage (`fc_token`); profile, cart and wishlist are cached in localStorage for instant render on F5, then re-synced from the API whenever a token exists. A 401 clears the session.
