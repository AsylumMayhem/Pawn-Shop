@echo off
setlocal EnableDelayedExpansion
set "FILE=%~dp0RingCraftingDatabase.html"
set "FILE_URL=file:///%FILE:\=/%"

:: Try Edge app mode first (best — own window, no tabs/address bar)
for %%P in (
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
  "%LocalAppData%\Microsoft\Edge\Application\msedge.exe"
) do (
  if exist %%P (
    start "" %%P --app="%FILE_URL%" --window-size=1280,860 --new-window
    exit /b
  )
)

:: Try Chrome app mode
for %%P in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
) do (
  if exist %%P (
    start "" %%P --app="%FILE_URL%" --window-size=1280,860
    exit /b
  )
)

:: Fallback: open in default browser
start "" "%FILE%"
