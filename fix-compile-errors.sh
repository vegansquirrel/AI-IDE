#!/bin/bash

echo "Fixing compilation errors..."

# Fix terminalProcess.ts
sed -i 's/useConptyDll/useConpty/g' src/vs/platform/terminal/node/terminalProcess.ts

# Fix type issues - this is a bit more complex, so we'll use a more targeted approach
# For extHostConsoleForwarder.ts (line 60)
sed -i '60s/Error | undefined/Error | null | undefined/' src/vs/workbench/api/node/extHostConsoleForwarder.ts

# For bootstrap-fork.ts (line 134)
sed -i '134s/Error | undefined/Error | null | undefined/' src/bootstrap-fork.ts

echo "Fixes applied!"
