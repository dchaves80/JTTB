# JTTB - Terminal Toolbox

[![Docker Hub](https://img.shields.io/docker/v/edering/jttb?label=Docker%20Hub&logo=docker)](https://hub.docker.com/r/edering/jttb)
[![GitHub](https://img.shields.io/badge/GitHub-Source-black?logo=github)](https://github.com/dchaves80/JTTB)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-ff5f5f?logo=ko-fi)](https://ko-fi.com/edering)

A web-based terminal for Kubernetes cluster debugging and administration.

```
     ██╗████████╗████████╗██████╗
     ██║╚══██╔══╝╚══██╔══╝██╔══██╗
     ██║   ██║      ██║   ██████╔╝
██   ██║   ██║      ██║   ██╔══██╗
╚█████╔╝   ██║      ██║   ██████╔╝
 ╚════╝    ╚═╝      ╚═╝   ╚═════╝
```

## Overview

JTTB provides a secure web terminal with built-in tools for debugging connectivity, querying databases, and troubleshooting services inside a Kubernetes cluster - without needing `kubectl exec`.

**Key Features:**
- JWT-based authentication
- Command execution via web UI
- File upload/download (drag & drop)
- Built-in database clients (PostgreSQL, MongoDB, SQL Server, MySQL, Redis)
- Network debugging tools (nmap, netcat, curl, nslookup, tcpdump)

---

## Documentation

| Document | Description |
|----------|-------------|
| [Quick Start](docs/quick-start.md) | Get JTTB running in 5 minutes |
| [Configuration](docs/configuration.md) | Environment variables and settings |
| [Usage Guide](docs/usage-guide.md) | Terminal commands and features |
| [Architecture](docs/architecture.md) | Technical design and stack |

---

## Quick Start

```bash
docker run -d -p 8080:80 \
  -e JTTB_JWT_SECRET="your-secret-key" \
  -e JTTB_USER="admin" \
  -e JTTB_PASSWORD="admin123" \
  edering/jttb:latest
```

Access at `http://localhost:8080`

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Angular 18 (Standalone) |
| Backend | Node.js + Express |
| Auth | JWT + bcrypt |
| Container | Alpine Linux 3.19 |
| Process Manager | Supervisord |
| Reverse Proxy | Nginx |

---

## Support

If JTTB helped you, consider buying me a coffee:

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-ff5f5f?logo=ko-fi&logoColor=white)](https://ko-fi.com/edering)

---

## License

MIT
