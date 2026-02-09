# PR Monitor (prm) - Get Your PR Ready to Merge

This command monitors a PR until it is ready to merge by combining comment resolution and check fixing workflows. The agent will continuously work to resolve blocking issues until the PR can be merged.

User-provided additional info: <user_data> $ARGUMENTS </user_data>

## Requirements

This command must be run in the directory of a git branch that has an open PR. The command will check the current git branch and monitor the corresponding PR.

## Goal

Get the PR to a mergeable state by:

1. Resolving all review comments and conversations
2. Ensuring all PR checks pass
3. Monitoring and fixing any issues that arise

## Workflow Overview

The agent operates in a continuous monitoring loop:

```
┌─────────────────────────────────────────────────────────────┐
│                    PR MONITOR LOOP                          │
├─────────────────────────────────────────────────────────────┤
│  1. Check PR Status                                         │
│     ├─ Unresolved comments? → Resolve Comments Phase        │
│     ├─ Failing checks? → Fix Checks Phase                   │
│     └─ All clear? → PR Ready!                               │
│                                                             │
│  2. After each phase, return to step 1                      │
│                                                             │
│  3. Exit when PR is mergeable OR user stops                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Initial Status Check

Before beginning any work, assess the current state of the PR:

1. Use `gh pr view` to get the PR number and current status
2. Use the `github` skill to fetch all unresolved review threads
3. Use `gh pr checks` to see the status of all PR checks

Create a summary of:

- Number of unresolved conversations
- Number of failing/pending checks
- Overall PR merge status

Present this summary to the user before proceeding.

---

## Phase 1: Resolve Comments

**Skip this phase if there are no unresolved comments.**

This phase addresses all review comments on the PR. PRs cannot be merged while review threads remain unresolved.

### 1.1 Research & Analysis

Analyze all unresolved review comments:

1. Use the `github` skill to fetch all unresolved review threads
2. Categorize comments by type:
   - Code changes required
   - Documentation updates
   - Questions needing responses
   - Style/preference issues (candidates for "will not fix")

**IMPORTANT**: Review threads can contain multiple comments. Iterate through ALL comments in each thread.

### 1.2 Filtering

Identify items that should be marked as "will not fix":

- Style or coding preference comments (unless they're simple typo fixes)
- Suggestions that don't affect bugs, performance, or correctness

Present these items to the user for approval before marking them.

### 1.3 Solutioning & Scoring

For each item to fix, identify:

- Brief solution approach
- Severity (1-10): Impact if not addressed
- Complexity (1-10): Size of change required
- Risk (1-10): Likelihood of introducing other issues
- Confidence (1-10): Certainty that solution will work

Group related items that should be addressed together.

### 1.4 User Feedback

Present your analysis and proposed plan to the user:

- Issues you will fix (with solutions)
- Issues you recommend marking "will not fix" (with rationale)

Wait for user approval before proceeding. Adjust plan based on feedback.

### 1.5 Implementation

Execute the approved plan:

- For small/simple fixes: Handle in the current context
- For complex/independent fixes: Use parallel subagents to speed up resolution

For each item:

1. Make the required code changes
2. Test that changes work correctly
3. Reply to the comment explaining what was done
4. Mark the review thread as resolved using the `github` skill

### 1.6 Verification

**CRITICAL**: Verify all conversations are resolved:

1. Use the `github` skill to check unresolved threads
2. The output MUST show `Unresolved: 0` before proceeding
3. If any threads remain unresolved, investigate and resolve them

Commit and push all changes once verified.

---

## Phase 2: Fix Failing Checks

**Skip this phase if all checks are passing.**

This phase ensures all PR checks pass.

### 2.1 Fetch Check Status

Using the GitHub CLI:

1. Run `gh pr checks` to see all check statuses
2. For each failing check, read the logs to find the error message
3. Compile a list of all failures with their error messages

### 2.2 Planning

Analyze all failures and create a comprehensive fix plan:

- Identify root cause for each failure
- Look for common patterns across failures
- Create a plan that addresses ALL issues

The plan should ensure the ENTIRE set of PR checks will pass after implementation.

### 2.3 User Feedback

Present the fix plan to the user. Wait for approval before proceeding.

### 2.4 Implementation

Fix each issue identified in the plan.

### 2.5 Local Testing

Test the codebase thoroughly by running PR checks locally:

- Build: `pnpm run build`
- Test: `pnpm run test`
- Lint: `pnpm run lint`
- Format: `pnpm run format`

Iteratively fix any issues until all checks pass locally.

### 2.6 Clean-up & Push

Once all local checks pass:

1. Run `pnpm run format` to ensure formatting is correct
2. Commit all changes with a clear message
3. Push the commit to the branch

---

## Phase 3: Monitor Loop

After completing Phases 1 and 2, enter the monitoring loop:

### 3.1 Wait for CI

1. Sleep for 30 seconds
2. Check the status of PR checks using `gh pr checks`
3. If checks are still running, return to step 1
4. If checks are complete, proceed to evaluation

### 3.2 Evaluate Status

Check the overall PR status:

1. **New comments?** → Return to Phase 1
2. **Failing checks?** → Return to Phase 2
3. **All clear?** → PR is ready to merge!

### 3.3 Completion

When the PR is ready to merge:

1. Post a summary comment on the PR using the `github` skill
2. Notify the user that the PR is ready for merge
3. Ask if the user wants you to merge the PR or leave it for manual merge

---

## Success Criteria

The PR Monitor workflow is complete when:

- [ ] All review threads show as resolved (`unresolvedCount: 0`)
- [ ] All PR checks are passing
- [ ] All changes have been committed and pushed
- [ ] A summary comment has been posted to the PR

---

## Appendix: Using the GitHub Skill

The `github` skill handles all PR review operations:

- **View unresolved threads**: See what needs to be addressed
- **Reply to comments**: Explain what was done
- **Resolve threads**: Mark conversations as resolved
- **Post comments**: Add summary or status updates

The skill will be invoked automatically when you need to perform these operations.

---

## Appendix: Handling Edge Cases

### New Comments During Fixes

If new comments appear while fixing checks:

- Complete the current phase
- Return to the monitoring loop
- The loop will detect new comments and trigger Phase 1

### Flaky Tests

If a test fails inconsistently:

- Document the flaky test
- Ask the user how to proceed
- Options: skip the test, add retry logic, or fix the underlying flakiness

### Merge Conflicts

If merge conflicts arise:

- Alert the user immediately
- Offer to help resolve conflicts
- Re-run all checks after resolution

### CI Environment Issues

If failures appear to be environment-related (not reproducible locally):

- Document the discrepancy
- Ask the user for guidance
- Consider re-running the CI workflow
