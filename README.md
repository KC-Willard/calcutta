# Calcutta Auction Web Application

A real-time, multi-user web application for conducting Calcutta-style auctions. Built with React, TypeScript, and Firebase.

## What is a Calcutta Auction?

In a Calcutta auction, every item (e.g., a sports team) is auctioned off to the highest bidder. Winning bidders then receive a share of the total pot based on how their item performs in an event (e.g., sports playoffs).

## Features

✅ **Host Setup** - Create and configure auctions with items and payouts
✅ **Live Bidding** - Real-time bidding with 30-second countdown timer per item  
✅ **Participant Controls** - Quick bid buttons and custom bid input
✅ **Host Controls** - Pause/resume timer and void current bid
✅ **Results & Analytics** - Item results, per-participant summary, Excel export
✅ **Real-Time Sync** - Firebase Firestore for instant updates across all clients

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI**: Material-UI (MUI)
- **Backend**: Firebase Firestore
- **Build**: Vite
- **Export**: XLSX library

## Quick Start

1. **Install**: `npm install`
2. **Firebase Setup**: Add your Firebase credentials to `src/services/firebaseService.ts`
3. **Run**: `npm run dev`
4. **Build**: `npm run build`

## Project Structure

```
src/
├── components/        # React UI components
├── services/         # Firebase integration
├── types/           # TypeScript definitions
├── utils/           # Helper functions
├── App.tsx          # Main component
└── main.tsx         # Entry point
```

## Usage

**For Hosts**:
1. Create auction with items and payout structure
2. Share session code with participants
3. Manage live bidding and pause/void controls
4. Download results as Excel spreadsheet

**For Participants**:
1. Join with session code
2. Place bids with quick buttons or custom amounts
3. View real-time updates and final results

## Key Capabilities

- 30-second countdown timer per item (resets with each bid)
- Bid validation (must exceed current bid)
- Host pause/resume and bid voidance
- Live participant tracking
- Results editing and Excel export
- Responsive mobile-friendly design

## Firebase Configuration

Update `src/services/firebaseService.ts` with your Firebase project credentials:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... other credentials
};
```

Set Firestore security rules to allow anonymous access for v1.0 testing.

## Requirements

- Node.js 16+
- Firebase account (free tier supported)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## License

MIT

For detailed requirements, see `reqs/calcutta-auction-requirements.md`
