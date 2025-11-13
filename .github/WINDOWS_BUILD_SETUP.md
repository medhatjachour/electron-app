# GitHub Actions - Windows Build Setup

## Overview
This GitHub Actions workflow automatically builds your BizFlow Electron application as a Windows .exe installer whenever you push to the main branch or create a release tag.

## Workflow Features

### 🚀 **Automatic Triggers**
- **Push to main**: Builds on every commit to main branch
- **Pull Requests**: Builds on PRs targeting main
- **Release Tags**: Builds on version tags (e.g., `v1.0.0`)
- **Manual Dispatch**: Trigger builds manually from GitHub Actions UI

### 📦 **What Gets Built**
- Windows installer (`.exe`) - NSIS installer with install/uninstall
- Windows portable (`.zip`) - Optional standalone version
- Build artifacts are uploaded and stored for 30 days
- Automatic releases created when you push version tags

### 🏗️ **Build Process**
1. Checkout your code
2. Setup Node.js 18.x
3. Install dependencies (`npm ci`)
4. Generate Prisma client
5. Create template database
6. Build application
7. Package as Windows installer
8. Upload artifacts to GitHub

## Setup Instructions

### 1. **Enable GitHub Actions**
The workflow is already created in `.github/workflows/build-windows.yml`. GitHub will automatically detect it.

### 2. **Required Repository Settings**
No additional secrets needed! The workflow uses the built-in `GITHUB_TOKEN`.

### 3. **Optional: Code Signing (Recommended for Production)**
To sign your Windows executable, add these repository secrets:

```
Settings → Secrets and variables → Actions → New repository secret
```

Add these secrets:
- `WINDOWS_CERTIFICATE`: Base64 encoded .pfx certificate
- `WINDOWS_CERTIFICATE_PASSWORD`: Certificate password

Then update `electron-builder.yml`:
```yaml
win:
  certificateFile: cert.pfx
  certificatePassword: ${WINDOWS_CERTIFICATE_PASSWORD}
  sign: ./build/sign.js  # Custom signing script
```

### 4. **Creating Releases**

#### Method 1: Using Git Tags (Recommended)
```bash
# Update version in package.json first
npm version patch  # or minor, major

# Push with tags
git push origin main --tags
```

#### Method 2: GitHub Releases UI
1. Go to your repository → Releases → Draft a new release
2. Create a new tag (e.g., `v1.0.1`)
3. Publish release
4. Workflow will automatically attach the built .exe

#### Method 3: Manual Trigger
1. Go to Actions tab
2. Select "Build Windows Executable"
3. Click "Run workflow"
4. Choose branch and optional version

## Workflow Outputs

### **Build Artifacts**
After a successful build, download artifacts from:
- Actions tab → Select workflow run → Artifacts section

Artifacts include:
- `BizFlow-Windows-Setup-{version}.exe` - Main installer
- `BizFlow-Windows-Setup-{version}.exe.blockmap` - For updates
- `BizFlow-Windows-Portable-{version}.zip` - Portable version (if configured)

### **Release Assets**
For tagged releases, the .exe is automatically attached to the GitHub release.

## Build Configuration

### **Current electron-builder.yml Settings**
```yaml
win:
  executableName: BizFlow
  icon: build/icon.ico
  target:
    - target: nsis
      arch:
        - x64
```

### **Multi-Architecture Builds** (Optional)
The workflow includes a commented-out job for building multiple architectures:
- `x64` - 64-bit Windows (default)
- `ia32` - 32-bit Windows
- `arm64` - ARM64 Windows

To enable, uncomment the `build-windows-multi-arch` job in the workflow.

## Troubleshooting

### **Build Fails: "Template database not found"**
The workflow automatically creates `prisma/template.db`. If issues persist:
1. Ensure `prisma/schema.prisma` is committed
2. Check migrations are in `prisma/migrations/`
3. Verify `prisma/seed.ts` runs without errors

### **Build Fails: "Prisma generate error"**
Ensure these files are committed:
- `prisma/schema.prisma`
- `src/generated/prisma/` (should be gitignored, generated during build)

### **Large Artifact Size**
If artifacts are too large (>2GB), update `electron-builder.yml`:
```yaml
asarUnpack:
  - resources/**
  # Remove unnecessary unpack entries
```

### **Slow Builds**
- Builds typically take 5-10 minutes on GitHub runners
- Use `npm ci` instead of `npm install` (already configured)
- Enable npm cache (already configured with `cache: 'npm'`)

## Advanced Configuration

### **Custom Build Matrix**
Edit the workflow to test multiple Node.js versions:
```yaml
strategy:
  matrix:
    node-version: [16.x, 18.x, 20.x]
```

### **Environment Variables**
Add build-time environment variables:
```yaml
- name: Package Windows installer
  run: npm run build:win
  env:
    NODE_ENV: production
    CUSTOM_VAR: value
```

### **Notifications**
Add Slack/Discord notifications on build completion:
```yaml
- name: Notify on success
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Best Practices

1. **Version Bumping**: Use `npm version` to maintain consistency
2. **Changelog**: Keep a CHANGELOG.md for release notes
3. **Testing**: Add a test job before building
4. **Security**: Never commit certificates or passwords
5. **Caching**: The workflow already uses Node.js caching for faster builds

## Monitoring Builds

### **View Build Status**
- Repository homepage → Actions badge
- Pull requests → Checks section
- Actions tab → Workflow runs

### **Build Logs**
Each step in the workflow logs detailed output. Check logs if builds fail.

## Next Steps

1. ✅ Workflow is ready to use
2. Push to main branch to trigger first build
3. Check Actions tab to monitor progress
4. Download artifact or create release to test installer

## Support

For issues with:
- **Workflow**: Check workflow file or GitHub Actions docs
- **electron-builder**: See [electron-builder docs](https://www.electron.build/)
- **Prisma**: See [Prisma docs](https://www.prisma.io/docs)
- **Node.js**: Ensure Node 18.x is specified

---

**Status**: ✅ Workflow configured and ready to use
**Location**: `.github/workflows/build-windows.yml`
**Trigger**: Push to main, tags, or manual dispatch
