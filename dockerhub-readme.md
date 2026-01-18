# JTTB - Terminal Toolbox

[![GitHub](https://img.shields.io/badge/GitHub-Source-black?logo=github)](https://github.com/dchaves80/JTTB)

Web-based terminal for Kubernetes cluster debugging and administration.

---

# 🚀 Quick Start

```bash
docker run -d -p 8080:80 \
  -e JTTB_JWT_SECRET="your-secret-key" \
  -e JTTB_USER="admin" \
  -e JTTB_PASSWORD="admin123" \
  edering/jttb:latest
```

Access at http://localhost:8080

---

# ✨ Features

- JWT-based authentication
- Command execution via web terminal
- File upload/download (drag & drop)
- Built-in database clients (PostgreSQL, MongoDB, SQL Server, MySQL, Redis)
- Network debugging tools (nmap, netcat, curl, nslookup, tcpdump)

---

# ⚙️ Environment Variables

**Required:**
- `JTTB_JWT_SECRET` - Secret for JWT signing
- `JTTB_USER` - Login username
- `JTTB_PASSWORD` - Login password

**Optional:**
- `JTTB_TOKEN_EXPIRY` - Token expiry (default: 8h)
- `JTTB_EXEC_TIMEOUT` - Command timeout in ms (default: 30000)

---

# 📚 Documentation

Full docs at https://github.com/dchaves80/JTTB

---

# 🏷️ Tags

- `latest` - Latest stable release
- `1.4` - Version 1.4 (UI improvements)
- `1.3` - Version 1.3 (Mercado Pago support)
- `1.2` - Version 1.2 (Ko-fi + PayPal support)
- `1.1` - Version 1.1
- `1.0` - Version 1.0

---

# ☕ Support

If JTTB helped you, consider supporting the project:

- Ko-fi: https://ko-fi.com/edering
- PayPal: https://paypal.me/ederingar
- Mercado Pago (ARS): [$100](https://mpago.la/1BGY98f) | [$300](https://mpago.la/1J9LbmG) | [$1000](https://mpago.la/2LDQsMa)
