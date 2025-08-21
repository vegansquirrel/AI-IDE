#!/bin/bash

echo "Fixing terminalProcess.ts..."

# Line 164 already defines useConpty correctly
# Line 173 incorrectly uses windowsEnableConpty instead of useConpty

# Fix line 173 - replace windowsEnableConpty with useConpty
sed -i '173s/windowsEnableConpty/useConpty/' src/vs/platform/terminal/node/terminalProcess.ts

echo "Fixed terminalProcess.ts"
