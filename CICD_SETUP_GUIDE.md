# CI/CD Pipeline Setup Guide

**Date**: 2025-11-21
**Version**: 1.0

---

## 📋 Overview

This guide walks you through setting up the complete CI/CD pipeline for AI Surgeon Pilot DDO using GitHub Actions and Vercel.

**Workflows Created**:
- ✅ `.github/workflows/ci.yml` - Continuous Integration
- ✅ `.github/workflows/deploy-dev.yml` - Development Deployment
- ✅ `.github/workflows/deploy-prod.yml` - Production Deployment

---

## 🔐 Required GitHub Secrets

### Step 1: Set Up GitHub Secrets

Go to your GitHub repository:
```
https://github.com/YOUR_USERNAME/aisurgeonpilot.com/settings/secrets/actions
```

Click **"New repository secret"** and add the following:

### Vercel Secrets (Required for All Environments)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Run: `vercel whoami` or check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Your project ID | Check `.vercel/project.json` after running `vercel` |

**Get Vercel IDs**:
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
cd /path/to/AisurgeonPilotDDO
vercel link

# Find your IDs
cat .vercel/project.json
```

### Development Environment Secrets

| Secret Name | Value | Source |
|-------------|-------|--------|
| `DEV_SUPABASE_URL` | Your dev Supabase URL | Supabase Dashboard → Settings → API |
| `DEV_SUPABASE_ANON_KEY` | Your dev anon key | Supabase Dashboard → Settings → API |
| `DEV_RESEND_API_KEY` | Resend API key | [resend.com/api-keys](https://resend.com/api-keys) |
| `DEV_FROM_EMAIL` | onboarding@resend.dev | Or your verified domain |
| `DEV_DOUBLETICK_API_KEY` | Your DoubleTick key | [DoubleTick Dashboard](https://doubletick.io) |
| `DEV_DOUBLETICK_PHONE_NUMBER` | +919876543210 | Your WhatsApp number |

### Production Environment Secrets

| Secret Name | Value | Source |
|-------------|-------|--------|
| `PROD_SUPABASE_URL` | Your prod Supabase URL | Separate production project |
| `PROD_SUPABASE_ANON_KEY` | Your prod anon key | Production Supabase project |
| `PROD_RESEND_API_KEY` | Production Resend key | Resend dashboard (separate key) |
| `PROD_FROM_EMAIL` | noreply@yourdomain.com | Your verified domain |
| `PROD_DOUBLETICK_API_KEY` | Production DoubleTick key | Production account |
| `PROD_DOUBLETICK_PHONE_NUMBER` | Production WhatsApp number | Your verified business number |
| `PROD_OPENAI_API_KEY` | OpenAI API key (optional) | [platform.openai.com](https://platform.openai.com) |
| `PROD_DAILY_API_KEY` | Daily.co API key (optional) | [dashboard.daily.co](https://dashboard.daily.co) |
| `PROD_DOMAIN` | yourdomain.com | Your custom domain |

### Database Secrets (for migrations)

| Secret Name | Value | Source |
|-------------|-------|--------|
| `SUPABASE_ACCESS_TOKEN` | Supabase access token | [app.supabase.com/account/tokens](https://app.supabase.com/account/tokens) |
| `SUPABASE_DB_PASSWORD` | Database password | Supabase Dashboard → Database → Settings |

---

## 🚀 Vercel Setup

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Link Your Project

```bash
cd /Users/apple/Desktop/Hope_projects/AisurgeonPilotDDO
vercel link
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Select your account/org
- **Link to existing project?** No (or Yes if already created)
- **Project name:** aisurgeonpilot-ddo

### Step 3: Configure Vercel Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the same environment variables as GitHub secrets

**Development Environment**:
```
VITE_SUPABASE_URL=https://qfneoowktsirwpzehgxp.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
VITE_RESEND_API_KEY=your_resend_key
... (all other vars)
```

**Production Environment**:
```
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
... (all other vars)
```

### Step 4: Configure Build Settings

In Vercel Dashboard → Project Settings → Build & Development Settings:

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |
| Node Version | 18.x |

---

## 🔄 Workflow Triggers

### CI Workflow (`ci.yml`)
**Triggers**:
- Every Pull Request to `main` or `develop`
- Every Push to `main` or `develop`

**Jobs**:
1. Lint and TypeCheck ✅
2. Build Check ✅
3. Security Audit ✅
4. PR Status Check ✅

### Development Deployment (`deploy-dev.yml`)
**Triggers**:
- Every Push to `main` branch
- Manual trigger via GitHub Actions UI

**Process**:
1. Run linting and type check
2. Build with dev environment variables
3. Deploy to Vercel
4. Run smoke tests
5. Comment deployment URL on PR

### Production Deployment (`deploy-prod.yml`)
**Triggers**:
- New GitHub Release (published)
- Manual trigger with approval

**Process**:
1. Pre-deployment validation
2. Security audit
3. **Manual approval required** (GitHub Environment)
4. Deploy to production
5. Run database migrations (manual step)
6. Post-deployment verification
7. Rollback on failure

---

## 🛡️ Environment Protection

### Set Up GitHub Environments

1. Go to: `https://github.com/YOUR_USERNAME/aisurgeonpilot.com/settings/environments`

