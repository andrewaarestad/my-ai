# Fix issues with PR checks for the current branch

This workflow is meant to fix issues that are preventing the current branch from passing PR checks.

## Phase 0: Fetching

* Using the GitHub CLI, or GitHub GraphQL API, fetch the PR checks status
* For each failing check, read the logs to find the error message

## Phase 1: Planning

* Using the error message and surrounding context, determine the root cause of the issue and find a solution
* Looking at all of the error messages in sum, make a high-level implementation plan that will ensure that all of the issues with the PR checks will be resolved.

This plan should address any and all issues that arise in the PR check. After this plan is complete, we fully expect the ENTIRE set of PR checks to pass.

## Phase 2: User Feedback

Present a plan to the user for how to address the issues. If the user gives feedback, adjust your plan accordingly and present it again. Do not proceed with Phase 3 until the user approves the plan.

## Phase 3: Implementation

Fix each issue in the PR checks. 

## Phase 4: Test

Test the codebase thoroughly by running the entire set of PR checks locally. You should be able to catch and fix any errors that would happen in GitHub other than those due to environment differences.

Iteratively test and fix until the tests all pass.

## Phase 5: Clean-up

Once all tests are passing, run the lint-fix tool and commit the changes. Push the commit to the branch.

## Phase 6+: Monitor

Ask the user if they would like you to monitor the PR.  If they do, then proceed with the following algorithm:

1. Set a sleep timer for 30 seconds
2. Check the status of the PR checks
3. If they are still running, go back to step 1
4. If they are complete and passing, this workflow is finished.
5. If they are complete and failing, repeat this workflow from Step 1.