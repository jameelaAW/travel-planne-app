## Draftable Actions (low risk — auto)
- Suggest budget allocation across 6 categories for a new trip → drafts values, user confirms
- Tag / categorize an uncategorized expense → drafts a category, user confirms
- Summarize trip budget status → informational only

## Executable After Approval (medium risk)
- Auto-fill default category allocations using suggested split → user clicks "Apply suggestions"
- Update category allocated amounts in bulk from a suggested plan

## Human-Only Actions (high / critical risk)
- Delete a trip (critical — data loss)
- Delete all expenses in a category (high)
- Change total budget (high — affects all allocations)

## Named Tools
- `suggest_allocation(trip_id)` → returns JSON allocation plan
- `categorize_expense(expense_id)` → returns category_type
- `apply_suggested_allocations(trip_id, plan)` → writes to categories (after approval)

## Audit Log Fields
`action_type` · `actor` (user / agent) · `entity_type` · `entity_id` · `before_state` · `after_state` · `timestamp` · `approved_by`

## v1 vs Later
- **v1:** No agentic actions (rule-based scoring only)
- **Later:** Suggest allocation (low, auto) · Categorize expense (low, auto) · Apply plan (medium, approval) · Delete guard (critical, human-only)