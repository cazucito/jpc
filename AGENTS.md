# AGENTS.md - jpc

## Default memory contract

Use this repository as the primary memory/context source for work related to **jpc**.

### Context loading order (token-efficient)
1. Project overview docs (`README.md`, docs index, architecture notes)
2. Active work trackers (`TODO.md`, issues notes, task docs)
3. Decision records (`DECISIONS.md` / ADRs) only when relevant
4. Historical logs/changelogs only for targeted entries

### Operating rules
- Do not load the entire repository context by default.
- Prefer small, relevant snippets over full-file dumps.
- Before coding, identify scope + affected files.
- After completing work, update only the minimal docs needed to preserve continuity.

### Update-at-close checklist
- Update current status in `README.md` or project status doc.
- Move finished tasks to done and leave clear next actions.
- Record non-obvious decisions and trade-offs.
- Keep notes concise and action-oriented.

### Task notation
- `[ ]` pending
- `[~]` in progress
- `[x]` done
