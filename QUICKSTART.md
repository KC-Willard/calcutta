# Quick Start - Calcutta Auction Application

## 5-Minute Setup

### Prerequisites
- Node.js 16+ installed
- Firebase account (free)

### Step 1: Install Dependencies (2 min)
```bash
cd c:\development\calcutta
npm install
```

### Step 2: Set Up Firebase (3 min)

1. Go to https://firebase.google.com/
2. Sign in with Google account
3. Click "Go to console"
4. Click "Create a project"
5. Enter "calcutta-auction" as project name
6. Accept terms and create
7. In the left menu, click "Firestore Database"
8. Click "Create Database" → "Start in test mode" → "Create"
9. Click the gear icon → "Project Settings"
10. Scroll down to "Your apps" → Click the web icon (</>) 
11. Follow the setup (no need to install anything)
12. Copy your config object

### Step 3: Add Firebase Credentials

Open `src/services/firebaseService.ts` and replace this section:
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyReplaceMeWithActualConfig",
  authDomain: "calcutta-auction.firebaseapp.com",
  projectId: "calcutta-auction",
  storageBucket: "calcutta-auction.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

With **your actual Firebase credentials** from step 12.

### Step 4: Update Firestore Rules

1. Go back to Firebase Console
2. Click "Firestore Database" → "Rules"
3. Replace all text with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /auctions/{auctionId} {
      allow read, write: if request.auth == null;
      match /state/current {
        allow read, write: if request.auth == null;
      }
      match /participants/{participantId} {
        allow read, write: if request.auth == null;
      }
      match /results/{resultId} {
        allow read, write: if request.auth == null;
      }
    }
  }
}
```
4. Click "Publish"

### Step 5: Run the App
```bash
npm run dev
```

The app opens automatically at `http://localhost:3000`

---

## Using the Application

### Create an Auction (Host)

1. Click **"Create Auction (Host)"**
2. Enter your name
3. Click "Create"
4. Enter auction title (e.g., "2026 NFL Calcutta")
5. Click "Add Item" and add teams/items
6. Click "Add Payout" to set up Win/Prop distributions
7. Click "Launch Auction"
8. Share the session code with participants

### Join an Auction (Participant)

1. Click **"Join Auction (Participant)"**
2. Enter your name
3. Enter the session code from host
4. Click "Join"
5. Place bids using +$1, +$5, +$10 buttons or custom amount
6. Watch real-time updates

### During Auction (Host)

- **Pause/Resume**: Freeze countdown timer
- **Void Bid**: Remove current bid and revert to previous
- **View Payouts**: See distribution with implied amounts
- **View Results**: See current sale prices and winners

### After Auction

- Download results as Excel file
- Edit gross earnings for each item
- Track per-participant earnings

---

## Project Structure

```
All source code is in: src/
- App.tsx              Main component
- components/          UI screens  
- services/           Firebase backend
- types/              Type definitions
- utils/              Helpers & export
```

## Available Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase is not defined" | Check firebaseService.ts has correct credentials |
| Bids not saving | Verify Firestore rules are published |
| "Cannot find module" | Run `npm install` again |
| Port 3000 in use | Run on different port: Change vite.config.ts |

---

## What's Included

✅ Real-time bidding with 30-second timer  
✅ Multiple participants support  
✅ Host auction management controls  
✅ Results tracking and analytics  
✅ Excel export with formulas  
✅ Responsive mobile design  
✅ Profile avatars with initials  
✅ Bid validation and history  

---

## Next Steps

1. **Customize** - Update colors/branding in App.tsx
2. **Test** - Create multiple browsers/windows to test multi-user
3. **Deploy** - Build with `npm run build` for production
4. **Extend** - Add more features from requirements document

---

**Questions?** Check:
- `README.md` - Full documentation
- `SETUP.md` - Detailed setup guide
- `reqs/calcutta-auction-requirements.md` - Complete requirements

Enjoy your Calcutta Auction! 🎉
