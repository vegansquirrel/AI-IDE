#!/bin/bash

# Fix the terminalProcess.ts file properly
sed -i '174s/useConptyDll:/useConpty:/' src/vs/platform/terminal/node/terminalProcess.ts
sed -i '401s/useConptyDll/useConpty/' src/vs/platform/terminal/node/terminalProcess.ts

echo "Fixed terminalProcess.ts"
