# Configuration

JTTB is configured entirely through environment variables.

---

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JTTB_JWT_SECRET` | Secret key for signing JWT tokens | `my-super-secret-key-123` |
| `JTTB_USER` | Login username | `admin` |
| `JTTB_PASSWORD` | Login password | `securepassword` |

> **Important:** All three variables are required. The container will exit if any is missing.

---

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JTTB_TOKEN_EXPIRY` | JWT token expiration time | `8h` |
| `JTTB_EXEC_TIMEOUT` | Command execution timeout (ms) | `30000` |
| `JTTB_SHELL` | Shell to use: `sh`, `bash`, `cmd`, `powershell`, `auto` | `auto` |
| `JTTB_DEFAULT_CWD` | Initial working directory | User home |

---

## Kubernetes Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: toolbox
  namespace: toolbox
spec:
  replicas: 1
  selector:
    matchLabels:
      app: toolbox
  template:
    metadata:
      labels:
        app: toolbox
    spec:
      containers:
      - name: toolbox
        image: your-registry/jttb:1.0
        ports:
        - containerPort: 80
        env:
        - name: JTTB_JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jttb-secrets
              key: jwt-secret
        - name: JTTB_USER
          valueFrom:
            secretKeyRef:
              name: jttb-secrets
              key: username
        - name: JTTB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: jttb-secrets
              key: password
        - name: JTTB_TOKEN_EXPIRY
          value: "4h"
        - name: JTTB_EXEC_TIMEOUT
          value: "60000"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

---

## Using Kubernetes Secrets

### 1. Create the secret

```bash
kubectl create secret generic jttb-secrets \
  --from-literal=jwt-secret='your-jwt-secret-key' \
  --from-literal=username='admin' \
  --from-literal=password='your-secure-password' \
  -n toolbox
```

### 2. Reference in deployment

See the example above for how to reference secrets in environment variables.

---

## Docker Run Example

```bash
docker run -d \
  -p 8080:80 \
  -e JTTB_JWT_SECRET="my-secret-key" \
  -e JTTB_USER="admin" \
  -e JTTB_PASSWORD="admin123" \
  -e JTTB_TOKEN_EXPIRY="8h" \
  jttb:1.0
```

---

## Security Recommendations

1. **Use strong passwords** - At least 12 characters with mixed case, numbers, and symbols
2. **Use Kubernetes Secrets** - Never hardcode credentials in deployment files
3. **Limit network access** - Use NetworkPolicies to restrict who can access JTTB
4. **Set resource limits** - Prevent resource exhaustion attacks
5. **Use short token expiry** - `4h` or less for production environments
