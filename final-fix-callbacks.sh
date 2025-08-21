#!/bin/bash

echo "Fixing callback type signatures..."

# Fix line 50 in extHostConsoleForwarder.ts
# Change (err?: Error) to (err?: Error | null)
sed -i '50s/(err?: Error)/(err?: Error | null)/' src/vs/workbench/api/node/extHostConsoleForwarder.ts

echo "Fixed extHostConsoleForwarder.ts line 50"

# Now we need to find what's on line 134 of bootstrap-fork.ts
# Let's check if it has a similar pattern
if grep -q "(err?: Error)" src/bootstrap-fork.ts; then
    # Find the line number and fix it
    LINE=$(grep -n "(err?: Error)" src/bootstrap-fork.ts | head -1 | cut -d: -f1)
    if [ ! -z "$LINE" ]; then
        sed -i "${LINE}s/(err?: Error)/(err?: Error | null)/" src/bootstrap-fork.ts
        echo "Fixed bootstrap-fork.ts line $LINE"
    fi
else
    echo "Pattern not found in bootstrap-fork.ts, checking line 134 directly..."
    # The error might be from a different construct
    # Let's look at what's actually on line 134
    sed -n '134p' src/bootstrap-fork.ts
fi

echo "Fixes applied!"
