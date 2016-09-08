tasklist /fi "IMAGENAME eq chrome.exe" 2>NUL | find /I /N "chrome.exe" >NUL
if "%ERRORLEVEL%" == "0" (
	msg "%USERNAME%" "Google Chrome is already running. Please close it to continue"
	exit 1
)

SET cur_dir=%~dp0
SET tmp_dir=%TEMP%\zp_debugger

rmdir %tmp_dir% /s /q
mkdir %tmp_dir%

start chrome /disable-web-security /allow-file-access-from-files /no-default-browser-check /user-data-dir=%tmp_dir% /load-extension=%cur_dir%extension %cur_dir%zp_debugger.html
