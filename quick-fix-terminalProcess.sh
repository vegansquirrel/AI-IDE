#!/usr/bin/env bash
set -euo pipefail
F="src/vs/platform/terminal/node/terminalProcess.ts"

# 1) Drop the accidental re-declaration like:
#    const useConpty = useConpty && this._options.windowsUseConptyDll;
sed -i '/const useConpty = useConpty && this\._options\.windowsUseConptyDll;/d' "$F"

# 2) Make the single declaration include the DLL flag
#    const useConpty = <old conditions> && this._options.windowsUseConptyDll;
sed -i 's/getWindowsBuildNumber() >= 18309;/getWindowsBuildNumber() >= 18309 \&\& this._options.windowsUseConptyDll;/' "$F"

# 3) Inside this._ptyOptions = { ... }, keep only ONE 'useConpty,' line
awk '
  BEGIN { inObj=0; seenUseConpty=0 }
  /this\._ptyOptions = \{/ { inObj=1; seenUseConpty=0 }
  inObj && /^\s*\};/ { inObj=0 }
  {
    if (inObj && $0 ~ /^\s*useConpty,\s*$/) {
      if (seenUseConpty==1) next;
      seenUseConpty=1;
    }
    print
  }
' "$F" > "$F.tmp" && mv "$F.tmp" "$F"

echo "Patched $F"
