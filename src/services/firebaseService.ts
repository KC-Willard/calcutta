import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  writeBatch,
  addDoc,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore';
import { 
  AuctionConfig, 
  AuctionState, 
  Participant, 
  ItemRoundResult, 
  Bid,
  AuctionItem,
  PayoutCategory
} from '../types';

// Firebase configuration
// NOTE: Replace with your own Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCAAkWT9GZt3S9TiRF73bbsrLGvoms1tBk",
  authDomain: "doormans-calcutta.firebaseapp.com",
  projectId: "doormans-calcutta",
  storageBucket: "doormans-calcutta.firebasestorage.app",
  messagingSenderId: "757150139533",
  appId: "1:757150139533:web:9a1cb7b040f7fbb37c8ec4",
  measurementId: "G-FJ42TF1G8Y"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection references
const AUCTIONS = 'auctions';
const AUCTION_STATE = 'state';
const PARTICIPANTS = 'participants';
const RESULTS = 'results';

// Create a new auction
export async function createAuction(
  title: string,
  items: AuctionItem[],
  payouts: PayoutCategory[],
  notes?: string
): Promise<string> {
  const sessionCode = generateSessionCode();
  
  const auctionConfig: AuctionConfig = {
    id: '',
    title,
    sessionCode,
    items,
    payouts,
    notes
  };

  const docRef = await addDoc(collection(db, AUCTIONS), {
    ...auctionConfig,
    createdAt: serverTimestamp()
  });

  // Initialize auction state
  const initialState: AuctionState = {
    phase: 'setup',
    currentBid: 0,
    timerSeconds: 30,
    timerRunning: false,
    bidHistory: [],
    remainingItems: [...items],
    results: [],
    totalPot: 0
  };

  await setDoc(doc(db, AUCTIONS, docRef.id, AUCTION_STATE, 'current'), initialState);

  return docRef.id;
}

// Get auction by ID
export async function getAuctionById(auctionId: string): Promise<AuctionConfig | null> {
  const docSnapshot = await getDoc(doc(db, AUCTIONS, auctionId));
  if (!docSnapshot.exists()) return null;
  return { id: auctionId, ...docSnapshot.data() } as AuctionConfig;
}

// Get auction by session code
export async function getAuctionBySessionCode(sessionCode: string): Promise<{ id: string; config: AuctionConfig } | null> {
  const q = query(collection(db, AUCTIONS), where('sessionCode', '==', sessionCode));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    config: { id: doc.id, ...doc.data() } as AuctionConfig
  };
}

// Add participant to auction
export async function addParticipant(
  auctionId: string,
  participant: Participant
): Promise<string> {
  const docRef = await addDoc(
    collection(db, AUCTIONS, auctionId, PARTICIPANTS),
    {
      ...participant,
      joinedAt: serverTimestamp()
    }
  );
  return docRef.id;
}

// Get all participants in auction
export async function getParticipants(auctionId: string): Promise<Participant[]> {
  const snapshot = await getDocs(collection(db, AUCTIONS, auctionId, PARTICIPANTS));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
}

// Subscribe to auction state changes
export function subscribeToAuctionState(
  auctionId: string,
  callback: (state: AuctionState) => void
): () => void {
  const unsub = onSnapshot(
    doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'),
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback(docSnapshot.data() as AuctionState);
      }
    }
  );
  return unsub;
}

// Subscribe to participants
export function subscribeToParticipants(
  auctionId: string,
  callback: (participants: Participant[]) => void
): () => void {
  const unsub = onSnapshot(
    collection(db, AUCTIONS, auctionId, PARTICIPANTS),
    (snapshot) => {
      const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Participant));
      callback(participants);
    }
  );
  return unsub;
}

