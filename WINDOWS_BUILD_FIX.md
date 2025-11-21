# Windows Build Fix - Prisma Cross-Compilation

## Problem
White screen on Windows .exe build caused by missing Windows-specific Prisma query engine binaries when building via GitHub Actions or cross-compiling from Linux.

## Root Cause
Prisma generates platform-specific native binaries (`.node` files). Without the `binaryTargets` configuration, Prisma only generates binaries for the current platform, causing the Windows build to fail silently when it can't find `query_engine-windows.dll.node`.

## Solution Applied

### 1. Updated Prisma Schema
Added `binaryTargets` to generate engines for all platforms:
```prisma
generator client {
  provider      = "prisma-client-js"
  output        = "../src/generated/prisma"
  binaryTargets = ["native", "debian-openssl-3.0.x", "windows", "darwin-arm64", "darwin"]
}
```

**What this does:**
- `native` - Current platform (Linux, Windows, or macOS)
- `debian-openssl-3.0.x` - Linux builds
- `windows` - Windows builds (generates `query_engine-windows.dll.node`)
- `darwin-arm64` - macOS Apple Silicon
- `darwin` - macOS Intel

### 2. Updated GitHub Actions Workflow
Added verification step in `.github/workflows/build-windows.yml` to ensure Windows binary is generated:
```yaml
- name: Verify Prisma binaries
  run: |
    Write-Host "Checking generated Prisma binaries..."
    Get-ChildItem -Path "src/generated/prisma" -Filter "*.node" -Recurse
    if (!(Test-Path "src/generated/prisma/query_engine-windows.dll.node")) {
      Write-Error "Windows Prisma binary not found!"
      exit 1
    }
    Write-Host "✓ Windows Prisma binary verified"
  shell: pwsh
```

### 3. Verified electron-builder.yml
Confirmed `asarUnpack` includes Prisma files (already correct):
- `src/generated/**` - Generated Prisma client and binaries
- `node_modules/@prisma/**` - Prisma core packages
- `node_modules/.prisma/**` - Prisma runtime

## How the Fix Works in GitHub Actions

### Build Flow:
1. **GitHub Actions runs on `windows-latest`** runner
2. **`npm ci`** installs dependencies
3. **`npx prisma generate`** reads `schema.prisma` with `binaryTargets`
4. **Prisma downloads all platform binaries** including Windows
5. **Verification step** ensures `query_engine-windows.dll.node` exists
6. **`npm run build`** compiles the application
7. **`electron-builder`** packages the app with `asarUnpack` preserving native modules

### Why This Works:
- ✅ GitHub Actions builds **ON** Windows (not cross-compiling)
- ✅ `binaryTargets` ensures Windows binary is always generated
- ✅ `asarUnpack` keeps native binaries uncompressed and accessible
- ✅ Verification step catches missing binaries before packaging

## Verification Steps

### Local Development (Linux):
1. Check generated binaries exist:
```bash
ls src/generated/prisma/*.node
```

Expected output should include:
- `libquery_engine-debian-openssl-3.0.x.so.node` (Linux)
- `query_engine-windows.dll.node` (Windows) ✨
- `libquery_engine-darwin.dylib.node` (macOS Intel)
- `libquery_engine-darwin-arm64.dylib.node` (macOS ARM)

2. Build for Windows locally (optional):
```bash
npm run build:win
```

3. Check the unpacked build contains Prisma binaries:
```bash
ls dist/win-unpacked/resources/app.asar.unpacked/src/generated/prisma/
```

### GitHub Actions:
1. Push changes to trigger the workflow
2. Monitor the "Verify Prisma binaries" step in Actions logs
3. Download the artifact and test on Windows
4. Check for these indicators of success:
   - ✅ No white screen on startup
   - ✅ Database operations work
   - ✅ No "Cannot find module" errors in console

## Important Notes

### Critical Points:
- ✅ **GitHub Actions builds ON Windows** - Not cross-compiling, so `windows` target is actually `native`
- ✅ **`binaryTargets` is still required** - Ensures consistency across environments
- ✅ **Always run `npx prisma generate`** after changing `schema.prisma`
- ✅ **`asarUnpack` is essential** - Native modules can't be compressed in ASAR
- ✅ **Commit the schema changes** - GitHub Actions needs the updated `binaryTargets`

### Common Mistakes to Avoid:
- ❌ **DON'T** remove `binaryTargets` thinking Windows runner doesn't need it
- ❌ **DON'T** add Prisma binaries to `.gitignore` - They're regenerated but config must exist
- ❌ **DON'T** forget to commit `schema.prisma` changes before pushing
- ❌ **DON'T** skip the verification step in GitHub Actions

## Testing the Fix

### After Pushing to GitHub:
1. Go to **Actions** tab in your repository
2. Find the latest **"Build Windows Executable"** workflow run
3. Check the **"Verify Prisma binaries"** step shows:
   ```
   Found: query_engine-windows.dll.node - XX.XX MB
   ✓ Windows Prisma binary verified
   ```
4. Download the artifact from the workflow
5. Test on Windows machine:
   - Install the `.exe`
   - Launch the application
   - Verify no white screen
   - Test database operations (create product, view sales, etc.)
   - Check DevTools Console (Ctrl+Shift+I) for errors

### Debugging if Still White Screen:
1. Enable DevTools in production build (temporarily)
2. Check Console for specific Prisma errors
3. Verify binary exists in installed app:
   ```
   C:\Users\<User>\AppData\Local\Programs\BizFlow\resources\app.asar.unpacked\src\generated\prisma\
   ```
4. Check GitHub Actions logs for the verification step

## Next Steps

### Immediate:
1. ✅ Commit and push the changes:
```bash
git add prisma/schema.prisma .github/workflows/build-windows.yml
git commit -m "Fix Windows build: Add Prisma binaryTargets for all platforms"
git push
```

2. ✅ Monitor the GitHub Actions build

3. ✅ Download and test the Windows artifact

### Future Improvements:
- Add automated testing in GitHub Actions (if Windows test runner available)
- Consider code signing for production releases
- Add similar verification for macOS and Linux builds
- Set up auto-update server for seamless deployment

## Related Files
- `prisma/schema.prisma` - Generator configuration with `binaryTargets`
- `.github/workflows/build-windows.yml` - GitHub Actions workflow
- `electron-builder.yml` - Build configuration with `asarUnpack`
- `package.json` - Build scripts

## Additional Resources
- [Prisma Binary Targets Documentation](https://www.prisma.io/docs/concepts/components/prisma-engines/query-engine#binary-targets)
- [Electron Builder Configuration](https://www.electron.build/configuration/configuration)
- [GitHub Actions Windows Runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources)
