#!/bin/bash

echo "Fixing callback type issues..."

# Fix extHostConsoleForwarder.ts
# Find the pipe.pipe call around line 60 and update the callback signature
sed -i '60s/(err?: Error)/(err?: Error | null)/' src/vs/workbench/api/node/extHostConsoleForwarder.ts

# Fix bootstrap-fork.ts  
# Find the pipeSender.end call around line 134 and update the callback signature
sed -i '134s/(err?: Error)/(err?: Error | null)/' src/bootstrap-fork.ts

echo "Fixed callback types"
