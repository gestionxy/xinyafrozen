@echo off
cd /d "%~dp0"

echo.
echo ==========================================
echo Drag PDF file here, then press Enter
echo ==========================================
echo.

set /p PDF_FILE=PDF: 

python "%~dp0THL_extract_all_products.py" %PDF_FILE%

pause
