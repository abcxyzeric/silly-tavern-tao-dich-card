@echo off
chcp 65001 >nul
title Silly Tavern Tao Dich Card (chế độ phát triển)
echo ====================================
echo Chế độ phát triển Silly Tavern Tao Dich Card
echo ====================================
echo.

cd /d "%~dp0"

echo Đang khởi động máy chủ phát triển (hỗ trợ cập nhật nóng)...
echo.

call npm run dev
