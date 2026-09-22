## Messy Inputs
- Free-text trip description: "Going to Tokyo for a week, budget around $3500"
- Lump-sum expense: "Spent $500 on food and transport"
- Unstructured notes on expenses

## Auto-Structure Schema
```json
{
  "title": "Tokyo Trip",
  "destination": "Tokyo, Japan",
  "total_budget": 3500,
  "currency": "USD",
  "duration_days": 7,
  "suggested_allocations": [
    {"category_type": "air", "allocated_amount": 1200, "confidence": 0.85},
    {"category_type": "lodging", "allocated_amount": 800, "confidence": 0.80},
    {"category_type": "food", "allocated_amount": 500, "confidence": 0.75},
    {"category_type": "local_travel", "allocated_amount": 150, "confidence": 0.60},
    {"category_type": "land_travel", "allocated_amount": 200, "confidence": 0.50},
    {"category_type": "shopping", "allocated_amount": 650, "confidence": 0.40}
  ]
}
```

## Events to Track
- `trip_created`, `category_allocated`, `expense_added`, `budget_exceeded`, `allocation_changed`

## Scoring Rules (rule-based, v1)
- **Budget Fit Score** = 100 − (overspent_categories / total_categories × 100)
- **Allocation Balance** = std-dev of category percentages; lower = more balanced
- Score ≥ 80 = green · 60–79 = yellow · < 60 = red

## What Gets Ranked
- Categories by spend vs allocation (most over-budget first)
- Expenses by amount (largest first for review)

## v1 vs Later
- **v1:** Rule-based budget fit score, live overspend detection, category ranking
- **Later:** AI-suggested allocations from free-text description, expense auto-categorization, historical trip comparison