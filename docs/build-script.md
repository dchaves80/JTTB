# Build Script

Automate Docker image builds and pushes to Docker Hub.

---

## Usage

```bash
./build.sh <version>
```

## Example

```bash
./build.sh 1.2
```

---

## What it does

The script executes these steps in order:

| Step | Action |
|------|--------|
| 1 | Build Docker image (multi-stage: frontend builds inside) |
| 2 | Push version tag to Docker Hub |
| 3 | Push `latest` tag to Docker Hub |

The Dockerfile uses multi-stage build, so the Angular frontend is compiled inside Docker - no local Node.js required.

---

## Output

```
========================================
  JTTB Build & Push - v1.2
========================================

[1/3] Building Docker image...
[2/3] Pushing edering/jttb:1.2...
[3/3] Pushing edering/jttb:latest...

========================================
  Done! Published:
  - edering/jttb:1.2
  - edering/jttb:latest
========================================

Remember to update Docker Hub description!
```

---

## Requirements

- Docker installed and running
- Logged in to Docker Hub (`docker login`)

---

## After running

Remember to manually update the Docker Hub description at:
https://hub.docker.com/r/edering/jttb

Copy the contents of `dockerhub-readme.md` to the repository description.