// Place a bid
export async function placeBid(
  auctionId: string,
  bid: Omit<Bid, 'timestamp'>
): Promise<boolean> {
  try {
    const stateDoc = await getDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'));
    const currentState = stateDoc.data() as AuctionState;

    // Validate bid
    if (bid.amount <= currentState.currentBid) {
      return false;
    }

    // Update state
    const batch = writeBatch(db);
    
    const newBid: Bid = {
      ...bid,
      timestamp: Date.now()
    };

    // Add to bid history
    batch.update(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'), {
      currentBid: bid.amount,
      currentBidderId: bid.participantId,
      currentBidderName: bid.participantName,
      timerSeconds: 30,
      timerRunning: true,
      bidHistory: [...(currentState.bidHistory || []), newBid],
      totalPot: currentState.totalPot
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error placing bid:', error);
    return false;
  }
}

// Pause/Resume auction
export async function toggleAuctionTimer(auctionId: string, running: boolean): Promise<void> {
  const stateDoc = await getDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'));
  const state = stateDoc.data() as AuctionState;

  await updateDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'), {
    timerRunning: running,
    pausedAtSeconds: running ? undefined : state.timerSeconds
  });
}

// Void current bid
export async function voidCurrentBid(auctionId: string): Promise<void> {
  const stateDoc = await getDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'));
  const state = stateDoc.data() as AuctionState;

  const updatedHistory = state.bidHistory.map((bid, idx) => 
    idx === state.bidHistory.length - 1 ? { ...bid, voided: true } : bid
  );

  const previousBid = state.bidHistory.length > 1 
    ? state.bidHistory[state.bidHistory.length - 2]
    : undefined;

  await updateDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'), {
    currentBid: previousBid?.amount ?? 0,
    currentBidderId: previousBid?.participantId,
    currentBidderName: previousBid?.participantName,
    bidHistory: updatedHistory,
    timerSeconds: previousBid ? 30 : 0,
    timerRunning: !!previousBid
  });
}

// Complete item auction and move to next
export async function completeItemAuction(
  auctionId: string,
  result: ItemRoundResult
): Promise<void> {
  const stateDoc = await getDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'));
  const state = stateDoc.data() as AuctionState;

  const newResults = [...state.results, result];
  const newTotalPot = state.totalPot + result.salePrice;
  
  const nextItems = state.remainingItems.filter(item => item.id !== result.itemId);
  let nextItem = undefined;
  
  if (nextItems.length > 0) {
    const randomIdx = Math.floor(Math.random() * nextItems.length);
    nextItem = nextItems[randomIdx];
  }

  const newPhase = nextItems.length === 0 ? 'complete' : 'active';

  await updateDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'), {
    results: newResults,
    totalPot: newTotalPot,
    remainingItems: nextItems,
    currentItem: nextItem || deleteField(),
    currentBid: 0,
    currentBidderId: deleteField(),
    currentBidderName: deleteField(),
    timerSeconds: 30,
    timerRunning: false,
    bidHistory: [],
    phase: newPhase
  });

  // Store result in subcollection
  await addDoc(collection(db, AUCTIONS, auctionId, RESULTS), result);
}

// Launch auction (start bidding)
export async function launchAuction(auctionId: string): Promise<void> {
  const stateDoc = await getDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'));
  const state = stateDoc.data() as AuctionState;

  const items = state.remainingItems;
  const randomIdx = Math.floor(Math.random() * items.length);
  const firstItem = items[randomIdx];

  await updateDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'), {
    phase: 'active',
    currentItem: firstItem,
    timerRunning: false,
    timerSeconds: 30
  });
}

// Update timer
export async function updateTimer(auctionId: string, seconds: number): Promise<void> {
  await updateDoc(doc(db, AUCTIONS, auctionId, AUCTION_STATE, 'current'), {
    timerSeconds: seconds
  });
}

// Add auction results
export async function addAuctionResult(
  auctionId: string,
  result: ItemRoundResult
): Promise<void> {
  await addDoc(collection(db, AUCTIONS, auctionId, RESULTS), result);
}

// Get all auction results
export async function getAuctionResults(auctionId: string): Promise<ItemRoundResult[]> {
  const snapshot = await getDocs(collection(db, AUCTIONS, auctionId, RESULTS));
  return snapshot.docs.map(doc => doc.data() as ItemRoundResult);
}

// Helper function to generate session code
function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default db;
