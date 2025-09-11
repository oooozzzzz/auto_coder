@echo off
chcp 65001 >nul
title Next.js Launcher

echo ==========================================
echo        Next.js Production Launcher
echo ==========================================

if not exist "package.json" (
    echo Ошибка: package.json не найден!
    pause
    exit /b 1
)

:ask_port
set /p port="Введите порт для запуска сервера (по умолчанию 3000): "

if "%port%"=="" set port=3000

:: Удаляем все нецифровые символы
set "clean_port=%port:"=%"
set "clean_port=%clean_port: =%"
for /f "delims=0123456789" %%i in ("%clean_port%") do (
    echo Ошибка: Порт должен быть числом!
    echo.
    goto ask_port
)

if not "%clean_port%"=="%port%" (
    echo Ошибка: Порт должен быть числом!
    echo.
    goto ask_port
)

if %port% LSS 1 (
    echo Ошибка: Порт не может быть меньше 1!
    echo.
    goto ask_port
)

if %port% GTR 65535 (
    echo Ошибка: Порт не может быть больше 65535!
    echo.
    goto ask_port
)

echo.
echo ==========================================
echo Запускаю сервер на порту %port% в новом окне...
echo ==========================================
echo.

:: Запускаем в новом окне, которое не закроется
start "Next.js Server on port %port%" cmd /k "npm start -- --port %port%"

echo Сервер запущен в отдельном окне.
echo Это окно можно закрыть.
pause