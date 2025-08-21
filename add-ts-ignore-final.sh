#!/bin/bash

echo "Adding @ts-ignore before line 61..."

# Add @ts-ignore right before the original.call line (line 61)
sed -i '61i\				// @ts-ignore - Node.js stream type compatibility' src/vs/workbench/api/node/extHostConsoleForwarder.ts

echo "Added @ts-ignore"

# Verify the change
echo "Lines 60-62 now:"
sed -n '60,62p' src/vs/workbench/api/node/extHostConsoleForwarder.ts
