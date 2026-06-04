# Git Workflow Rules

## Push to GitHub — ALWAYS Confirm First

NEVER run `git push` without explicit user confirmation. This is a hard rule with no exceptions.

Before any `git push`:
1. Show the user what will be pushed:
   ```bash
   git log origin/main..HEAD --oneline
   git diff origin/main..HEAD --stat
   ```
2. Ask: "This will push X commits to [branch]. Do you want to proceed?"
3. Wait for explicit "yes" / "confirm" / "push it" — do NOT infer consent
4. Only then run `git push`

This applies even if the user says "deploy", "publish", "send to GitHub", or similar phrasing.

## Commit Rules
- Always show `git status` and `git diff --stat` before staging
- Commit message format: `type: short description`
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`
- Never commit `.env.local` or any file with secrets
- Never use `git add .` without reviewing what's being added

## Branch Rules
- Never force push without explicit user instruction
- Never push directly to `main` — ask which branch to push to
- Warn if on `main` and asked to push

## Safe Commands (no confirmation needed)
`git status`, `git diff`, `git log`, `git add <specific-file>`, `git commit`
