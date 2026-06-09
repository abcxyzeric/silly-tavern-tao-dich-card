@echo off
chcp 65001 >nul
title Silly Tavern Tao Dich Card
echo ====================================
echo Silly Tavern Tao Dich Card đang khởi động...
echo ====================================
echo.

cd /d "%~dp0":: Build if dist doesn't exist
if not exist "dist" (echo [1/3] Đang build dự án...
 call npm run build
 echo.):: Start server and open browser
echo [2/3] Đang khởi động máy chủ...
echo [3/3] Mở trình duyệt...
echo.
echo Địa chỉ truy cập: http://localhost:3001
echo Nhấn Ctrl + C để tắt máy chủ
echo ====================================
echo.:: Start the server and open browser
start "" http://localhost:3001
call npm run start
