# Calcutta Auction Web Application — Requirements Document

**Project:** Calcutta Auction Platform  
**Stack:** React + TypeScript  
**Version:** 1.0  
**Date:** February 2026

---

## 1. Overview

This document describes the requirements for a real-time, multi-user web application for conducting Calcutta-style auctions. In a Calcutta auction, every item (e.g., a sports team) is auctioned off to the highest bidder, and the winning bidders then receive a share of the total pot based on how their item performs. The application manages the full lifecycle: auction setup by a host, live bidding visible to all participants, result tracking, and export.

---

## 2. User Roles

### 2.1 Host
There is exactly one host per auction session. The host is responsible for setup and moderation. The host:

- Creates and configures the auction before it begins
- Uploads the list of items to be auctioned
- Configures the payout structure
- Launches the auction
- Can pause/resume the auction clock at any time during live bidding
- Has all the same viewing capabilities as a regular participant once the auction is live

### 2.2 Participant
Any number of participants can join an active auction. Participants:

- Sign in with a display name and optional profile picture
- View the live auction in real time
- Place bids during active item rounds
- View all previous results, running totals, and the payout structure

---

## 3. Authentication & Session Management

### 3.1 Sign-In Flow
- On app load, users are presented with a sign-in screen.
- Users **must** enter a **display name** before proceeding. The sign-in form cannot be submitted without a non-empty display name.
- Users optionally upload a **profile picture** (JPEG/PNG, displayed as a circular avatar). If no picture is provided, a default avatar using the user's initials is shown.
- One user designates themselves as the **Host** by selecting "Create Auction." All other users join as participants by entering the session code.
- No full account system is required for v1.0 — sessions are ephemeral and tied to a shared auction room/session ID.

### 3.2 Session / Room Model
- The host generates a **session code** (e.g., a short alphanumeric string like `NFL2025`) upon creating an auction.
- Participants join by entering this session code.
- The session code should be clearly displayed to the host so they can share it.
- All users in the same session see the same real-time state.

---

## 4. Auction Setup (Host Only)

Before launching, the host configures the auction via a setup screen with the following sections:

### 4.1 Item List Upload
- The host uploads a list of items to be auctioned. Each item requires:
  - **Name** (string, required) — e.g., "Seattle Seahawks"
  - **Image** (optional) — e.g., a team logo. Accepted formats: JPEG, PNG, GIF, WebP.
- Upload mechanism: CSV/spreadsheet file upload **or** a manual add-item form (name + image picker).
- Items can be reordered, edited, or deleted before launch.
- A minimum of 1 item is required to launch.

### 4.2 Payout Structure Configuration
The host defines how the total pot will be distributed. Inspired by the reference spreadsheet format, the payout structure has two sections:

**Win Distribution (percentage of total pot)**
Each row represents a payout category. Fields per row:
- Category name (string) — e.g., "Wild Card Win", "Super Bowl Win"
- Number of winning teams/items (integer)
- Percentage of the pot awarded per winner (decimal, e.g., 0.065 = 6.5%)

**Prop Distribution (percentage of total pot)**
Same structure as Win Distribution, but for special/prop categories:
- Category name — e.g., "Most Total Yards", "Longest FG"
- Number of winners
- Percentage of pot per winner

The host can add, edit, and remove rows in both sections. The UI should display the **implied dollar amount** for each payout row, calculated as `percentage × total pot`, updating in real time as bids are placed during the auction.

A summary note can be added (e.g., "Ties split the percentage amount evenly").

### 4.3 Launch Auction
Once items and payouts are configured, the host clicks **"Launch Auction."** This transitions all connected users to the Live Auction view.

---

## 5. Live Auction View

All users (host and participants) share the same live auction screen after launch. The layout consists of:

### 5.1 Header / Global Info Bar
- Auction name / session code
- **Total pot** (running sum of all winning bids so far), updated in real time
- Link/button to view the **Payouts panel** (see §5.4)
- Link/button to view the **Results panel** (see §5.5)

### 5.2 Active Item Stage (Center)
This is the focal point of the screen during an active round.

**Before any bid is placed:**
- The current item's name and image (if provided) are displayed prominently.
- A message such as "Waiting for first bid…" is shown.
- Bid buttons are visible and enabled.

**After the first bid is placed:**
- The bidder's **display name** and **profile picture** are shown prominently.
- The **current bid amount** is displayed in large text.
- A **countdown timer** begins at **30 seconds** and counts down visually (e.g., a progress ring or bar).
- Every subsequent valid bid resets the timer to 30 seconds.

**Item transitions:**
- When the timer reaches 0, the item is awarded to the current highest bidder.
- A brief award animation/message is shown (e.g., "[Name] wins [Item] for $[Amount]!").
- After a short delay (e.g., 3 seconds), the next item round begins automatically with a new randomly selected item.

### 5.3 Bid Controls (Participants)
Located below the active item stage. Bid buttons are disabled until an item is actively up for auction.

