#!/bin/bash

# JTTB Docker Build & Push Script
# Usage: ./build.sh <version>
# Example: ./build.sh 1.2

set -e

VERSION=$1
IMAGE="edering/jttb"

if [ -z "$VERSION" ]; then
    echo "Error: Version required"
    echo "Usage: ./build.sh <version>"
    echo "Example: ./build.sh 1.2"
    exit 1
fi

echo "========================================"
echo "  JTTB Build & Push - v${VERSION}"
echo "========================================"

# Build Docker image (multi-stage: builds frontend inside)
echo ""
echo "[1/3] Building Docker image..."
docker build -t ${IMAGE}:${VERSION} -t ${IMAGE}:latest .

# Push version tag
echo ""
echo "[2/3] Pushing ${IMAGE}:${VERSION}..."
docker push ${IMAGE}:${VERSION}

# Push latest tag
echo ""
echo "[3/3] Pushing ${IMAGE}:latest..."
docker push ${IMAGE}:latest

echo ""
echo "========================================"
echo "  Done! Published:"
echo "  - ${IMAGE}:${VERSION}"
echo "  - ${IMAGE}:latest"
echo "========================================"
echo ""
echo "Remember to update Docker Hub description!"
