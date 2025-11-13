# Quick Start: GitHub Actions Windows Build

## 🚀 **Immediate Usage**

### **Push to GitHub**
```bash
git add .
git commit -m "Add GitHub Actions workflow for Windows builds"
git push origin main
```

✅ **That's it!** The workflow will automatically start building your Windows .exe

---

## 📋 **Creating a Release**

### **Option 1: Command Line (Recommended)**
```bash
# 1. Bump version
npm version patch    # 1.0.0 → 1.0.1
# or
npm version minor    # 1.0.0 → 1.1.0
# or
npm version major    # 1.0.0 → 2.0.0

# 2. Push with tags
git push origin main --tags
```

### **Option 2: GitHub UI**
1. Go to: `https://github.com/medhatjachour/electron-app/releases/new`
2. Click "Choose a tag" → Type `v1.0.0` (or next version)
3. Click "Create new tag"
4. Title: "Release v1.0.0"
5. Click "Publish release"

✅ **The .exe will be automatically built and attached!**

---

## 📥 **Downloading Built Files**

### **From Actions (After any push to main)**
1. Go to: `https://github.com/medhatjachour/electron-app/actions`
2. Click the latest workflow run
3. Scroll to "Artifacts" section
4. Download: `BizFlow-Windows-Setup-{version}`

### **From Releases (After version tag)**
1. Go to: `https://github.com/medhatjachour/electron-app/releases`
2. Click latest release
3. Download: `BizFlow-{version}-setup.exe`

---

## 🔧 **Manual Trigger**

### **Start Build Without Pushing**
1. Go to: `https://github.com/medhatjachour/electron-app/actions`
2. Click "Build Windows Executable" workflow
3. Click "Run workflow" button (top right)
4. Select branch: `main`
5. Click green "Run workflow" button

---

## 📊 **Check Build Status**

### **View Current Builds**
```bash
# URL format:
https://github.com/medhatjachour/electron-app/actions/workflows/build-windows.yml
```

### **Build Badge (Add to README)**
```markdown
![Windows Build](https://github.com/medhatjachour/electron-app/actions/workflows/build-windows.yml/badge.svg)
```

---

## 🎯 **What Happens During Build?**

1. ⏱️ **~2 min** - Setup environment (Node.js, dependencies)
2. ⏱️ **~1 min** - Generate Prisma client
3. ⏱️ **~30 sec** - Create template database
4. ⏱️ **~2 min** - Build application
5. ⏱️ **~3 min** - Package Windows installer
6. ✅ **Total: ~8-10 minutes**

---

## 🛠️ **Files Created by Workflow**

```
.github/
  └── workflows/
      └── build-windows.yml       ← GitHub Actions workflow
  └── WINDOWS_BUILD_SETUP.md      ← Detailed documentation

electron-builder.yml (updated)     ← Enhanced with production settings
```

---

## 🔐 **Code Signing (Production)**

### **Why Sign?**
- Removes "Unknown Publisher" warning
- Required for Windows Store
- Builds trust with users

### **How to Add** (Optional)
1. Purchase code signing certificate (DigiCert, Sectigo, etc.)
2. Export as .pfx file
3. Add to GitHub secrets:
   ```
   Repository → Settings → Secrets → Actions
   
   WINDOWS_CERTIFICATE: (Base64 of .pfx file)
   WINDOWS_CERTIFICATE_PASSWORD: (Certificate password)
   ```
4. Uncomment certificate lines in `electron-builder.yml`

---

## ✅ **Verification Checklist**

- [x] Workflow file created: `.github/workflows/build-windows.yml`
- [x] `electron-builder.yml` updated with NSIS options
- [x] `build:win` script exists in `package.json`
- [x] `prisma/schema.prisma` committed to repo
- [x] `build/icon.ico` exists for app icon
- [ ] Push to GitHub to trigger first build
- [ ] Verify workflow runs successfully
- [ ] Download and test .exe installer

---

## 🐛 **Troubleshooting**

### **"Workflow not running"**
- Check: Actions enabled in repo settings
- Check: Workflow file in `.github/workflows/`
- Check: Correct YAML syntax (no tabs)

### **"Build failed: Prisma error"**
- Ensure `prisma/schema.prisma` is committed
- Check migrations exist in `prisma/migrations/`

### **"Build failed: Icon missing"**
- Ensure `build/icon.ico` exists (256x256 recommended)
- Use online converter if needed: .png → .ico

### **"Artifact too large"**
- Check `node_modules` isn't included
- Review `files` section in `electron-builder.yml`

---

## 📞 **Support Resources**

- **GitHub Actions**: https://docs.github.com/actions
- **electron-builder**: https://www.electron.build/
- **Workflow Status**: Check Actions tab in your repository

---

## 🎉 **Ready to Use!**

Your Windows build workflow is fully configured. Just push to GitHub and watch the magic happen!

```bash
git push origin main
# Then visit: https://github.com/medhatjachour/electron-app/actions
```

**Estimated first build time**: 8-10 minutes
**Subsequent builds**: 6-8 minutes (with caching)
