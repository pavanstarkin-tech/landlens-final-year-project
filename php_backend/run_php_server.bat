@echo off
title LandLens PHP REST Backend Server
echo =====================================================================
echo   LANDLENS AI - PHP REST API BACKEND SERVER
echo   Connecting to Hostinger MySQL (srv1117.hstgr.io) ^& NVIDIA AI
echo =====================================================================
echo.
echo Starting PHP Built-in Server on http://localhost:5000 ...
cd /d "%~dp0"
php -S 0.0.0.0:5000 router.php
pause
