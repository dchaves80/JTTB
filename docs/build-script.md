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
| 1 | Build Angular frontend (`npm run build`) |
| 2 | Build Docker image with version tag |
| 3 | Tag image as `latest` |
| 4 | Push version tag to Docker Hub |
| 5 | Push `latest` tag to Docker Hub |

---

## Output

```
========================================
  JTTB Build & Push - v1.2
========================================

[1/4] Building Angular frontend...
[2/4] Building Docker image...
[3/4] Pushing edering/jttb:1.2...
[4/4] Pushing edering/jttb:latest...

========================================
  Done! Published:
  - edering/jttb:1.2
  - edering/jttb:latest
========================================

Remember to update Docker Hub description!
```

---

## Requirements

- Node.js and npm installed
- Docker installed and running
- Logged in to Docker Hub (`docker login`)

---

## After running

Remember to manually update the Docker Hub description at:
https://hub.docker.com/r/edering/jttb

Copy the contents of `dockerhub-readme.md` to the repository description.
