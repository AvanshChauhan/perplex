# Perplex

An AI-powered conversational search assistant built with modern web technologies. Users can ask questions, get AI-generated responses with optional internet search, and manage chat history.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TailwindCSS 4, React Router 7 |
| Backend | Node.js, Express 5, Socket.io 4 |
| Database | MongoDB (Mongoose 9) |
| AI/LLM | Google Gemini (via LangChain), Mistral AI |
| Search | Tavily API |
| Auth | JWT (HTTP-only cookies), bcryptjs |
| Email | Nodemailer (Gmail SMTP) |

## Architecture

- **Frontend** — Deployed on Vercel
- **Backend API** — Deployed on Render
- API calls from the frontend are proxied through Vercel rewrites to Render (same-origin, no CORS issues)
- Socket.io connections go directly to Render for real-time communication

## Features

- User registration with email verification
- JWT-based authentication (HTTP-only cookies)
- AI chat with Google Gemini (gemini-2.5-flash)
- Automatic chat title generation (Mistral AI)
- Internet search integration (Tavily)
- Chat history management (create, select, delete)
- Responsive design with collapsible sidebar
- Rate limiting and security headers

## Environment Variables

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `production` or `development` |
| `CLIENT_URL` | Frontend URL (for CORS) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `GOOGLE_USER` | Gmail address for sending emails |
| `GOOGLE_APP_PASSWORD` | Gmail app password |
| `GOOGLE_API_KEY` | Google Generative AI API key |
| `MISTRAL_API_KEY` | Mistral AI API key |
| `TAVILY_API_KEY` | Tavily Search API key |

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_SOCKET_URL` | Backend URL for Socket.io (e.g. `https://perplex-ankb.onrender.com`) |

## Local Development

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Backend: start dev server (with nodemon)
npm run dev

# Frontend: start Vite dev server (separate terminal)
cd frontend && npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`.

## Deployment

### Backend (Render)

1. Connect your GitHub repo to Render
2. Set **Root Directory** to `./`
3. **Start Command**: `npm start`
4. Add all environment variables listed above
5. Set `NODE_ENV=production` and `CLIENT_URL=https://your-vercel-domain.vercel.app`

### Frontend (Vercel)

1. Import the same GitHub repo
2. Set **Root Directory** to `frontend/`
3. **Framework**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Add `VITE_SOCKET_URL` environment variable pointing to your Render backend
