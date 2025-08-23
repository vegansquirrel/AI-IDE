#!/usr/bin/env bash
set -euo pipefail
root="src/vs/workbench/contrib/ai"

# Rewrite only AI files:  import ... from 'vs/...'
# -> relative path to src/vs root + original tail, with a .js suffix.
while IFS= read -r -d '' f; do
  rel="${f#*src/vs/}"     # e.g. workbench/contrib/ai/browser/aiChatView.ts
  dir="$(dirname "$rel")" # e.g. workbench/contrib/ai/browser
  IFS='/' read -r -a parts <<< "$dir"
  depth=${#parts[@]}
  prefix=""
  for ((i=0;i<depth;i++)); do prefix="../$prefix"; done

  PREFIX="$prefix" perl -i -pe '
    my $p = $ENV{PREFIX};

    # import ... from "vs/..."
    s#(from\s+["\'])vs/([^"\']+?)(\.js)?(["\'])#
      my $t = $2;
      $1 . $p . $t . ".js" . $4
    #eg;

    # side-effect: import "vs/..."
    s#(import\s+["\'])vs/([^"\']+?)(\.js)?(["\'])#
      my $t = $2;
      $1 . $p . $t . ".js" . $4
    #eg;
  ' "$f"
done < <(find "$root" -type f -name '*.ts' -print0)

echo "Rewrote imports under $root"
