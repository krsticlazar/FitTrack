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

echo Otvaram 2 administratorska CMD prozora za instalaciju zavisnosti...

start "FitTrack Backend Install" cmd.exe /c "title FitTrack Backend Install && cd /d ""%SERVER_DIR%"" && echo [Backend] Instalacija zavisnosti... && call npm.cmd install & if errorlevel 1 (echo [Backend] Instalacija nije uspela. & echo [Backend] Pritisni bilo koji taster za zatvaranje prozora. & pause >nul) else (echo [Backend] Instalacija uspesno zavrsena! & echo [Backend] Gasenje terminala za 5 sekundi... & timeout /t 5 /nobreak >nul)"

start "FitTrack Frontend Install" cmd.exe /c "title FitTrack Frontend Install && cd /d ""%APP_DIR%"" && echo [Frontend] Instalacija zavisnosti... && call npm.cmd install & if errorlevel 1 (echo [Frontend] Instalacija nije uspela. & echo [Frontend] Pritisni bilo koji taster za zatvaranje prozora. & pause >nul) else (echo [Frontend] Instalacija uspesno zavrsena! & echo [Frontend] Gasenje terminala za 5 sekundi... & timeout /t 5 /nobreak >nul)"

exit /b 0

:ensure_admin
powershell -NoProfile -ExecutionPolicy Bypass -Command "exit ([int](-not ((New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))))"
if not errorlevel 1 exit /b 0

echo Potrebne su administratorske privilegije. Pokusavam da pokrenem skriptu kao administrator...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
exit /b 1