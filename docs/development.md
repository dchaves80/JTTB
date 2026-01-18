# Development

Run JTTB locally for development and testing.

---

## Prerequisites

- Node.js 18+ installed
- npm installed

---

## Install Dependencies

```bash
# Frontend
cd jttb-front
npm install

# Backend
cd ../jttb-back
npm install
```

---

## Run Development Servers

### Windows

```cmd
dev.bat
```

Opens two terminal windows (frontend and backend).

### Linux / WSL

```bash
chmod +x dev.sh
./dev.sh
```

Runs both servers in the background.

---

## Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend | http://localhost:3000 |

**Default credentials:**
- User: `admin`
- Password: `admin`

---

## Environment Variables

The dev scripts set these automatically:

| Variable | Dev Value |
|----------|-----------|
| `JTTB_JWT_SECRET` | dev-secret-key |
| `JTTB_USER` | admin |
| `JTTB_PASSWORD` | admin |

---

## Stop Servers

### Windows
Close the terminal windows.

### Linux / WSL
Press `Ctrl+C` in the terminal.

---

## Project Structure

```
toolbox/
├── jttb-front/          # Angular frontend
│   ├── src/
│   └── package.json
├── jttb-back/           # Node.js backend
│   ├── server.js
│   └── package.json
├── dev.sh               # Linux dev script
├── dev.bat              # Windows dev script
├── build.sh             # Docker build script
└── Dockerfile           # Production build
```

---

## Notes

- Frontend runs on port 4200 (Angular default)
- Backend runs on port 3000 (Express)
- In production, Nginx proxies both under port 80
