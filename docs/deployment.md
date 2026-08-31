# Deployment Guide

OptionFlow Sentinel is designed to be cloud-native and easily containerized.

### Dockerizing the Stack
The system includes a `docker-compose.yml` file and a `Dockerfile` for the backend.

To spin up the entire isolated stack (MongoDB, Redis, Celery, and FastAPI):
```bash
docker-compose up --build -d
```

### Production Considerations
1.  **VPC Isolation:** Ensure MongoDB and Redis are not exposed to the public internet. The FastAPI container should be the only bridge.
2.  **Key Management Service (KMS):** In production, the `ENCRYPTION_KEY` used for Fernet cryptography should be rotated and managed by a secure KMS (like AWS KMS or HashiCorp Vault).
3.  **Frontend CDN:** Build the React app (`npm run build`) and host the static `/dist` files on a global CDN (Vercel, AWS CloudFront, or Cloudflare Pages) for optimal latency.
