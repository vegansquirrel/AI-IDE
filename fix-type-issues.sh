#!/bin/bash

# Fix extHostConsoleForwarder.ts
# We need to update the callback signature
sed -i '60s/(err?: Error | undefined)/(err?: Error | null | undefined)/g' src/vs/workbench/api/node/extHostConsoleForwarder.ts

# Fix bootstrap-fork.ts  
sed -i '134s/(err?: Error | undefined)/(err?: Error | null | undefined)/g' src/bootstrap-fork.ts

echo "Type fixes applied"
