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

Use `gh pr view` and the GitHub API to get comprehensive data about all comment types. 
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

1. Mark all review threads as resolved using the GitHub API
2. Verify that all conversations show as resolved
3. Create a summary of all changes made
4. Commit the changes with a clear message
5. Push the commit to GitHub

This workflow is complete when the changes have been committed and pushed.

## Appendix 1: Using GitHub CLI Commands

Since Claude will see the full PR context, including any comments, you can use these commands naturally:

```
# View current PR with comments
gh pr view -comments

# Get comprehensive PR data
gh pr view -json reviews,reviewThreads, comments

# Use GraphQL for review thread status
gh api graphql -f query='
    query($owner: String!, $repo: String!, $pr: Int!) {
        repository (owner: $owner, name: $repo) {
            pullRequest (number: $pr) {
                reviewThreads (first: 100) {
                    nodes {
                        id 
                        isResolved
                        comments (first: 50) {
                            nodes {
                                body
                                author { login }
                            }
                        }
                    }
                }
            }
        }
    }
'

# Use GraphQL API to Resolve review threads
gh api graphql -f query='
    mutation ($threadId: ID!) {
        resolveReviewThread(input: {threadId: $threadId}) {
            thread { isResolved }
        }
    }
'
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

