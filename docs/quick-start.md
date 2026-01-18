# Quick Start

Get JTTB running in your Kubernetes cluster in minutes.

---

## Option 1: Using Pre-built Image

### 1. Create the namespace

```bash
kubectl create namespace toolbox
```

### 2. Deploy JTTB

```bash
kubectl apply -f deployment.yaml -n toolbox
```

### 3. Expose the service

```bash
kubectl expose deployment toolbox --type=NodePort --port=80 -n toolbox
```

### 4. Get the access URL

```bash
kubectl get svc toolbox -n toolbox
```

Access JTTB at `http://<node-ip>:<node-port>`

---

## Option 2: Build Your Own Image

### 1. Clone the repository

```bash
git clone https://github.com/dchaves80/JTTB.git
cd JTTB
```

### 2. Build the Docker image

```bash
docker build -t jttb:1.0 .
```

### 3. Push to your registry

```bash
docker tag jttb:1.0 your-registry.com/jttb:1.0
docker push your-registry.com/jttb:1.0
```

### 4. Update deployment.yaml

Edit `deployment.yaml` and change the image reference:

```yaml
image: your-registry.com/jttb:1.0
```

### 5. Deploy

```bash
kubectl apply -f deployment.yaml -n toolbox
```

---

## Default Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> **Warning:** Change these credentials before deploying to production. See [Configuration](configuration.md).

---

## Verify Installation

Once deployed, you should see:

1. Login page at `http://<your-url>`
2. After login, the terminal interface
3. Type `help` to see available commands

---

## Next Steps

- [Configure environment variables](configuration.md)
- [Learn terminal commands](usage-guide.md)
- [Understand the architecture](architecture.md)
