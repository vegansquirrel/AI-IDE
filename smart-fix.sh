#!/bin/bash

echo "Applying smart fix based on file analysis..."

# Fix extHostConsoleForwarder.ts line 50
sed -i '50s/(err?: Error)/(err?: Error | null)/' src/vs/workbench/api/node/extHostConsoleForwarder.ts
echo "✓ Fixed extHostConsoleForwarder.ts"

# Check if bootstrap-fork.ts has the same pattern
if grep -q "get: () => (chunk: Uint8Array | string, encoding?: BufferEncoding, callback?: (err?: Error)" src/bootstrap-fork.ts; then
    # It has the exact same pattern, fix it
    sed -i 's/callback?: (err?: Error)/callback?: (err?: Error | null)/g' src/bootstrap-fork.ts
    echo "✓ Fixed bootstrap-fork.ts (same pattern)"
else
    # Different pattern, let's check line 134 specifically
    LINE_134=$(sed -n '134p' src/bootstrap-fork.ts)
    echo "Line 134 of bootstrap-fork.ts: $LINE_134"
    
    # The error is at column 44, so there's likely a callback around there
    # Let's just fix any (err?: Error) pattern in the file
    sed -i 's/(err?: Error)/(err?: Error | null)/g' src/bootstrap-fork.ts
    echo "✓ Fixed all (err?: Error) patterns in bootstrap-fork.ts"
fi

echo "All fixes applied!"
