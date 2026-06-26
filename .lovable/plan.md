## Hide jelly roll toggle on non–Rail Fence patterns

### The bug
On Step 2, every pattern is showing the "What fabric are you using?" question with a disabled "Jelly roll — coming soon" tile. It should only appear for Rail Fence.

### The fix
In `src/pages/SizePage.tsx`, wrap the entire `<Field label="What fabric are you using?">` block (lines 409–448) in `{jellyRollEligible && ( ... )}` so it renders only when the selected pattern is Rail Fence. All other patterns return to their previous Step 2 layout with no mention of jelly roll.

No other changes — jelly-roll logic, state, and Rail Fence behavior stay exactly as-is.

### Verification
- Open any non–Rail Fence pattern → Step 2 shows no fabric-source question.
- Open Rail Fence → Step 2 still shows both Yardage and Jelly roll options.
