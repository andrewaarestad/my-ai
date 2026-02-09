# Resolve PR Comments - Using Subagents

This command is used to analyze and resolve comments on Pull Requests. When this command is finished, all comments on the PR should either be resolved or have clear next steps identified and documented in the GitHub comment thread.

User-provided additional info:  <user_data> #$ARGUMENTS </user_data>

## Requirements

This command must be run in the directory of a git branch that has an open PR. The command will check the current git branch and analyze the corresponding PR.

## Overview

The comments on the PR are addressed with the following algorithm:

1. Read all the comments on the PR
2. Analyze comments and create a plan for each
3. Resolve all comments, either in the main agent context or using subagents

## Agent Instructions

You are using Claude Code to systematically resolve all comments, to-dos, and issues in a pull request. Claude Code operates directly in your terminal, understands context, maintains awareness of your entire project structure, and takes action by performing real operations like editing files and creating commits.

## Context Awareness

Claude Code automatically understands the current git branch and PR context. You don't need to specify which PR you're working on - Claude Code will:
- Detect the current branch
- Understand associated PR context
- Fetch PR comments automatically

## Workflow Details

### Phase 1: Preparation

#### Phase 1.1: Research & Analysis

Please analyze this PR and all its comments. Look for:

1. All unresolved review comments and conversations
2. To-do items mentioned in comments
3. Requested changes from code reviews
4. Questions that need responses

**IMPORTANT**: Review threads can contain multiple comments. You must iterate through ALL comments in each thread, not just the first one.

Use the GitHub GraphQL API to get comprehensive data about all comment types. Start by getting the repository owner and name:

```bash
# Get repo info
REPO_INFO=$(gh repo view --json owner,name)
OWNER=$(echo $REPO_INFO | jq -r '.owner.login')
REPO=$(echo $REPO_INFO | jq -r '.name')
PR_NUMBER=$(gh pr view --json number -q '.number')
```

**Step 1: First, get the count of unresolved threads to validate completeness:**

```bash
# Get total count of unresolved review threads
gh api graphql -f query="
query {
  repository(owner: \"$OWNER\", name: \"$REPO\") {
    pullRequest(number: $PR_NUMBER) {
      reviewThreads(first: 100) {
        totalCount
        nodes {
          id
          isResolved
        }
      }
    }
  }
}" --jq '.data.repository.pullRequest.reviewThreads | {totalCount, unresolvedCount: [.nodes[] | select(.isResolved == false)] | length}'
```

This will show you the total number of threads and how many are unresolved. **Remember this number** - you must fetch exactly this many threads.

**Step 2: Fetch all unresolved review comments:**

```bash
# Get ALL unresolved review thread comments
gh api graphql -f query="
query {
  repository(owner: \"$OWNER\", name: \"$REPO\") {
    pullRequest(number: $PR_NUMBER) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          comments(first: 50) {
            nodes {
              id
              body
              author { login }
              path
              line
              diffHunk
            }
          }
        }
      }
    }
  }
}" --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'
```

**Step 3: VALIDATE COMPLETENESS - CRITICAL**

Before proceeding, you MUST verify that you received ALL unresolved threads:

1. Count how many thread objects you received in Step 2
2. Compare to the `unresolvedCount` from Step 1
3. **If the numbers don't match**, the output was truncated. You MUST use an alternative approach:
   - Save the full output to a temporary file instead of piping to jq
   - Or fetch threads in smaller batches
   - Or simplify the output format to avoid truncation
4. **Do not proceed to Phase 1.2** until you have confirmed you have ALL unresolved threads

**If you see any truncation warnings or "... [N lines truncated] ..." messages, STOP and re-fetch the data using a different method.**

This will return all unresolved threads with ALL their comments. Process each thread and iterate through the comments array to capture every comment.

Group the items by type (code changes, documentation, responses to questions).

#### Phase 1.2: Filtering

For each item, consider whether it should be marked as "will not fix". This should be applied to comments that relate to style or coding preference. Anything that isn't a potential bug or performance problem should be closed without fix. The exception to this rule is simple grammar or typo fixes which have no code impact.

These items should be summarized and presented to the user, along with being posted in a comment on the PR. Do not take any action on these items until you begin Phase 3: Execution.

#### Phase 1.3: Solutioning

For each remaining item, identify the likely solution. Determining the solution for complex issues may take more time than we want to spend here - the solution identified at this phase should be brief and high-level. If the problem is too complex for a quick solution to be identified, summarize the issue and mark it for processing with thinking mode by a subagent.

During the solutioning phase, items should also be grouped for being processed together. Items belong in the same group if they touch the same files, if one issue depends on another, or if the solutions have any potential to conflict.

#### Phase 1.4: Scoring

For each issue/solution, create a score in a scale of [1,10] for the following considerations:

* Severity: If this is not addressed, what is the potential impact?
* Complexity: How big of a change is required to address this?
* Risk: How likely is it that addressing this change will introduce other issues?
* Confidence: How sure are you that your solution will address the issue?

### Phase 2: User Feedback

This phase is a checkpoint where you will present your analysis for each issue to the user, grouped by type. Think of this as a menu where you offer the user your recommendation (fix/no-fix) for each item. The user will then respond by either simply approving your plan, or providing customized feedback. If the user offers feedback, adjust the plan accordingly and present it again.

