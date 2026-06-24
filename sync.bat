@echo off
setlocal
title Outreach - Git Sync

REM Always operate from the folder this script lives in
cd /d "%~dp0"

echo ============================================
echo   Outreach repo sync
echo   %cd%
echo ============================================
echo.

REM Make sure this is actually a git repo
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo [ERROR] This folder is not a git repository.
    echo.
    pause
    exit /b 1
)

REM 1) Pull remote changes first so we never push on top of stale history
echo [1/4] Pulling latest from origin/main ...
git pull --rebase origin main
if errorlevel 1 (
    echo.
    echo [ERROR] Pull failed - resolve conflicts above, then run again.
    echo.
    pause
    exit /b 1
)
echo.

REM 2) Stage everything
echo [2/4] Staging changes ...
git add -A

REM If nothing changed, stop cleanly
git diff --cached --quiet
if not errorlevel 1 (
    echo No local changes to commit. Already in sync.
    echo.
    pause
    exit /b 0
)

REM 3) Commit - ask for a message, fall back to a timestamp
echo.
set "msg="
set /p "msg=[3/4] Commit message (press Enter for timestamp): "
if "%msg%"=="" set "msg=sync: %date% %time%"
git commit -m "%msg%"
if errorlevel 1 (
    echo.
    echo [ERROR] Commit failed. See output above.
    echo.
    pause
    exit /b 1
)
echo.

REM 4) Push
echo [4/4] Pushing to origin/main ...
git push origin main
if errorlevel 1 (
    echo.
    echo [ERROR] Push failed. See output above.
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Done. Everything is pushed.
echo ============================================
echo.
pause
endlocal
