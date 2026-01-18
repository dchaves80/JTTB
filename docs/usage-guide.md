# Usage Guide

Learn how to use JTTB's terminal interface and built-in tools.

---

## Terminal Interface

After logging in, you'll see the terminal interface:

```
     ██╗████████╗████████╗██████╗
     ██║╚══██╔══╝╚══██╔══╝██╔══██╗
     ██║   ██║      ██║   ██████╔╝
██   ██║   ██║      ██║   ██╔══██╗
╚█████╔╝   ██║      ██║   ██████╔╝
 ╚════╝    ╚═╝      ╚═╝   ╚═════╝

JTTB - Terminal Toolbox v1.0
Type 'help' for commands

JTTB:[~]$ _
```

---

## Built-in Commands

| Command | Description |
|---------|-------------|
| `help` | Show available commands |
| `clear` | Clear the terminal screen |
| `pwd` | Print current working directory |
| `cd <dir>` | Change directory |
| `download <file>` | Download a file to your computer |
| `exit` | Logout from the terminal |

---

## File Transfer

### Download Files

```bash
download /etc/resolv.conf
download ./myfile.txt
```

### Upload Files

Simply **drag and drop** files onto the terminal window. Files are uploaded to the current working directory.

---

## Network Debugging

### DNS Resolution

```bash
# Resolve internal Kubernetes service
nslookup postgres.databases
nslookup myservice.namespace.svc.cluster.local

# Check DNS configuration
cat /etc/resolv.conf
```

### TCP Connectivity

```bash
# Test if a port is open
nc -zv postgres.databases 5432
nc -zv redis.cache 6379

# Scan multiple ports
nmap -p 5432,6379,27017 myhost.namespace
```

### HTTP Requests

```bash
# Simple GET request
curl http://api.backend:3000/health

# With headers
curl -H "Content-Type: application/json" http://api.backend:3000/endpoint

# POST with data
curl -X POST -H "Content-Type: application/json" \
  -d '{"key":"value"}' http://api.backend:3000/endpoint

# See response headers
curl -I http://api.backend:3000/health
```

---

## Database Clients

### PostgreSQL

```bash
# Connect interactively
psql -h postgres.databases -U myuser -d mydb

# Run a query
psql -h postgres.databases -U myuser -d mydb -c "SELECT * FROM users LIMIT 5"

# List databases
psql -h postgres.databases -U myuser -d postgres -c "\l"

# List tables
psql -h postgres.databases -U myuser -d mydb -c "\dt"
```

### MongoDB

```bash
# Connect interactively
mongosh mongodb.databases:27017

# Run a command
mongosh mongodb.databases:27017 --eval "show dbs"

# Export a collection
mongodump --host mongodb.databases --out /tmp/backup
```

### SQL Server

```bash
# Connect using FreeTDS
tsql -H sqlserver.databases -p 1433 -U sa
# Enter password when prompted
```

### MySQL

```bash
# Connect interactively
mysql -h mysql.databases -u myuser -p
```

### Redis

```bash
# Connect
redis-cli -h redis.cache -p 6379

# Run a command
redis-cli -h redis.cache ping
redis-cli -h redis.cache keys "*"
```

---

## SSL/TLS Debugging

```bash
# Test SSL connection
openssl s_client -connect myhost:443

# View certificate details
openssl s_client -connect myhost:443 -showcerts
```

---

## Kubernetes Service Discovery

Services in Kubernetes can be accessed using:

| Format | Example |
|--------|---------|
| Short | `myservice.namespace` |
| Full | `myservice.namespace.svc.cluster.local` |

```bash
# These are equivalent
nslookup postgres.databases
nslookup postgres.databases.svc.cluster.local
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Execute command |
| `↑` | Previous command in history |
| `↓` | Next command in history |

---

## Tips & Tricks

### View extended help
```bash
cat /help.txt
```

### Check container network
```bash
ip addr
ip route
cat /etc/hosts
```

### Monitor connections
```bash
netstat -tulpn
ss -tulpn
```

### Capture network traffic
```bash
tcpdump -i any port 5432
```

---

## Troubleshooting

### "Command not found"

The command may not be installed. JTTB includes common tools but not everything. Check available tools:

```bash
which psql mongosh curl nmap
```

### "Connection refused"

The target service may be down or the port is wrong:

```bash
# Verify the service exists
nslookup myservice.namespace

# Check if port is open
nc -zv myservice.namespace 5432
```

### "Name resolution failed"

DNS might not be resolving. Check:

```bash
cat /etc/resolv.conf
nslookup kubernetes.default
```
