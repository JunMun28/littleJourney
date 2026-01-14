#!/bin/bash

# afk-ralph.sh
# Usage: ./afk-ralph.sh <iterations>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

echo "========================================="
echo "Starting afk-ralph.sh"
echo "Total iterations: $1"
echo "========================================="
echo ""

# For each iteration, run Claude Code with the following prompt.
for ((i=1; i<=$1; i++)); do
  echo "----------------------------------------"
  echo "Iteration $i of $1"
  echo "----------------------------------------"
  echo "Running Claude Code..."
  echo ""

  result=$(claude --dangerously-skip-permissions --chrome --permission-mode acceptEdits -p \
"@PRD.md @progress.txt \
\
# OBJECTIVE \
Identify the highest priority task from progress.txt and PRD.md. Work on ONLY ONE task. \
\
# WORKFLOW \
1. **Select Task**: Prioritize in this order: \
   1. Architectural decisions and core abstractions \
   2. Integration points between modules \
   3. Unknown unknowns and spike work \
   4. Standard features and implementation \
   5. Polish, cleanup, and quick wins \
\
2. **Implement**: \
   - Keep changes small and focused (one logical change per commit). \
   - If a task feels too large, break it into subtasks. \
   - Run feedback loops after each change, not at the end. \
   - Quality over speed. \
\
3. **Verify** (Run ALL before committing): \
   - TypeScript: \`npx tsc --noEmit\` (must pass with no errors) \
   - Lint: \`npm run lint\` (must pass) \
   - Build: \`npx expo export --platform web\` (must complete without errors) \
   - UI (if UI changes): use Chrome MCP to verify UI on web via \`npm run web\` \
   *Do NOT commit if any feedback loop fails. Fix issues first.* \
\
4. **Document**: Append to \`progress.txt\`: \
   - Task completed and PRD item reference \
   - Key decisions made and reasoning \
   - Files changed \
   - Any blockers or notes for next iteration \
   *Keep entries concise. Sacrifice grammar for the sake of concision.* \
\
5. **Commit**: Make a git commit of that feature. \
\
# TERMINATION\
If, while implementing the feature, you notice that all work is complete (no more passes: false in PRD.md), output <promise>COMPLETE</promise>.")

  echo ""
  echo "Claude Code execution completed for iteration $i"
  echo "Checking for completion signal..."
  echo ""
  echo "Result: $result"
  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "========================================="
    echo "✓ PRD complete! Exiting."
    echo "========================================="
    ~/.claude/notify-email.sh
    exit 0
  fi

  echo "Iteration $i finished. Continuing to next iteration..."
  echo ""
done

# All iterations completed, push to GitHub
echo "========================================="
echo "All $1 iterations completed."
echo "Pushing to GitHub..."
echo "========================================="
git push

# Send notification
echo "Sending notification..."
~/.claude/notify-email.sh
