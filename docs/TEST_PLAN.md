## v1 Success Scenario
1. Open app → see 2 seeded demo trips (Japan, Bali) on homepage. No login wall.
2. Click "New Trip" → enter "Tokyo 7 Days", destination "Tokyo, Japan", budget $3,500 → save.
3. Trip detail loads → see 6 categories pre-filled with $0 allocation.
4. Allocate $1,200 to Air Tickets → budget bar updates (allocated: $1,200, remaining: $2,300).
5. Add expense "Round-trip flight" under Air Tickets, amount $1,150 → category shows $50 remaining (green).
6. Add expense "Extra legroom upgrade" $100 → category shows −$50 (red, overspent).
7. Delete the legroom expense → category back to $50 remaining.
8. Go to overview → total spend $1,150, remaining $2,350, budget fit score shown.

## Empty State
- Delete all trips → see "No trips yet. Create your first trip." with a CTA button.
- Open a category with no expenses → see "No expenses planned yet."

## Error State
- Disconnect network, try to save a trip → see "Could not save. Check your connection and retry."
- Enter negative budget → form blocks submit, shows "Budget must be a positive number."
- Enter non-numeric expense amount → field shows error, save disabled.

## Loading State
- Trip list shows skeleton cards while fetching.
- Category list shows skeleton rows while fetching.

## Edge Cases
- Total budget $0 → all categories show $0 allocation, no overspend possible.
- Expense exceeds category allocation → category turns red, total budget bar reflects overflow.
- Delete a category with expenses → expenses remain (category_id set null), shown as "Uncategorized."