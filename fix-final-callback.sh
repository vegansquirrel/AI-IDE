#!/bin/bash

echo "Fixing the callback type..."

# Fix line 50 - change the callback parameter type
sed -i '50s/callback?: (err?: Error | null)/callback?: (err?: Error | null | undefined)/g' src/vs/workbench/api/node/extHostConsoleForwarder.ts

# If that doesn't work, try without the null
sed -i '50s/callback?: (err?: Error)/callback?: (err?: Error | null | undefined)/g' src/vs/workbench/api/node/extHostConsoleForwarder.ts

echo "Fixed callback type"

# Show what we have now
echo "Line 50 now contains:"
sed -n '50p' src/vs/workbench/api/node/extHostConsoleForwarder.ts
