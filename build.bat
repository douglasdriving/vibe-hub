@echo off
echo ========================================
echo Building Vibe Hub
echo ========================================
echo.

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: npm install failed
    exit /b %errorlevel%
)

echo.
echo [2/3] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Frontend build failed
    exit /b %errorlevel%
)

echo.
echo [3/3] Building Tauri app...
call npm run tauri build
if %errorlevel% neq 0 (
    echo Error: Tauri build failed
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Build complete!
echo ========================================
echo.
echo The installer can be found at:
echo src-tauri\target\release\bundle\msi\
echo.
pause
