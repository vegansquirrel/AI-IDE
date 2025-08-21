#!/bin/bash

echo "Fixing terminalProcess.ts..."

# First, restore from backup if it exists
if [ -f src/vs/platform/terminal/node/terminalProcess.ts.backup ]; then
    cp src/vs/platform/terminal/node/terminalProcess.ts.backup src/vs/platform/terminal/node/terminalProcess.ts
fi

# Now let's properly fix the file
# We need to ensure the useConpty variable is declared and used correctly
cat > /tmp/terminal-fix.py << 'PYTHON'
import re

with open('src/vs/platform/terminal/node/terminalProcess.ts', 'r') as f:
    content = f.read()

# Find the section around line 160-180 and fix it
# Look for the ptyOptions object literal
lines = content.split('\n')

# Fix the specific area around line 160-180
for i in range(160, min(180, len(lines))):
    # Check if this line has duplicate useConpty
    if 'useConpty' in lines[i] and 'useConpty' in lines[i+1] if i+1 < len(lines) else False:
        # Remove the duplicate
        lines[i+1] = ''
    
    # If there's a shorthand useConpty without a value, fix it
    if re.match(r'^\s*useConpty,?\s*$', lines[i]):
        lines[i] = '\t\tuseConpty: windowsEnableConpty,'
    
    # If useConptyDll exists, replace with useConpty
    if 'useConptyDll' in lines[i]:
        lines[i] = lines[i].replace('useConptyDll', 'useConpty')

# Make sure we have the variable declaration
found_declaration = False
for i in range(150, min(170, len(lines))):
    if 'const useConpty' in lines[i] or 'let useConpty' in lines[i]:
        found_declaration = True
        break

if not found_declaration:
    # Add the declaration before the ptyOptions
    for i in range(160, min(175, len(lines))):
        if 'const ptyOptions' in lines[i]:
            lines.insert(i, '\t\tconst useConpty = windowsEnableConpty;')
            break

# Join back and write
content = '\n'.join(lines)

# Also fix any useConptyDll references
content = content.replace('useConptyDll', 'useConpty')

with open('src/vs/platform/terminal/node/terminalProcess.ts', 'w') as f:
    f.write(content)

print("Fixed terminalProcess.ts")
PYTHON

python3 /tmp/terminal-fix.py

echo "Fixing type issues in extHostConsoleForwarder.ts..."
# Fix the callback type issue
sed -i '60s/(err?: Error | undefined)/(err?: Error | null | undefined)/g' src/vs/workbench/api/node/extHostConsoleForwarder.ts

echo "Fixing type issues in bootstrap-fork.ts..."
# Fix the callback type issue
sed -i '134s/(err?: Error | undefined)/(err?: Error | null | undefined)/g' src/bootstrap-fork.ts

echo "All fixes applied!"
