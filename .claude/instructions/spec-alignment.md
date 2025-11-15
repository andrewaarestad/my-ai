# Project Specification Alignment Guide

## Overview

The project specification is the source of truth for the vision, architecture, and feature set of My AI. All development work must align with this specification to ensure consistency and coherence across the platform.

## Location

The project specification is located at: **`docs/project-spec.md`**

## When to Review the Spec

You **MUST** review the project specification in the following situations:

1. **Before planning any new feature or significant task**
   - Read the relevant sections of the spec
   - Ensure your planned approach aligns with the architecture
   - Verify the feature fits within the product vision

2. **When implementing functionality**
   - Check that implementation details match the specified architecture
   - Use the recommended technology stack where applicable
   - Follow the user stories and capabilities outlined in the spec

3. **When refactoring or restructuring code**
   - Ensure changes move the codebase closer to the spec architecture
   - Don't introduce patterns that conflict with the spec

4. **When reviewing existing code**
   - Identify any misalignments with the spec
   - Report discrepancies to the user

## Detecting Misalignment

When working in the codebase, actively look for:

- **Architectural differences**: Implementation doesn't match the system architecture described in the spec
- **Missing components**: Required system components from the spec haven't been implemented
- **Technology stack deviations**: Different technologies used than those specified
- **Feature gaps**: Core capabilities or user stories not yet implemented (expected in early development)
- **Conflicting patterns**: Code patterns that contradict the spec's design principles

## Reporting Misalignment

When you detect misalignment between the implementation and the spec, you **MUST**:

1. **Report the finding to the user immediately**
   - Clearly describe what you found
   - Explain how it differs from the spec
   - Provide specific file/line references

2. **Analyze the situation**
   - Is this a temporary state during active development?
   - Is the spec outdated and the code represents a better approach?
   - Is the code incorrect and needs to be updated?
   - Are both partially correct and need reconciliation?

3. **Propose a resolution plan**
   - **Option A**: Update the code to match the spec
   - **Option B**: Update the spec to reflect the current (better) implementation
   - **Option C**: Update both to align on a new approach
   - Recommend which option you think is best and why

4. **Wait for user direction**
   - Don't proceed with changes until the user decides
   - The user may have context you don't have

## Example Report Format

```
⚠️ SPEC ALIGNMENT ISSUE DETECTED

Location: apps/web/src/services/auth.ts:45-67

Issue: The authentication service is using JWT tokens stored in localStorage,
but the spec (docs/project-spec.md - OAuth & Authentication section) specifies
using OAuth 2.0 with server-side session management.

Impact: This creates a security vulnerability and doesn't align with the
specified architecture for third-party OAuth integrations.

Proposed Resolution:
Option A (Recommended): Refactor auth service to use OAuth 2.0 flows with
server-side session management as specified in the spec.

Option B: Update the spec to document the current JWT approach, but this
would require re-architecting the third-party integration strategy.

Please advise on how you'd like to proceed.
```

## Planning with the Spec

When planning tasks:

1. **Read relevant spec sections** before creating your plan
2. **Reference the spec** in your todo items or plan description
3. **Call out spec alignment** as a criterion for task completion
4. **Identify spec gaps** if you discover the spec is incomplete for your task

## Evolving the Spec

The spec is a living document. If you notice:

- **Missing details**: Suggest additions to the spec
- **Outdated information**: Recommend updates
- **Ambiguities**: Ask for clarification from the user
- **New requirements**: Suggest how they should be incorporated

Always propose spec changes to the user rather than making assumptions.

## Best Practices

- **Don't assume the spec is wrong** - verify before suggesting changes
- **Don't assume the code is wrong** - there may be good reasons for deviations
- **Do communicate misalignments** - transparency helps maintain consistency
- **Do propose solutions** - but let the user decide
- **Do keep the spec in mind** - it represents the long-term vision

## References

- Project Specification: `docs/project-spec.md`
- README: `README.md` (should align with spec)
- Contributing Guide: `CONTRIBUTING.md` (should align with spec)