Do not proceed with Phase 3 until the user agrees to your plan.

### Phase 3: Execution

#### Phase 3.1: Planning

Once you have the approved list of issues to address, create an implementation plan for how to execute the changes. This plan will need to address:

* using subagents or the current context window?
    * for small sets of easy fixes, it may be ok to just use the current agent context window
    * for larger tasks or tasks that require further analysis, use subagents to keep the main context window clean

Claude Code can coordinate multiple sub-agents to fix different unresolved comments simultaneously, dramatically speeding up PR resolution. 

When to Use Parallel Sub-Agents: 

- Multiple comments exist in different files
- Comments request independent changes
- No comment explicitly depends on another's resolution
- You need to resolve many comments quickly

#### Phase 3.2: Implementation

Now implement the solutions for each item in the plan:

- If this item requires further analysis, read the codebase and use thinking mode to create a better understanding of the issue
- Make the requested code changes
- Update documentation as needed
- Prepare responses to questions
- Ensure all changes maintain code quality and pass tests

### Phase 3.3: Resolution & Verification

After addressing all items:

1. Mark all comments as resolved using the GitHub API
2. **CRITICAL: Verify that all conversations show as resolved** by running:
   ```bash
   gh api graphql -f query="..." --jq '.data.repository.pullRequest.reviewThreads | {totalCount, unresolvedCount: [.nodes[] | select(.isResolved == false)] | length}'
   ```
   The `unresolvedCount` must be 0 before proceeding.
3. Create a summary of all changes made
4. Commit the changes with a clear message
5. Push the commit to GitHub
6. Create an ultra-concise summary of the changes made, including issues marked as "will-not-fix" and issues fixed. Post it as a comment on the main PR conversation.

**This workflow is ONLY complete when:**
- All changes have been committed and pushed
- The final verification shows `unresolvedCount: 0`
- A summary comment has been posted to the PR

**If unresolvedCount is not 0, you MUST investigate which threads were missed and address them before completing.**

## Appendix 1: Using GitHub CLI Commands

Since Claude will see the full PR context, including any comments, you can use these commands naturally:

```
# View current PR with comments
gh pr view --comments

# Get repo and PR info for GraphQL queries
REPO_INFO=$(gh repo view --json owner,name)
OWNER=$(echo $REPO_INFO | jq -r '.owner.login')
REPO=$(echo $REPO_INFO | jq -r '.name')
PR_NUMBER=$(gh pr view --json number -q '.number')

# STEP 1: Get count of unresolved threads (for validation)
gh api graphql -f query="
query {
  repository(owner: \"$OWNER\", name: \"$REPO\") {
    pullRequest(number: $PR_NUMBER) {
      reviewThreads(first: 100) {
        totalCount
        nodes {
          id
          isResolved
        }
      }
    }
  }
}" --jq '.data.repository.pullRequest.reviewThreads | {totalCount, unresolvedCount: [.nodes[] | select(.isResolved == false)] | length}'

# STEP 2: Get ALL unresolved review threads with ALL comments in each thread
gh api graphql -f query="
query {
  repository(owner: \"$OWNER\", name: \"$REPO\") {
    pullRequest(number: $PR_NUMBER) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          comments(first: 50) {
            nodes {
              id
              body
              author { login }
              path
              line
              diffHunk
            }
          }
        }
      }
    }
  }
}" --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'

# STEP 3: ALWAYS verify you received the exact number of threads from Step 1
# If numbers don't match, output was truncated - use alternative fetching method

# Resolve a specific review thread by ID
gh api graphql -f query='
mutation ($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { isResolved }
  }
}' -f threadId="THREAD_ID_HERE"

# Post a comment on the PR conversation
gh pr comment 42 --body "$(cat <<EOF
Addressed comments on this PR, made the following changes:

* fixed typo in index.js
* etc...
EOF
)"
```

## Appendix 2: Hypothetical Command Outcome/Pattern

### Easy Mode: Small Issues / Nitpicks

```
You: Show me all unresolved comments in this PR.
[Claude lists 2 unresolved review comments in the same file]
You: These look easy. Let's fix them in the current context.
- You: "Add null check" in src/api/user.js:45
- You: "Typo: 'recieve' → 'receive'" in README.md: 23
You: We're ready to mark the PR feedback resolved.
```

### Difficult: Lots of comments / complex issues

```
You: Show me all unresolved comments in this PR.
[Claude lists 8 unresolved review comments across different files]
You: These look independent. Let's fix them in parallel. Spawn a sub-agent for each comment.
Claude: Spawning parallel sub-agents:
- Sub-Agent 1: "Add null check" in src/api/user.js:45
- Sub-Agent 2: "Missing error handling" in src/api/auth.js:102
- Sub-Agent 3: "Typo: 'recieve' → 'receive'" in README.md: 23
- Sub-Agent 4: "Extract magic number to constant" in src/utils/calc.js:67
[Claude coordinates parallel fixes]
You: Show me the progress.
[Sub-Agents complete processing]
You: We're ready to mark the PR feedback resolved.
```

