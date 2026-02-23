// Core entity types for Calcutta Auction

export interface AuctionItem {
  id: string;
  name: string;
  imageUrl?: string;
  seed?: number;
}

export interface PayoutCategory {
  id: string;
  name: string;
  type: 'win' | 'prop';
  numWinners: number;
  percentageOfPot: number; // e.g., 0.065
}

export interface AuctionConfig {
  id: string;
  title: string;
  sessionCode: string;
  items: AuctionItem[];
  payouts: PayoutCategory[];
  notes?: string;
}

export interface Participant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isHost: boolean;
}

export interface Bid {
  participantId: string;
  participantName: string;
  amount: number;
  timestamp: number;
  voided?: boolean;
}

export interface ItemRoundResult {
  itemId: string;
  itemName: string;
  winnerId: string;
  winnerName: string;
  salePrice: number;
  categoriesWon?: string;
  grossEarnings?: number;
  timestamp: number;
  bidHistory: Bid[];
}

export interface AuctionState {
  phase: 'setup' | 'active' | 'paused' | 'complete';
  currentItem?: AuctionItem;
  currentBid: number;
  currentBidderId?: string;
  currentBidderName?: string;
  currentBidderAvatar?: string;
  timerSeconds: number;
  timerRunning: boolean;
  bidHistory: Bid[];
  remainingItems: AuctionItem[];
  results: ItemRoundResult[];
  totalPot: number;
  pausedAtSeconds?: number;
}

export interface ParticipantSession {
  auctionId: string;
  sessionCode: string;
  participant: Participant;
  joinedAt: number;
}

export interface AuctionResults {
  items: ItemRoundResult[];
  perParticipant: {
    participantId: string;
    displayName: string;
    totalSpent: number;
    itemsWon: string[];
    grossEarnings: number;
  }[];
  totalPot: number;
}
