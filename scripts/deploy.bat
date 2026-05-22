@echo off
echo =======================================
echo  Arcane Defense - Auto Build and Deploy
echo =======================================

:: 1. Run build
echo [1/4] Running build...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    exit /b %errorlevel%
)

:: 2. Initialize temporary git in dist
echo [2/4] Initializing temporary git in dist...
cd dist
if exist .git (
    rd /s /q .git
)
git init
git checkout -b gh-pages
git add -A
git commit -m "deploy: GitHub Pages build"

:: 3. Push to gh-pages branch
echo [3/4] Pushing to gh-pages...
for /f "tokens=*" %%i in ('git -C .. remote get-url origin') do set REMOTE_URL=%%i

if "%REMOTE_URL%"=="" (
    echo [ERROR] Could not find remote origin URL! Please run 'git remote add origin <url>' first.
    cd ..
    exit /b 1
)

git push -f "%REMOTE_URL%" gh-pages

:: 4. Clean up temporary git
echo [4/4] Cleaning up...
cd ..
rd /s /q dist\.git

echo =======================================
echo  Deployment Completed Successfully!
echo =======================================
