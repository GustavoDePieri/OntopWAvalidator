@echo off
echo Installing WhatsApp Validator...
echo.

echo Installing dependencies...
call npm install

echo.
echo Creating environment file...
if not exist .env.local (
    copy env.example .env.local
    echo Environment file created! Please edit .env.local with your API credentials.
) else (
    echo Environment file already exists.
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit .env.local with your API credentials
echo 2. Set up your Google Sheet with the required columns
echo 3. Run 'npm run dev' to start the development server
echo.
pause
