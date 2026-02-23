# Calcutta Auction - Setup & Installation Guide

## Project Status ✅

The Calcutta Auction web application has been fully built according to the requirements. All components, services, and utilities are in place and ready to use.

## What's Included

### Components ✅
- [x] SignIn - Multi-step sign-in with display name and optional profile picture
- [x] Setup - Host configuration for items and payout structure
- [x] Auction - Live bidding interface with 30-second timer
- [x] Results - Results viewing and Excel export

### Services ✅
- [x] Firebase Firestore integration for real-time sync
- [x] Auction lifecycle management
- [x] Bid placement and validation
- [x] Participant tracking
- [x] Results export

### Utilities ✅
- [x] Excel export with formulas
- [x] Currency and percentage formatting
- [x] Avatar generation with initials
- [x] Helper functions

### Features ✅
- [x] Real-time bidding with 30-second timer per item
- [x] Quick bid buttons (+$1, +$5, +$10) and custom input
- [x] Host pause/resume and bid void controls
- [x] Bid validation and conflict resolution
- [x] Live participant list
- [x] Results table with item sale prices and owners
- [x] Per-participant earnings summary
- [x] Payout distribution with implied amounts
- [x] Excel spreadsheet export
- [x] Responsive mobile-friendly design

## Installation Steps

### 1. Install Node Dependencies

```bash
cd c:\development\calcutta
npm install
```

This installs all required packages:
- React 18 + TypeScript
- Material-UI for UI components
- Firebase SDK
- Vite build tool
- XLSX for Excel export

### 2. Set Up Firebase Project

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Create a new project"
   - Enter project name (e.g., "calcutta-auction")
   - Click "Create Project"

2. **Enable Firestore Database**
   - In Firebase Console, go to "Firestore Database"
   - Click "Create Database"
   - Choose "Start in test mode"
   - Select your preferred location
   - Click "Create"

3. **Get Firebase Credentials**
   - In Firebase Console, click the gear icon (settings)
   - Select "Project settings"
   - Scroll to "Your apps" section
   - Click "Web" to create a web app
   - Copy the Firebase config object

4. **Update Firebase Configuration**
   - Open `src/services/firebaseService.ts`
   - Replace the `firebaseConfig` object with your credentials:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY_HERE",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```

### 3. Configure Firestore Security Rules

1. In Firebase Console, go to "Firestore Database" → "Rules"
2. Replace the default rules with:
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
3. Click "Publish"

**Note**: These rules allow anonymous access for v1.0. For production, implement proper authentication.

### 4. Run the Application

**Development Mode**
```bash
npm run dev
```

The app will automatically open at `http://localhost:3000`

**Production Build**
```bash
npm run build
```

## Project File Structure

```
calcutta/
├── index.html
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # React entry point
│   ├── index.css        # Global styles
│   ├── components/
│   │   ├── SignIn/      # Sign-in screen
│   │   ├── Setup/       # Auction setup (host only)
│   │   ├── Auction/     # Live auction interface
│   │   └── Results/     # Results and analytics
│   ├── services/
│   │   └── firebaseService.ts    # Firebase backend integration
│   ├── types/
│   │   └── index.ts     # TypeScript type definitions
│   └── utils/
│       └── helpers.ts   # Utility functions
└── reqs/
    └── calcutta-auction-requirements.md  # Full requirements document
```

## Testing the Application

### Test as Host

1. Open app in browser
2. Click "Create Auction (Host)"
3. Enter display name (e.g., "Auction Master")
4. Click "Create"
5. Enter auction title (e.g., "2026 NFL Calcutta")
6. Add items:
   - Click "Add Item"
   - Enter item name (e.g., "Kansas City Chiefs")
   - Optionally upload team logo
   - Click "Save"
   - Repeat for multiple items
7. Add payouts:
   - Click "Add Payout"
   - Set type (Win or Prop)
   - Enter category (e.g., "Super Bowl Winner")
   - Set # winners and percentage
   - Click "Save"
8. Click "Launch Auction"
9. Try bidding and other host controls

### Test as Participant

1. Open app in new window/tab (or different browser)
2. Click "Join Auction (Participant)"
3. Enter display name
4. Enter session code (shown in host's window)
5. Click "Join"
6. Try placing bids
7. Watch real-time updates as host bids

## Key URLs and Configurations

- **Development Server**: http://localhost:3000
- **Build Output**: dist/
- **Firebase Console**: https://console.firebase.google.com
- **Firestore**: Real-time database for auction state
- **Vite Config**: vite.config.ts (port 3000, auto-open)

## Environment Setup Summary

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 16+ | JavaScript runtime |
| React | 18.3.1 | UI framework |
| TypeScript | 5.3.3 | Type safety |
| Vite | 5.0.10 | Build tool |
| Firebase | 10.6.0 | Backend & real-time DB |
| Material-UI | 5.14.13 | UI components |
| XLSX | 0.18.5 | Excel export |

## Troubleshooting Setup

### npm install fails
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -r node_modules`
- Try install again: `npm install`

### Firebase Credentials Error
- Verify Firebase config in `src/services/firebaseService.ts`
- Check project ID matches your Firebase project
- Ensure all quotes and commas are correct

### Port 3000 Already in Use
- Change port in `vite.config.ts`: `port: 3001`
- Or kill process on 3000: `lsof -ti:3000 | xargs kill`

### Firestore Not Syncing
- Check browser console (F12) for errors
- Verify Firestore security rules are published
- Try hard refresh: `Ctrl+Shift+R` (Windows)

### Module Not Found Errors
- Clear node_modules and reinstall: `npm install`
- Check import paths in TypeScript files
- Verify tsconfig.json is correct

## Next Steps

1. **Run the Development Server**
   ```bash
   npm run dev
   ```

2. **Test the Full Flow**
   - Create auction as host
   - Join as participant
   - Place bids
   - View results

3. **Customize** (Optional)
   - Update app title/branding in index.html
   - Modify theme colors in App.tsx
   - Add logo or custom styling

4. **Deploy** (Optional)
   - Build: `npm run build`
   - Deploy to Firebase Hosting, Netlify, or Vercel
   - Update Firebase CORS settings if needed

## Support & Documentation

- **Requirements**: See `reqs/calcutta-auction-requirements.md`
- **README**: See `README.md` for full documentation
- **Firebase Docs**: https://firebase.google.com/docs
- **React Docs**: https://react.dev
- **Material-UI Docs**: https://mui.com/material-ui/guides/

## Important Notes

- **v1.0 Scope**: Anonymous access only (no authentication)
- **Security**: Update Firestore rules before production use
- **Testing**: Use test mode in Firestore initially
- **Data**: Stored in Firestore, persists across sessions
- **Offline**: App requires internet for Firebase sync

---

**Ready to Launch!** 🚀

Once you've completed the Firebase setup and installed dependencies, run:
```bash
npm run dev
```

Your Calcutta Auction application will be live at http://localhost:3000
