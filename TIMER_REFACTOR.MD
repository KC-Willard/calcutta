# Auction Timer Refactor

## Summary
Refactored the auction countdown timer from an auto-starting 30-second timer to a host-controlled 10-second countdown triggered manually.

---

## Changes Made

### State Management
- **Removed:** `state.timerRunning` dependency from timer effect
- **Added:** `countdownActive` state to track if countdown is running
- **Why:** Separates server-side "bidding window" state from client-side "final countdown" logic, giving the host manual control

### Timer Logic
- **Removed:** Auto-starting countdown on component load
- **Added:** Countdown only starts when `countdownActive === true`
- **Why:** Bidders get more time, and the host decides when to trigger the final warning

### Timer Duration & Display
- **Changed:** 30 seconds → 10 seconds
- **Changed:** Color threshold from `< 10` to `< 4` seconds (red when critical)
- **Changed:** Display shows "—s" when inactive (not counting down)
- **Why:** Creates more dramatic final countdown and clearer visual feedback

### Host Controls
- **Changed:** Pause/Resume button → "Start 10s Countdown" button
- **Added:** `handleStartCountdown()` - requires active bid before starting
- **Added:** `handleStopCountdown()` - allows host to cancel countdown early
- **Why:** Explicit, intentional control instead of automatic behavior

---

## Benefits

### User Experience
✅ Host controls when bidding round ends  
✅ Bidders have unlimited time to bid (no auto-timer)  
✅ 10-second countdown builds suspense  
✅ Clear visual indicator of bidding status  

### Code Architecture
✅ Separation of concerns (pause/resume vs countdown)  
✅ Client-controlled state instead of server-dependent  
✅ Simpler, more maintainable timer logic  

### Business Logic
✅ Prevents accidental countdown triggers (requires active bid)  
✅ More engaging auction experience  
✅ Host has full control over pacing  

---

## Key Concept: Local vs Server State

| Aspect | Before | After |
|--------|--------|-------|
| **Controls timing?** | Server (`state.timerRunning`) | Component (`countdownActive`) |
| **Timer starts?** | Automatically | Manually (host button click) |
| **Duration** | 30 seconds (fixed) | 10 seconds (final warning) |
| **Flexibility** | Low (server-bound) | High (client-controlled) |

**Pattern:** Moving logic from server-controlled → client-controlled for more interactive, responsive UI.