**Denomination buttons (increments):**
- **+$1** — submits current bid + $1
- **+$5** — submits current bid + $5
- **+$10** — submits current bid + $10

These buttons add to the **current highest bid**. For example, if the current bid is $23 and a user clicks "+$5", their submitted bid is $28.

**Custom input (absolute):**
- A text input labeled "Enter bid amount" where the user types an exact dollar value.
- The submitted bid is exactly the entered amount, not an increment.
- The UI should display the current high bid prominently near the input so users know the minimum they must exceed.
- The input should validate that the entered amount is strictly greater than the current bid before submission, displaying an inline error if not (e.g., "Must be greater than current bid of $23").

> **Validation:** Only bids strictly greater than the current bid are accepted. If a user attempts to place a bid that is equal to or less than the current bid (e.g., due to a race condition), the bid is rejected silently or with a brief toast notification.

**Host-only controls:**
- A **Pause / Resume** button is visible only to the host. Pausing freezes the countdown timer. Resuming restarts it from where it was paused.
- A **Void Bid** button is visible only to the host during an active round. Clicking it opens a confirmation dialog ("Are you sure you want to void the current bid?"). Upon confirmation:
  - The current bid is removed.
  - The previous bid (if one exists) is restored as the current bid and bidder.
  - If no previous bid exists, the round resets to its pre-bid state (waiting for first bid, timer not running).
  - All connected clients are notified immediately.
  - A log entry is recorded in the results noting that a bid was voided by the host.

### 5.4 Payouts Panel
Accessible from the header. Displays the full payout structure configured during setup:

- Win Distribution table: Category | # Teams | % of Pot | Implied Amount
- Prop Distribution table: Category | # Teams | % of Pot | Implied Amount
- Implied amounts update in real time as the pot grows.
- Any notes added during setup (e.g., tie-splitting rules) appear below the tables.

### 5.5 Results Panel
Accessible from the header (and expanded at auction end). Shows a running record of all completed item rounds:

**Items Summary Table** (mirrors the reference spreadsheet):

| Item Name | Sale Price | Owner | Pot % | Gross Earnings | Net Earnings | Categories Won |
|-----------|------------|-------|-------|----------------|--------------|----------------|

- **Sale Price:** The winning bid.
- **Owner:** The winner's display name.
- **Pot %:** `Sale Price / Total Pot` (updates as pot grows).
- **Gross Earnings:** Editable field — the host (and optionally participants) can fill in earnings after the real-world event concludes. (For v1.0, this can be manually entered post-auction.)
- **Net Earnings:** `Gross Earnings - Sale Price` (calculated automatically).
- **Categories Won:** Free-text field for the host to note which payout categories the item's team won (e.g., "Wild Card, Division").

**Per-Participant Summary Table:**

| Paid? | Name | $ Spent | % of Pot | Items Won | Gross Earnings | Net Earnings |
|-------|------|---------|----------|-----------|----------------|--------------|

All monetary totals are shown at the bottom of each table.

---

## 6. Auction End State

When the final item has been auctioned:

- An **"Auction Has Concluded"** banner is displayed to all users.
- The **Results Panel** is automatically expanded to full-screen / primary view.
- The **Active Item Stage** is hidden.
- Bid controls are disabled.
- The host sees a **"Download Results"** button (see §7).

---

## 7. Export / Download

The host can download the final auction results as a **Google Sheets-compatible spreadsheet** (`.xlsx` format, which can be imported directly into Google Sheets).

### 7.1 Spreadsheet Format
The output should mirror the structure of the `2025_NFL_Calcutta.xlsx` reference file:

**Row 1 (Header):**
- Column B: Payment/Venmo info (editable metadata — optionally configurable during setup)
- Column C: Auction title
- Column F: "Pot" label
- Column G: Formula referencing the total from the items table

**Rows 2–N (Item Rows):**
- Column B: Item name (with seed/number if applicable)
- Column C: Sale price (winning bid)
- Column D: Owner (winner display name)
- Column E: Pot % formula (`=C_n / $C$Total`)
- Column F: Gross Earnings (filled in manually post-event)
- Column G: Net Earnings formula (`=F_n - C_n`)
- Column H: Categories Won

**Total Row:**
- Sums for Columns C, E, F, G

**Per-Participant Summary Block:**
- Columns: Paid? | Name | $ Spent (SUMIF) | % of Pot | Items (comma-separated) | Gross Earnings (SUMIF) | Net Earnings
- One row per participant
- Total row at bottom

**Win Distribution Block:**
- Label row: "Win Distribution (X%)"
- Header row: | Category | # Teams | Amount for Win | Implied $ | Winner(s) |
- One row per payout category

**Prop Distribution Block:**
- Same structure as Win Distribution

