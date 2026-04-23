# Mi Clase

A Spanish class tracker for logging class sessions, vocabulary, homework, and quizzes — with built-in translation via LibreTranslate.

**Stack:** Node.js/Express · React/Vite · PostgreSQL · Redis · MinIO · LibreTranslate

---

## Local Development

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Configure environment
cp .env.example .env

# Start backing services and run the app
npm run dev:local
```

App is available at `http://localhost:3000`.

---

## Helm

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

---

## EC Install Testing on CMX

When testing an Embedded Cluster install using [Compatibility Matrix (CMX)](https://docs.replicated.com/vendor/testing-about), use the following port setup:

| Purpose | Target Port | Notes |
|---|---|---|
| EC install wizard | 30080 | Used during install/upgrade only |
| App (Traefik HTTPS) | 30443 | Use this for the app. Paste the auto-generated hostname in the **Hostname** field in the config screen |

Go to `https://<30443-hostname>` to access the app after install. Accept the self-signed certificate warning if TLS mode is set to self-signed.

---

## TLS

Enable the ingress and choose a TLS mode via `--set tls.mode=<mode>`.

### Auto — cert-manager + Let's Encrypt

The chart installs cert-manager and automatically creates a `ClusterIssuer` and provisions a certificate via a post-install job. DNS for the configured host must be pointed at the load balancer IP before the ACME challenge can complete.

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

### Manual — bring your own certificate

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

### Self-signed — cert-manager generated (dev/internal)

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
