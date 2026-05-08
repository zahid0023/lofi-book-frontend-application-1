# Vercel Deployment

## Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli) installed globally
- A Vercel account

```bash
pnpm add -g vercel
```

## Environment Variables

| Variable              | Description                        | Example                          |
|-----------------------|------------------------------------|----------------------------------|
| `NEXT_PUBLIC_API_URL` | Base URL for the backend API       | `https://api.example.com/api/v1` |

This variable is exposed to the browser (via the `NEXT_PUBLIC_` prefix). If not set, the app falls back to `http://localhost:8080/api/v1`.

## First-Time Setup

### 1. Login

```bash
vercel login
```

### 2. Add the environment variable

```bash
vercel env add NEXT_PUBLIC_API_URL
```

Select the environments to apply it to (Production, Preview, Development) and enter the value when prompted.

### 3. Link the project (first deploy only)

```bash
vercel
```

Follow the prompts to link to your Vercel account and project.

## Deploying

### Production

```bash
vercel --prod
```

### Preview (staging)

```bash
vercel
```

Each preview deploy gets a unique URL suitable for testing before promoting to production.

## Configuration

The `vercel.json` at the project root defines the deployment settings:

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "devCommand": "pnpm run dev",
  "env": {
    "NEXT_PUBLIC_API_URL": "@next_public_api_url"
  }
}
```

The `@next_public_api_url` value references a Vercel secret. Secrets are managed via `vercel env` and are never stored in the repository.

## CI/CD (GitHub Integration)

Vercel can auto-deploy on every push via the [Vercel GitHub integration](https://vercel.com/docs/deployments/git/vercel-for-github):

- **Push to `main`** → production deployment
- **Push to any other branch** → preview deployment

To enable, import the repository from the Vercel dashboard and connect it to your GitHub account.

## Troubleshooting

| Problem | Solution |
|---|---|
| `The specified token is not valid` | Run `vercel login` |
| Build fails with missing env var | Run `vercel env add NEXT_PUBLIC_API_URL` |
| `vercel` command not found | Run `pnpm add -g vercel` |
