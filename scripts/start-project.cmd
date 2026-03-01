@echo off
setlocal EnableExtensions

call :ensure_admin
if errorlevel 1 exit /b 0

for %%I in ("%~dp0..") do set "ROOT_DIR=%%~fI"
set "APP_DIR=%ROOT_DIR%\app"
set "SERVER_DIR=%ROOT_DIR%\server"

if not exist "%APP_DIR%\package.json" (
  echo [ERROR] Frontend package nije pronadjen: "%APP_DIR%\package.json"
  exit /b 1
)

if not exist "%SERVER_DIR%\package.json" (
  echo [ERROR] Backend package nije pronadjen: "%SERVER_DIR%\package.json"
  exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm nije dostupan u PATH okruzenju.
  exit /b 1
)

echo Otvaram 2 administratorska CMD prozora za pokretanje projekta...

start "FitTrack Backend" cmd.exe /k "title FitTrack Backend && cd /d ""%SERVER_DIR%"" && echo [Backend] Pokrecem server... && call npm.cmd run dev"
start "FitTrack Frontend" cmd.exe /k "title FitTrack Frontend && cd /d ""%APP_DIR%"" && echo [Frontend] Pokrecem aplikaciju... && call npm.cmd start"

exit /b 0

:ensure_admin
powershell -NoProfile -ExecutionPolicy Bypass -Command "exit ([int](-not ((New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))))"
if not errorlevel 1 exit /b 0

echo Potrebne su administratorske privilegije. Pokusavam da pokrenem skriptu kao administrator...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
exit /b 1
