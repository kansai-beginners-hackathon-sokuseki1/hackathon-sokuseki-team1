# AGENTS.md

This file defines the minimum working rules for AI agents operating in this repository.

## Priority
- Follow repository files before making assumptions.
- Treat `README.md` and files under `docs/operations/` as the source of truth for team rules.
- If instructions conflict, prefer the more restrictive rule unless a human explicitly overrides it.

## Branch And Merge Rules
- Do not make changes directly on `main`.
- Do not push directly to `main`.
- Make changes on a task-specific branch.
- Human review is required when changes are merged into `main`.
- Review on non-`main` branches is optional unless a human requests it.

## Task Tracking
- Tie work to a GitHub Issue or a clearly written task whenever possible.
- If the task is still unclear, prefer creating or updating planning documents before implementing code.
- Keep decisions in repository documents, not only in chat logs.

## Security And Config
- Do not hard-code API keys, tokens, passwords, or other secrets.
- Do not hard-code endpoints or service URLs in code.
- Store secrets in `.env`.
- Store local endpoint settings in `config/endpoints.local.json`.
- Keep only sample files such as `.env.example` and `config/endpoints.example.json` in Git.

## File Handling
- Use UTF-8 for text files.
- Do not commit local-only helper folders or environment-sharing assets such as `PIC/`.
- Do not add generated recordings or large local artifacts unless a human explicitly requests it.

## Documentation
- Update docs when behavior, workflow, or decisions change.
- For Git workflow, follow `docs/operations/git-workflow.md`.
- For AI-specific rules, follow `docs/operations/ai-agent-rules.md`.
- For project board behavior, follow `docs/operations/project-board.md`.

## Review Expectations For AI Changes
- Before proposing changes for `main`, ensure the diff is scoped to the requested task.
- Call out unresolved risks, assumptions, and testing gaps.
- Include test steps or verification steps when making implementation changes.

## Local Notes
- `PIC/` exists to share local environment context with the agent and must remain out of Git tracking.
