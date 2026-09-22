# Travel Planner — Product Requirements

## Problem
Travel planners overspend because they can't see whether planned expenses across categories (flights, lodging, food, local travel, shopping) fit within their total budget. Spreadsheets are manual and error-prone.

## Target User
Anyone planning a vacation or work trip who wants to avoid overspending on unnecessary items.

## Core Objects
- **Trip** — title, destination, dates, total budget, currency
- **Budget Category** — one of: air, land travel, local travel, food, lodging, shopping; with an allocated amount
- **Planned Expense** — a line item under a category with an amount, estimated flag, notes

## MVP (v1) Checklist
- [ ] Create / edit / delete a trip with a total budget
- [ ] Auto-generate 6 default budget categories per trip (air, land travel, local travel, food, lodging, shopping)
- [ ] Allocate a budget amount to each category; remaining / over budget shown live
- [ ] Add / edit / delete planned expenses under any category
- [ ] See category spend vs allocation and total spend vs total budget
- [ ] All screens render without a login wall (seed demo trips)
- [ ] Handles empty, error, and loading states

## Non-Goals (v1)
- No user accounts or login
- No shared / multi-user trip planning
- No real-time currency conversion
- No booking integration
- No AI auto-allocation (later phase)
- No itinerary scheduling

## Success Criteria
A user opens the app, creates a trip "Tokyo 7 Days" with a $3,500 budget, sees 6 categories pre-filled, allocates $1,200 to Air Tickets, adds a $1,150 flight expense, and immediately sees $50 remaining in that category and $2,350 remaining overall — confirming the plan fits the budget before spending a dollar.