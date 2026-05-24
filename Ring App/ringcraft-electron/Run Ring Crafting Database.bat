@echo off
title Ring Crafting Database
cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed.
    echo Please download and install it from: https://nodejs.org
    echo Then double-click this file again.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\electron" (
    echo First run: installing dependencies, please wait...
    call npm install --prefer-offline 2>&1
    echo.
)

if not exist "node_modules\electron\dist\electron.exe" (
    if not exist "node_modules\electron\dist\electron" (
        echo Installing electron...
        call npm install electron --save-dev 2>&1
        echo.
    )
)

echo Starting Ring Crafting Database...
node_modules\.bin\electron.cmd . 2>nul
if %errorlevel% neq 0 (
    node_modules\.bin\electron . 2>nul
    if %errorlevel% neq 0 (
        call npx electron .
    )
)
