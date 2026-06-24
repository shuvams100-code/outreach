@echo off
SETLOCAL EnableDelayedExpansion
title Outreach - Git Sync Tool

REM Always operate from the folder this script lives in
cd /d "%~dp0"

echo ===================================================
echo   Outreach Git Auto-Sync Tool
echo ===================================================
echo.

:: 1. Make sure this is actually a git repo
git rev-parse --is-inside-work-tree >nul 2>&1
if !ERRORLEVEL! neq 0 (
    echo [ERROR] This folder is not a Git repository.
    echo.
    goto end
)

:: 2. Check and configure Git identity if missing
git config user.name >nul 2>&1
set "NO_NAME=!ERRORLEVEL!"
git config user.email >nul 2>&1
set "NO_EMAIL=!ERRORLEVEL!"

if !NO_NAME! neq 0 (
    echo [WARNING] Git user.name is not configured.
    set /p "GIT_NAME=Enter your name for Git commits (e.g., John Doe): "
    if not "!GIT_NAME!"=="" (
        git config --local user.name "!GIT_NAME!"
        echo [SUCCESS] Locally configured user.name to "!GIT_NAME!".
    ) else (
        echo [ERROR] user.name cannot be empty.
        goto end
    )
    echo.
)

if !NO_EMAIL! neq 0 (
    echo [WARNING] Git user.email is not configured.
    set /p "GIT_EMAIL=Enter your email for Git commits (e.g., john@example.com): "
    if not "!GIT_EMAIL!"=="" (
        git config --local user.email "!GIT_EMAIL!"
        echo [SUCCESS] Locally configured user.email to "!GIT_EMAIL!".
    ) else (
        echo [ERROR] user.email cannot be empty.
        goto end
    )
    echo.
)

:: 3. Get current branch name
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
if "%CURRENT_BRANCH%"=="" (
    echo [ERROR] Could not detect the current Git branch.
    goto end
)

echo [INFO] Current Branch: %CURRENT_BRANCH%
echo.

:: 4. [STEP 1] Pull latest changes from remote
echo [INFO] Pulling latest changes from origin/%CURRENT_BRANCH%...
git pull origin %CURRENT_BRANCH%
if !ERRORLEVEL! neq 0 (
    echo.
    echo [ERROR] Pull failed.
    echo If you have local changes that conflict with remote changes,
    echo please commit or stash them first, then run this sync again.
    goto end
)
echo [SUCCESS] Pulled latest changes successfully.
echo.

:: 5. [STEP 2] Merge/Commit local changes
echo [INFO] Checking for local changes...
git status --porcelain | findstr /R "^" >nul
if !ERRORLEVEL! equ 0 (
    echo [INFO] Local changes detected. Staging changes...
    git add -A
    
    echo.
    set "msg="
    set /p "msg=Enter commit message (press Enter for auto-timestamp): "
    if "!msg!"=="" set "msg=Auto-sync: %DATE% %TIME%"
    
    git commit -m "!msg!"
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to commit local changes.
        goto end
    )
    echo [SUCCESS] Local changes committed successfully.
) else (
    echo [INFO] No local changes to commit.
)
echo.

:: 6. [STEP 3] Push changes to remote
echo [INFO] Pushing changes to origin/%CURRENT_BRANCH%...
git push origin %CURRENT_BRANCH%
if !ERRORLEVEL! neq 0 (
    echo.
    echo [ERROR] Push failed. See output above.
    goto end
)
echo [SUCCESS] Pushed all changes successfully.
echo.
echo ===================================================
echo   Sync Complete! Your repository is up to date.
echo ===================================================

:end
echo.
echo Press any key to exit...
pause >nul
endlocal
