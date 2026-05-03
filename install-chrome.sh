#!/bin/bash
# Install Chrome for Playwright Testing on macOS

set -e

echo "======================================"
echo "Chrome Installation Script for AVARENT"
echo "======================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

# Function to install Chrome
install_chrome() {
    echo "📦 Installing Google Chrome for Testing..."
    
    # Remove broken symlink if exists
    if [ -L "/Applications/Google Chrome.app" ]; then
        echo "🧹 Removing broken symlink..."
        rm "/Applications/Google Chrome.app"
    fi
    
    # Check if we have the Chromium already
    CHROME_PATH="$HOME/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64"
    
    if [ -d "$CHROME_PATH" ]; then
        echo "✅ Found Chromium at: $CHROME_PATH"
        echo ""
        echo "Option A: Copy to /Applications (requires sudo)"
        echo "Option B: Use from current location"
        echo ""
        read -p "Choose option (A/B): " choice
        
        if [[ $choice == "A" || $choice == "a" ]]; then
            echo "🔐 Copying to /Applications (enter sudo password if prompted)..."
            sudo cp -R "$CHROME_PATH/Google Chrome for Testing.app" "/Applications/Google Chrome.app"
            echo "✅ Chrome installed to /Applications"
        else
            echo "ℹ️  Using Chrome from: $CHROME_PATH"
            echo "   To use with Playwright, set:"
            echo "   export PLAYWRIGHT_CHROMIUM_PATH=\"$CHROME_PATH/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing\""
        fi
    else
        echo "⚠️  Chromium not found. Installing via Playwright..."
        npx playwright install chrome
    fi
}

# Check for npm/node
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Main installation
echo "🔍 Checking current Chrome installation..."

if [ -d "/Applications/Google Chrome.app" ] && [ ! -L "/Applications/Google Chrome.app" ]; then
    echo "✅ Google Chrome is already installed at /Applications"
    
    # Test if it works
    if "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version &> /dev/null; then
        echo "✅ Chrome is working correctly!"
        exit 0
    else
        echo "⚠️  Chrome installation may be corrupted"
        read -p "Reinstall? (y/N): " reinstall
        if [[ $reinstall == "y" || $reinstall == "Y" ]]; then
            rm -rf "/Applications/Google Chrome.app"
            install_chrome
        fi
    fi
else
    install_chrome
fi

echo ""
echo "======================================"
echo "Installation Complete!"
echo "======================================"
echo ""
echo "You can now run Playwright tests:"
echo "  cd /Users/george/avarentdemo"
echo "  npx playwright test"
echo ""
echo "Or open the dashboard:"
echo "  npm run dev"
echo "  http://localhost:5173"
echo ""
