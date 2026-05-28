# Mi Clase

A Spanish class tracker for logging class sessions, notes, vocabulary, homework, and quizzes.

**Stack:** Node.js/Express · React/Vite · PostgreSQL · Redis · MinIO · LibreTranslate

---

## Quickstart

1. Install Docker Desktop.
  
1. Configure the environment:
   ```
   cp .env.example .env
   ```
1. From the repo root, run:
   ```
   npm install
   npm run build:client
   npm run dev:local
   ```
1. In a browser, open `http://localhost:3000`.

## Local development

Use this flow for a hot reload of the frontend, rather than having to rebuild it to see your local changes.

1. From the repo root, run:
   ```
   npm run dev:local
   ```
1. In another terminal window, run:
   ```
   cd client
   npm install
   npm run dev
   ```

---

## Install with Helm

### Prerequisites

- Helm 3
- A Kubernetes cluster
- Chart dependencies: `helm dependency update helm/`

### Install with embedded dependencies (default)

The chart must be installed into the `mi-clase` namespace. The support bundle collectors, health checks, and service discovery all target this namespace by name.

The default install includes:

- mi-clase app (Node.js server + React frontend)
- PostgreSQL (bitnami subchart, `postgresql.enabled: true`)
- Redis (bitnami subchart, `redis.enabled: true`)
- MinIO (minio subchart, `minio.enabled: true`)
- LibreTranslate (`libretranslate.enabled: true`)
- Replicated SDK (always included)

```bash
helm install mi-clase helm/ -n mi-clase --create-namespace
```

### Install with Traefik ingress controller

When `ingressController.enabled=true` the chart deploys Traefik and registers an IngressClass named `<release-name>-traefik`.

```bash
helm install mi-clase helm/ -n mi-clase --create-namespace \
  --set ingressController.enabled=true \
  --set ingress.enabled=true \
  --set ingress.className=mi-clase-traefik
```

### Install with external PostgreSQL

```bash
helm install mi-clase helm/ -n mi-clase --create-namespace \
  --set postgresql.enabled=false \
  --set externalPostgresql.host=<host> \
  --set externalPostgresql.port=5432 \
  --set externalPostgresql.database=mi_clase \
  --set externalPostgresql.username=mi_clase \
  --set externalPostgresql.password=<password>
```

### Install with external Redis

```bash
helm install mi-clase helm/ -n mi-clase --create-namespace \
  --set redis.enabled=false \
  --set externalRedis.host=<host> \
  --set externalRedis.port=6379 \
  --set externalRedis.password=<password>
```

### Upgrade

```bash
helm upgrade mi-clase helm/ -n mi-clase
```

### Lint / dry-run

```bash
helm lint helm/
helm template mi-clase helm/ --debug
```

## TLS options

You can enable ingress and choose a TLS mode with `--set tls.mode=<mode>`.

### Auto (cert-manager + Let's Encrypt)

The chart installs cert-manager and automatically creates a `ClusterIssuer` and provisions a certificate with a post-install job. DNS for the configured host must be pointed at the load balancer IP before the ACME challenge can complete.

```bash
helm install mi-clase helm/ -n mi-clase --create-namespace \
  --set ingressController.enabled=true \
  --set certManager.install=true \
  --set "cert-manager.crds.enabled=true" \
  --set ingress.enabled=true \
  --set ingress.className=mi-clase-traefik \
  --set tls.mode=auto \
  --set tls.certManager.email=you@example.com
```

Watch the certificate being provisioned:

```bash
kubectl get certificate -n mi-clase -w
```

### Bring your own certificate

Create the TLS secret first, then install:

```bash
kubectl create secret tls mi-clase-tls \
  --cert=tls.crt \
  --key=tls.key \
  -n mi-clase

helm install mi-clase helm/ -n mi-clase --create-namespace \
  --set ingressController.enabled=true \
  --set ingress.enabled=true \
  --set ingress.className=mi-clase-traefik \
  --set tls.mode=manual \
  --set tls.secretName=mi-clase-tls
```

### Self-signed

The chart creates a self-signed `Issuer` and `Certificate` automatically. Requires cert-manager to be installed.

```bash
helm install mi-clase helm/ -n mi-clase --create-namespace \
  --set ingressController.enabled=true \
  --set certManager.install=true \
  --set "cert-manager.crds.enabled=true" \
  --set ingress.enabled=true \
  --set ingress.className=mi-clase-traefik \
  --set tls.mode=selfsigned
```
