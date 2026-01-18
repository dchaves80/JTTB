# Architecture

Technical overview of JTTB's design and components.

---

## High-Level Overview

```mermaid
flowchart TB
    subgraph container["JTTB Container (Alpine)"]
        subgraph supervisor["Supervisord (PID 1)"]
            direction LR
        end

        subgraph nginx["Nginx :80"]
            static["Static Files<br/>(Angular SPA)"]
        end

        subgraph backend["Node.js Backend :3000"]
            auth["Authentication"]
            exec["Command Execution"]
            files["File Transfer"]
        end

        subgraph tools["System Tools"]
            db["psql, mongosh<br/>tsql, mysql<br/>redis-cli"]
            net["curl, nmap<br/>netcat, nslookup"]
        end

        supervisor --> nginx
        supervisor --> backend
        nginx -->|"/api/*"| backend
        backend -->|"child_process.exec()"| tools
    end

    browser["Browser (User)"] <--> nginx
```

---

## Components

### 1. Supervisord

**Role:** Process manager (PID 1)

Manages both Nginx and the Node.js backend, ensuring they stay running.

```mermaid
flowchart LR
    supervisord["Supervisord"]
    supervisord --> banner["startup-banner<br/>(runs once)"]
    supervisord --> nginx["nginx<br/>(autorestart)"]
    supervisord --> backend["jttb-backend<br/>(autorestart)"]
```

### 2. Nginx

**Role:** Reverse proxy + static file server

- Serves the compiled Angular SPA
- Proxies `/api/*` requests to the Node.js backend
- Handles static assets efficiently

**Port:** 80

### 3. Node.js Backend

**Role:** API server

- **Authentication:** JWT-based login with bcrypt password hashing
- **Command Execution:** Runs shell commands via `child_process.exec()`
- **File Transfer:** Upload (multer) and download (streaming)

**Port:** 3000 (internal only)

### 4. Angular Frontend

**Role:** User interface

- Standalone components (Angular 18+)
- Terminal emulator with command history
- Drag & drop file upload
- JWT token management

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/auth/login` | No | User login |
| GET | `/api/auth/verify` | Yes | Verify token |
| POST | `/api/exec` | Yes | Execute command |
| GET | `/api/download` | Yes | Download file |
| POST | `/api/upload` | Yes | Upload file |

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Nginx
    participant S as Backend

    B->>N: POST /api/auth/login<br/>{username, password}
    N->>S: Forward request
    S->>S: Verify password (bcrypt)
    S-->>N: {token, expiresIn}
    N-->>B: JWT Token

    Note over B: Store token in localStorage

    B->>N: POST /api/exec<br/>Authorization: Bearer <token>
    N->>S: Forward request
    S->>S: Verify JWT
    S->>S: Execute command
    S-->>N: {stdout, stderr}
    N-->>B: Command output
```

---

## Command Execution

Commands are executed using Node.js `child_process.exec()`:

```javascript
exec(command, {
  cwd: currentWorkingDirectory,
  timeout: EXEC_TIMEOUT,        // Default: 30s
  maxBuffer: 1024 * 1024,       // 1MB
  encoding: 'utf8',
  shell: detectedShell          // sh, bash, cmd, powershell
});
```

**Security considerations:**
- All commands require authentication
- Timeout prevents runaway processes
- Buffer limits prevent memory exhaustion
- Commands run with container's user permissions

---

## Docker Build Process

```mermaid
flowchart LR
    subgraph stage1["Stage 1: Frontend Build"]
        node1["node:20-alpine"]
        npm1["npm install"]
        build["npm run build:prod"]
        node1 --> npm1 --> build
    end

    subgraph stage2["Stage 2: Backend Build"]
        node2["node:20-alpine"]
        npm2["npm install --production"]
        node2 --> npm2
    end

    subgraph stage3["Stage 3: Final Image"]
        alpine["alpine:3.19"]
        tools["Install tools:<br/>nginx, psql, mongosh,<br/>nmap, curl, etc."]
        copy["Copy built assets"]
        alpine --> tools --> copy
    end

    stage1 --> stage3
    stage2 --> stage3
```

**Final image size:** ~200MB (includes all debugging tools)

---

## Directory Structure

```
/
├── app/
│   ├── jttb-back/
│   │   ├── server.js
│   │   ├── package.json
│   │   └── node_modules/
│   └── jttb-front/
│       └── (compiled Angular files)
├── etc/
│   ├── nginx/http.d/default.conf
│   └── supervisord.conf
├── help.txt
└── var/log/
    └── supervisord.log
```

---

## Included Tools

| Category | Tools |
|----------|-------|
| **Database Clients** | psql, mongosh, mongostat, mongodump, tsql, mysql, redis-cli |
| **Network** | curl, wget, netcat, nmap, nslookup, dig, mtr, traceroute |
| **SSL/TLS** | openssl |
| **Utilities** | jq, bash, ip, ss, netstat, tcpdump |

---

## Resource Requirements

| Resource | Request | Limit |
|----------|---------|-------|
| CPU | 100m | 500m |
| Memory | 128Mi | 512Mi |

Adjust based on expected usage. Heavy database queries or file transfers may require more memory.

---

## Network Flow in Kubernetes

```mermaid
flowchart LR
    subgraph cluster["Kubernetes Cluster"]
        subgraph ns1["Namespace: toolbox"]
            jttb["JTTB Pod<br/>:80"]
        end

        subgraph ns2["Namespace: databases"]
            pg["PostgreSQL<br/>:5432"]
            mongo["MongoDB<br/>:27017"]
            redis["Redis<br/>:6379"]
        end

        subgraph ns3["Namespace: backend"]
            api["API Services<br/>:3000"]
        end

        jttb -.->|"DNS: postgres.databases"| pg
        jttb -.->|"DNS: mongodb.databases"| mongo
        jttb -.->|"DNS: redis.cache"| redis
        jttb -.->|"DNS: api.backend"| api
    end

    user["User"] -->|"NodePort / Ingress"| jttb
```
