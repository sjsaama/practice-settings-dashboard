@echo off
echo Installing Practice Settings Dashboard...
echo.

echo Step 1: Installing Node.js dependencies...
call npm install

echo.
echo Step 2: Starting development server...
echo The app will open in your browser at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server when you're done.
echo.

call npm start

pause
