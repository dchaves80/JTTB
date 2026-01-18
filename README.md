# JTTB - Terminal Toolbox

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

## License

MIT
