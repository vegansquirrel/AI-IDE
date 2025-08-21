#!/bin/bash

echo "Fixing the last remaining error..."

# First, remove any @ts-ignore comments we added
sed -i '/@ts-ignore/d' src/vs/workbench/api/node/extHostConsoleForwarder.ts

# Now fix the callback signature on line 50 (or wherever it is now)
# Change callback?: (err?: Error) to callback?: (err?: Error | null)
sed -i 's/callback?: (err?: Error)/callback?: (err?: Error | null)/g' src/vs/workbench/api/node/extHostConsoleForwarder.ts

echo "Fixed callback signature"

# Verify the fix
echo "Verifying the fix:"
grep -n "callback?: (err?" src/vs/workbench/api/node/extHostConsoleForwarder.ts
