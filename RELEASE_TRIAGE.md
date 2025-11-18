# Release Triage — 2025-11-18

Goal: Ship current release without blocking on non-critical, feature-focused
issues. No regressions or critical bugs identified in the open queue; all open
items are safely deferrable.

## Summary

- Status: Green for release — no blocking defects.
- Scope: All open issues and the one open PR were reviewed for impact and
  urgency.
- Decision: Defer all feature/enhancement work to post-release milestones; do
  not merge breaking changes.

## Triage Decisions (Issue-by-Issue)

- Issue #34: Add OAuth login support (Google/GitHub)

  - Type: Feature | Area: Auth
  - Impact: Non-blocking; password/JWT auth already works.
  - Decision: Defer. Suggest label: `type:feature`, `area:auth`, `priority:low`.
  - Target: v1.2.0 roadmap.

- Issue #33 (PR): Rails‑style --skip-* flags for scaffold (breaking default)

  - Type: PR (feature) | Area: CLI | Breaking: Yes (auth middleware default)
  - Impact: Risky right before release; CI notes indicate external downloads
    blocked, increasing verification risk.
  - Decision: Do not merge pre-release. Convert to draft or keep open; merge
    after release with full verification.
  - Target: v1.1.x (minor) after discussion; add labels `breaking-change`,
    `needs-discussion`.

- Issue #19: Research Admin UI Panel Integration (React‑Admin vs Refine)

  - Type: Research | Area: Frontend | Labels: priority:low, status:research
  - Impact: None on backend release.
  - Decision: Defer; keep as research item.
  - Target: Future (no release block).

- Issue #11: Contact/Enquiry Form + Email Notifications

  - Type: Feature | Area: CLI | Labels: priority:high
  - Impact: High value but depends on email service (#10). Not a regression;
    optional module.
  - Decision: Non-blocking for this release; keep priority high, schedule next
    minor.
  - Target: v1.1.1/v1.2.0 (after #10).

- Issue #10: Email Service Integration (SMTP + providers)

  - Type: Feature | Area: CLI | Labels: priority:medium
  - Impact: Enables #11; self-contained; non-blocking.
  - Decision: Defer post-release.
  - Target: v1.1.1.

- Issue #9: Redis integration (cache/queue/rate limit)

  - Type: Feature | Area: CLI | Labels: priority:medium
  - Impact: Performance/infra; optional; non-blocking.
  - Decision: Defer post-release.
  - Target: v1.1.1+.

- Issue #7: Kamal deployment configuration + path routing

  - Type: Enhancement/Docs | Area: Deployment
  - Impact: Improves DX/ops; non-blocking.
  - Decision: Defer; consider shipping docs-only PR after release.
  - Target: v1.1.x.

- Issue #1: Rails‑style --skip-* flags (include-by-default)

  - Type: Feature | Area: CLI | Labels: priority:medium
  - Impact: Behavior change; coupled with PR #33; risky pre-release.
  - Decision: Defer to follow-up minor release.
  - Target: v1.1.x (with migration notes/tests).

## Recommended Maintainer Actions (Pre-Release Freeze)

- Label hygiene: Apply/confirm labels noted above (priority, type, area).
- Milestones: Create milestones `v1.1.1` and `v1.2.0` and assign issues per
  targets above.
- PR #33: Mark as `draft` + add `breaking-change`, `needs-discussion`.
- Changelog: Document “No blocking issues; feature work deferred to milestones.”

## Post-Release Follow‑ups

- Kick off #10 (Email Service) first; then #11 (Contact/Enquiry Form).
- Plan #1/#33 together to avoid duplicate work and ensure clear DX/docs.
- Decide on Admin UI direction (#19) before building templates or wiring CLI
  flags.
- Consider a docs-only PR for #7 to unblock early adopters without code risk.

— Prepared on 2025‑11‑18 for the imminent release window.
