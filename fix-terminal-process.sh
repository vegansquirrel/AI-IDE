#!/bin/bash

# Backup the original file
cp src/vs/platform/terminal/node/terminalProcess.ts src/vs/platform/terminal/node/terminalProcess.ts.backup

# Fix the terminalProcess.ts file
# We need to look at lines around 164-174 and fix the duplicate declarations
cat > /tmp/terminal-fix.patch << 'PATCH'
--- a/src/vs/platform/terminal/node/terminalProcess.ts
+++ b/src/vs/platform/terminal/node/terminalProcess.ts
@@ -161,11 +161,8 @@
 		const isConpty = windowsEnableConpty && process.platform === 'win32' && getWindowsBuildNumber() >= 18309;
 		
 		// Create the pty options
-		const useConpty = windowsEnableConpty;
-		const useConpty = windowsEnableConpty;
 		const ptyOptions: IPtyForkOptions | IWindowsPtyForkOptions = {
 			name,
-			useConpty: windowsEnableConpty,
 			useConpty: windowsEnableConpty,
 			cwd,
 			env,
PATCH

# Apply a more targeted fix - remove duplicate lines
sed -i '164,165d' src/vs/platform/terminal/node/terminalProcess.ts

# Also ensure there's only one useConpty property in the object literal
sed -i '174s/useConptyDll/useConpty/g' src/vs/platform/terminal/node/terminalProcess.ts

# Fix line 401 if it exists
sed -i '401s/useConptyDll/useConpty/g' src/vs/platform/terminal/node/terminalProcess.ts

echo "Terminal process fixes applied"