**Game Results Block (optional):**
- If the host entered any game/match results during or after the auction, a game-by-game breakdown table is included (matching the structure of the reference spreadsheet's lower section).

### 7.2 Formula Requirements
Where possible, the exported spreadsheet should use Excel/Google Sheets formulas (not hard-coded values) for:
- Pot % per item
- Net Earnings per item
- $ Spent per participant (SUMIF on owner column)
- Gross Earnings per participant (SUMIF)
- Net Earnings per participant
- Implied dollar amounts for payout categories

---

## 8. Real-Time Architecture Requirements

### 8.1 State Synchronization
All auction state must be synchronized across all connected clients in real time with minimal latency. The following events must propagate immediately to all users:
- New bid placed (bidder name, avatar, amount)
- Countdown timer tick
- Timer pause/resume
- Item awarded (winner announced)
- Next item started

### 8.2 Recommended Approach
- Use **Firebase** (Firestore + Firebase Realtime Database or Firestore listeners) as the backend. Firebase was chosen for its minimal setup, free tier generosity for small group use, built-in real-time sync, and no requirement to manage a server.
  - **Firestore** for persistent auction config, item list, and results
  - **Firestore real-time listeners** for live bid state and timer synchronization
  - **Firebase Hosting** for deploying the React app
- The Firestore document for the active round is the authoritative source of truth for:
  - Current item
  - Current highest bid and bidder
  - Timer state
  - Auction phase (setup / active / paused / complete)
- Clients should not trust locally computed timer values for determining auction outcomes — the server resolves bid acceptance and item award via Firestore security rules and Cloud Functions (or client-side with server timestamps).

### 8.3 Bid Conflict Resolution
- All bids are sent to the server for validation.
- The server accepts only the first valid bid above the current price in the event of simultaneous submissions.
- Rejected bids result in a non-intrusive client notification (e.g., toast: "Your bid was too low — current bid is now $X").

---

## 9. UI / UX Requirements

### 9.1 General
- The application must be fully responsive (desktop-primary, mobile-friendly).
- All state changes (new bid, timer, item transitions) should have smooth visual transitions/animations to create an engaging live auction feel.
- Color scheme and branding should be configurable (at minimum, a dark mode and light mode option).

### 9.2 Accessibility
- All interactive elements must be keyboard accessible.
- Color contrast must meet WCAG AA standards.
- Timer countdown should include both a numeric display and a visual indicator (progress bar or ring).

### 9.3 Notifications
- When a new bid is placed by another user, a brief visual highlight or toast should draw attention to the updated bid.
- When the timer drops below 10 seconds, the timer should change color (e.g., red) and/or pulse to create urgency.

---

## 10. Data Model (Reference)

```typescript
// Core entities

interface AuctionItem {
  id: string;
  name: string;
  imageUrl?: string;
  seed?: number; // optional ordering/seed number
}

interface PayoutCategory {
  id: string;
  name: string;
  type: 'win' | 'prop';
  numWinners: number;
  percentageOfPot: number; // e.g., 0.065
}

interface AuctionConfig {
  id: string;
  title: string;
  sessionCode: string;
  items: AuctionItem[];
  payouts: PayoutCategory[];
  notes?: string;
}

interface Participant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isHost: boolean;
}

interface Bid {
  participantId: string;
  participantName: string;
  amount: number;
  timestamp: number;
  voided?: boolean; // set to true if host voids this bid
}

interface ItemRoundResult {
  item: AuctionItem;
  winnerId: string;
  winnerName: string;
  salePrice: number;
  categoriesWon?: string; // comma-separated, filled in post-auction
  grossEarnings?: number; // filled in post-auction
}

interface AuctionState {
  phase: 'setup' | 'active' | 'paused' | 'complete';
  currentItem?: AuctionItem;
  currentBid: number;
  currentBidderId?: string;
  currentBidderName?: string;
  timerSeconds: number; // 0-30
  timerRunning: boolean;
  bidHistory: Bid[]; // full ordered history for current round; used for void/rollback
  remainingItems: AuctionItem[];
  results: ItemRoundResult[];
  totalPot: number;
}
```

---

## 11. Out of Scope (v1.0)

The following features are explicitly out of scope for the initial version:

- Persistent user accounts / authentication (OAuth, email/password)
- Real money payment processing or integration (Venmo, etc.)
- Automated payout calculation based on real-world event results (e.g., live sports data feed)
- Admin dashboard for managing multiple simultaneous auctions
- In-auction chat or messaging
- Mobile native app (iOS/Android)

---

## 12. Reference Spreadsheet Structure Summary

For developer reference, the `2025_NFL_Calcutta.xlsx` file has the following layout in a single sheet:

- **Rows 1–18:** Item table (14 teams + header + total row) with columns: Item Name, Sale Price, Owner, Pot %, Gross Earnings, Net Earnings, Categories Won
- **Rows 20–30:** Per-participant summary table with SUMIF formulas
- **Rows 32–45:** Win and Prop distribution payout tables with implied dollar amounts
- **Rows 47+:** Game-by-game results table (Closing Spread, Result, Spread Difference, Point Differential, Total Yards, FG)

The export feature (§7) must reproduce this structure faithfully, substituting the auction's actual data.

---

*End of Requirements Document — v1.0*
