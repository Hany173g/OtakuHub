# OtakuHub Frontend (React + Vite)

A modern, comfortable-to-the-eye frontend for the OtakuHub blog, built with React, Vite, and Material UI. RTL-ready and themed with warm accents.

## Prerequisites
- Node.js 18+
- Backend running (OtakuHub `backend/`) on http://localhost:3001

## Quick Start
```bash
cd frontend
npm install
npm run dev
```
The app runs at: http://localhost:3000

## Environment
Create a `.env` file in `frontend/` (or copy `.env.example`) to point to your backend API:
```
VITE_API_URL=http://localhost:3001
```
If omitted, the frontend defaults to `http://localhost:3001`.

## Mapping to Backend Endpoints
- Auth
  - POST `/api/auth/register`
  - POST `/api/auth/login`
- Password Reset
  - POST `/api/auth/forget-password/`
  - POST `/api/auth/forget-password/resetPassword`
- Blogs
  - GET `/api/getBlogs`
  - POST `/api/createBlog` (multipart/form-data, field: `blogPhoto`)
  - POST `/api/addComment/:blogId`
  - POST `/api/addLikeBlog/` | `/api/addDislikeBlog/` (body: `{ action, service, id }`)
  - POST `/api/removelike/:blogId` | `/api/removeDislike/:blogId`

Note: The backend expects the JWT as a raw token in the `Authorization` header (no `Bearer` prefix). The frontend attaches it automatically if present in `localStorage`.

## Scripts
- `npm run dev`: Start Vite dev server (http://localhost:3000)
- `npm run build`: Production build to `dist/`
- `npm run preview`: Preview the production build

## Design Notes
- Material UI theme with dark-slate background for eye comfort.
- RTL enabled, Arabic UI labels.
- Logo available at `public/otakuhub-logo.svg`.

## Folder Structure
```
frontend/
  public/
    otakuhub-logo.svg
  src/
    components/
      Navbar.jsx
      BlogCard.jsx
      CreateBlogDialog.jsx
    pages/
      Feed.jsx
      Login.jsx
      Register.jsx
      ForgotPassword.jsx
      ResetPassword.jsx
    lib/
      api.js
    App.jsx
    main.jsx
    theme.js
  index.html
  vite.config.js
  package.json
```
