# Mi Clase

An app for logging Spanish classes, including notes, vocabulary, homework, and quizzes.

Node.js/Express · React/Vite · PostgreSQL · MinIO · LibreTranslate

---

## Quickstart

1. Install Docker Desktop. See https://www.docker.com/products/docker-desktop/.

1. On macOS, start Docker Desktop by opening the Docker app from Applications, or run:
   ```bash
   open -a Docker
   ```
  
1. Configure the environment:
   ```bash
   cp .env.example .env
   ```
   Set the Supabase values in `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
1. From the repo root, run:
   ```bash
   npm install
   npm run build:client
   npm run dev:local
   ```

1. In a browser, open `http://localhost:3000`.

## Local development

Use these steps for local development workflows when you want a hot reload of the frontend. This lets you see your changes on localhost immediately, without having to rebuild the client.

1. From the repo root, run the following to start Docker services and the Express backend:
   ```
   npm install
   npm run dev:local
   ```
1. In another terminal window, run the following to start a second development server for the frontend:
   ```
   cd client && npm run dev
   ```

## Supabase Schema

Run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor to create the app tables and Row Level Security policies.

## Supabase Edge Functions

The vocabulary translator calls the `translate` Edge Function in [supabase/functions/translate/index.ts](supabase/functions/translate/index.ts).

Set these Edge Function secrets in Supabase:

```bash
AZURE_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com
AZURE_TRANSLATOR_REGION=centralus
AZURE_TRANSLATOR_KEY=your-azure-translator-key
```

---

## Install with Helm

### Prerequisites

- Helm 3
- A Kubernetes cluster
- Chart dependencies: `helm dependency update helm/`

### Install with embedded dependencies (default)

The chart can be installed into any namespace. The examples below use `mi-clase`.

The default install includes:

- mi-clase app (Node.js server + React frontend)
- PostgreSQL (bitnami subchart, `postgresql.enabled: true`)
- MinIO (minio subchart, `minio.enabled: true`)
- LibreTranslate (`libretranslate.enabled: true`)

```bash
helm install mi-clase helm/ -n mi-clase --create-namespace
```

### Install options

#### Install with Traefik ingress controller

When `ingressController.enabled=true` the chart deploys Traefik and registers an IngressClass named `<release-name>-traefik`.

```bash
helm install mi-clase helm/ -n mi-clase --create-namespace \
  --set ingressController.enabled=true \
  --set ingress.enabled=true \
  --set ingress.className=mi-clase-traefik
```

#### Install with external PostgreSQL

```bash
helm install mi-clase helm/ -n mi-clase --create-namespace \
  --set postgresql.enabled=false \
  --set externalPostgresql.host=<host> \
  --set externalPostgresql.port=5432 \
  --set externalPostgresql.database=mi_clase \
  --set externalPostgresql.username=mi_clase \
  --set externalPostgresql.password=<password>
```

#### TLS options

You can enable ingress and choose a TLS mode with `--set tls.mode=<mode>`.

##### Install with Auto TLS (cert-manager + Let's Encrypt)

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

##### Bring your own certificate

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

##### Self-signed

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