2. Create **"production"** environment:
   - Click **"New environment"**
   - Name: `production`
   - **Required reviewers**: Add yourself or team members
   - **Wait timer**: 5 minutes (optional)
   - **Deployment branches**: Only `main` branch

3. Create **"development"** environment:
   - Name: `development`
   - **Required reviewers**: None (auto-deploy)
   - **Deployment branches**: `main` and `develop`

4. Create **"production-database"** environment:
   - Name: `production-database`
   - **Required reviewers**: Add database admins
   - **Wait timer**: 0 minutes

---

## 📝 Usage Guide

### For Development

**Automatic Deployment**:
```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# GitHub Actions will automatically:
# 1. Run CI checks
# 2. Deploy to development
# 3. Comment deployment URL
```

**Manual Deployment**:
1. Go to Actions tab
2. Select "Deploy to Development"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

### For Production

**Via GitHub Release** (Recommended):
```bash
# Create a new release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Or via GitHub UI:
# 1. Go to Releases
# 2. Click "Draft a new release"
# 3. Create tag: v1.0.0
# 4. Write release notes
# 5. Click "Publish release"

# This triggers production deployment with approval required
```

**Manual Deployment**:
1. Go to Actions tab
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Approve deployment when prompted
5. Wait for deployment to complete

---

## 🧪 Testing the Pipeline

### Test CI Workflow

1. Create a new branch:
```bash
git checkout -b test/ci-pipeline
```

2. Make a small change (add comment to a file)

3. Push and create PR:
```bash
git push origin test/ci-pipeline
```

4. Go to GitHub → Pull Requests → See CI checks running

5. Expected results:
   - ✅ Lint and TypeCheck
   - ✅ Build Check
   - ✅ Security Audit
   - ✅ PR Status Check

### Test Development Deployment

1. Merge PR to `main`:
```bash
git checkout main
git merge test/ci-pipeline
git push origin main
```

2. Go to GitHub Actions → See deployment running

3. Check Vercel dashboard for new deployment

4. Expected results:
   - ✅ Deployment succeeds
   - ✅ URL commented on commit
   - ✅ Site accessible

### Test Production Deployment

1. Create a release:
```bash
git tag -a v0.1.0 -m "Test release"
git push origin v0.1.0
```

2. Go to GitHub Releases → Publish release

3. Go to Actions → See production deployment waiting for approval

4. Approve deployment

5. Expected results:
   - ✅ Pre-deployment checks pass
   - ✅ Deployment succeeds after approval
   - ✅ Health check passes
   - ✅ Production site updated

---

## 🚨 Troubleshooting

### Issue: CI Fails with "npm ci" Error

**Solution**:
```bash
# Ensure package-lock.json is up to date
rm package-lock.json
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
git push
```

### Issue: Vercel Deployment Fails

**Check**:
1. Verify VERCEL_TOKEN is valid
2. Check build logs in GitHub Actions
3. Ensure environment variables are set in Vercel
4. Check Vercel dashboard for errors

**Solution**:
```bash
# Test build locally
npm run build

# If build succeeds locally, check Vercel settings
vercel env ls
```

### Issue: Production Deployment Not Triggering

**Check**:
1. Release must be "published" not "draft"
2. Tag must be pushed to GitHub
3. Check Actions tab for workflow runs

**Solution**:
```bash
# Manually trigger workflow
# Go to Actions → Deploy to Production → Run workflow
```

### Issue: Database Migration Fails

**Check**:
1. SUPABASE_ACCESS_TOKEN is valid
2. Database is accessible
3. Migration SQL syntax is correct

**Solution**:
```bash
# Run migrations manually via Supabase Dashboard
# SQL Editor → Paste migration → Run
```

---

## 📊 Monitoring

### GitHub Actions Status

Monitor builds at:
```
https://github.com/YOUR_USERNAME/aisurgeonpilot.com/actions
```

### Vercel Deployments

Monitor deployments at:
```
https://vercel.com/YOUR_USERNAME/aisurgeonpilot-ddo/deployments
```

### Set Up Status Badges

Add to README.md:
```markdown
![CI](https://github.com/YOUR_USERNAME/aisurgeonpilot.com/workflows/Continuous%20Integration/badge.svg)
![Deploy Dev](https://github.com/YOUR_USERNAME/aisurgeonpilot.com/workflows/Deploy%20to%20Development/badge.svg)
```

---

## ✅ Checklist

Before going live with CI/CD:

- [ ] All GitHub secrets configured
- [ ] Vercel project linked
- [ ] Environment variables set in Vercel
- [ ] GitHub environments created
- [ ] Production environment has required reviewers
- [ ] CI workflow tested with PR
- [ ] Development deployment tested
- [ ] Production deployment tested with test release
- [ ] Rollback procedure tested
- [ ] Team notified of new deployment process
- [ ] Documentation updated

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments/overview)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)

---

## 🎯 Next Steps

After CI/CD is set up:

1. Set up automated testing (Vitest + Playwright)
2. Add code coverage reporting (Codecov)
3. Set up Slack/Discord notifications
4. Implement automated database backups before migrations
5. Set up monitoring and alerts (Sentry, LogRocket)

---

**Last Updated**: 2025-11-21
**Maintained By**: Development Team
**Questions?** Open an issue on GitHub

