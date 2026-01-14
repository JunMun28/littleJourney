#!/bin/bash

prompt="@PRD.md @progress.txt

# OBJECTIVE
Identify the highest priority task from progress.txt and PRD.md. Work on ONLY ONE task.

# WORKFLOW
1. **Select Task**: Prioritize in this order:
   1. Architectural decisions and core abstractions
   2. Integration points between modules
   3. Unknown unknowns and spike work
   4. Standard features and implementation
   5. Polish, cleanup, and quick wins

2. **Implement**:
   - Keep changes small and focused (one logical change per commit).
   - If a task feels too large, break it into subtasks.
   - Run feedback loops after each change, not at the end.
   - Quality over speed.
   - use TDD approach to write tests for new features.

3. **Verify** (Run ALL before committing):
   - TypeScript: \`npx tsc --noEmit\` (must pass with no errors)
   - Lint: \`npm run lint\` (must pass)
   - Test: \`npm test\` (must pass with no failures)
   - Build: \`npx expo export --platform web\` (must complete without errors)
   - UI (if UI changes): use Chrome MCP to verify UI on web via \`npm run web\`
   *Do NOT commit if any feedback loop fails. Fix issues first.*

4. **Document**: Append to \`progress.txt\`:
   - Task completed and PRD item reference
   - Key decisions made and reasoning
   - Files changed
   - Any blockers or notes for next iteration
   *Keep entries concise. Sacrifice grammar for the sake of concision.*

5. **Commit**: Make a git commit of that feature.

# TERMINATION
If, while implementing the feature, you notice that all work is complete, output <promise>COMPLETE</promise>."

claude --dangerously-skip-permissions --chrome --permission-mode acceptEdits "$prompt"