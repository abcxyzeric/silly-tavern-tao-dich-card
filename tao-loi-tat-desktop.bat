@echo off
chcp 65001 >nul
echo ====================================
echo Tạo lối tắt trên màn hình
echo ====================================
echo.

cd /d "%~dp0"
cscript //nologo "%~dp0create-shortcut.vbs"

echo.
echo ✅ Đã tạo lối tắt ra màn hình desktop!
echo.
echo Nhấp đúp vào "Silly Tavern Tao Dich Card" trên màn hình để khởi động bằng một cú nhấp chuột
echo ====================================
pause
