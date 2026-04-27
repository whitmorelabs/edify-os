---
name: process-doc
description: Document business processes as complete standard operating procedures (SOPs), including flowcharts, RACI matrices, and detailed steps. Use when writing a new SOP, formalizing an existing informal process, assigning ownership via a RACI matrix, mapping a workflow end-to-end, or creating onboarding documentation for a program.
argument-hint: "<process name or description>"
---

# /process-doc

> If you see unfamiliar placeholders or need to check which tools are connected, see [CONNECTORS.md](../../CONNECTORS.md).

Document a business process as a complete, formal SOP. Start from any level of description — rough notes are fine — and produce a structured document ready for publishing.

## Usage

```
/process-doc $ARGUMENTS
```

## Workflow

### 1. Gather Process Information

Ask the user for:
- **Process name and purpose** — what does this process accomplish?
- **Trigger** — what starts this process?
- **Roles involved** — who participates? Who owns it?
- **Key steps** — what happens, in what order?
- **Exceptions and edge cases** — what can go wrong? How is it handled?
- **Outputs** — what does the process produce?
- **Performance metrics** — how do you know it's working?

If the user provides rough notes, extract the above from them and confirm your interpretation before proceeding.

### 2. Build the RACI Matrix

For each step and each role, assign:
- **R** — Responsible (does the work)
- **A** — Accountable (owns the outcome)
- **C** — Consulted (provides input)
- **I** — Informed (kept in the loop)

Ensure every step has exactly one Accountable owner.

### 3. Draft the SOP

Produce the complete SOP using the output structure below.

## Output

```markdown
## SOP: [Process Name]
**Version:** 1.0 | **Owner:** [Role] | **Last Updated:** [Date]

### Purpose
[1-2 sentences: what this process accomplishes and why it matters]

### Scope
**In scope:** [what this process covers]
**Out of scope:** [what it does not cover]

### Roles and Definitions
| Role | Description |
|------|-------------|
| [Role] | [What they do in this process] |

### RACI Matrix
| Step | [Role 1] | [Role 2] | [Role 3] |
|------|----------|----------|----------|
| [Step name] | R | A | I |

### Process Flow (ASCII)
```
[Trigger] → [Step 1] → [Step 2] → [Decision?]
                                      ↓ Yes       ↓ No
                                   [Step 3A]   [Step 3B]
                                      ↓
                                   [Output]
```

### Detailed Steps
**Step 1: [Name]**
- **Trigger:** [What initiates this step]
- **Action:** [What happens]
- **Output:** [What this step produces]
- **Owner:** [Role]

[Repeat for each step]

### Exceptions and Edge Cases
| Scenario | How to Handle | Escalation Path |
|----------|--------------|-----------------|
| [Exception] | [Response] | [Who to escalate to] |

### Performance Metrics
| Metric | Target | Measurement Method |
|--------|--------|--------------------|
| [KPI] | [Goal] | [How measured] |

### Related Documents
- [Link or reference to related SOPs, templates, or policies]
```

## If Connectors Available

If **knowledge base** (Notion, Confluence, Guru, etc.) is connected:
- Search for existing documentation on this process before drafting
- Publish the completed SOP to the appropriate wiki or knowledge base section

If **project tracker** is connected:
- Link the process to relevant projects
- Create action items for process gaps or improvement opportunities identified during documentation

## Tips

1. **Start messy, finish clean** — Accept rough input; the skill's job is to formalize it.
2. **Nail the RACI first** — Ownership ambiguity is the most common process failure point. Resolve it explicitly.
3. **Document exceptions** — The edge cases are where the process breaks. Don't skip them.
4. **Keep steps atomic** — Each step should have one owner and one clear output.
