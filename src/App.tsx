import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, Box, CircularProgress, Typography, Container } from '@mui/material';
import { SignIn } from './components/SignIn';
import { Setup } from './components/Setup';
import { Auction } from './components/Auction';
import { Results } from './components/Results';
import {
  createAuction,
  getAuctionBySessionCode,
  addParticipant,
  subscribeToAuctionState,
  subscribeToParticipants,
  placeBid,
  launchAuction,
  toggleAuctionTimer,
  voidCurrentBid,
  completeItemAuction,
  getAuctionResults
} from './services/firebaseService';
import {
  AuctionConfig,
  AuctionState,
  Participant,
  AuctionItem,
  PayoutCategory,
  ItemRoundResult
} from './types';
import { v4 as uuidv4 } from 'uuid';

type AppPhase = 'signin' | 'setup' | 'auction' | 'results';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [phase, setPhase] = useState<AppPhase>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  //Auction data
  const [auctionId, setAuctionId] = useState<string>('');
  const [auctionConfig, setAuctionConfig] = useState<AuctionConfig | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);

  // Participants
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);

  // Results
  const [results, setResults] = useState<ItemRoundResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showPayouts, setShowPayouts] = useState(false);

  // Cleanup subscriptions
  useEffect(() => {
    if (!auctionId) return;

    const unsubState = subscribeToAuctionState(auctionId, (newState) => {
      setAuctionState(newState);
    });

    const unsubParticipants = subscribeToParticipants(auctionId, (newParticipants) => {
      setAllParticipants(newParticipants);
    });

    return () => {
      unsubState();
      unsubParticipants();
    };
  }, [auctionId]);

  // Load results when auction completes
  useEffect(() => {
    if (auctionId && auctionState?.phase === 'complete') {
      loadResults();
    }
  }, [auctionState?.phase]);

  const loadResults = async () => {
    try {
      const fetchedResults = await getAuctionResults(auctionId);
      setResults(fetchedResults);
    } catch (err) {
      console.error('Error loading results:', err);
    }
  };

  // Handle create auction
  const handleCreateAuction = async (
    displayName: string,
    profilePicture?: File
  ) => {
    setLoading(true);
    setError('');
    try {
      const participantId = uuidv4();

      // Create the participant
      const newParticipant: Participant = {
        id: participantId,
        displayName,
        isHost: true,
        avatarUrl: profilePicture ? await fileToDataUrl(profilePicture) : undefined
      };

      setCurrentParticipant(newParticipant);
      setPhase('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  // Handle join auction
  const handleJoinAuction = async (
    displayName: string,
    sessionCode: string,
    profilePicture?: File
  ) => {
    setLoading(true);
    setError('');
    try {
      // Look up auction by session code
      const auction = await getAuctionBySessionCode(sessionCode);
      if (!auction) {
        throw new Error('Auction not found with this session code');
      }

      const participantId = uuidv4();

      // Create the participant
      const newParticipant: Participant = {
        id: participantId,
        displayName,
        isHost: false,
        avatarUrl: profilePicture ? await fileToDataUrl(profilePicture) : undefined
      };

      // Add participant to auction
      await addParticipant(auction.id, newParticipant);

      // Load auction data
      setAuctionId(auction.id);
      setAuctionConfig(auction.config);
      setCurrentParticipant(newParticipant);
      setAllParticipants([newParticipant]);
      setPhase('auction');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join auction');
    } finally {
      setLoading(false);
    }
  };

  // Handle launch auction
  const handleLaunchAuction = async (
    title: string,
    items: AuctionItem[],
    payouts: PayoutCategory[],
    notes: string
  ) => {
    setLoading(true);
    setError('');
    try {
      // Create auction in Firebase
      const newAuctionId = await createAuction(title, items, payouts, notes);

      // Add host as participant
      if (currentParticipant) {
        await addParticipant(newAuctionId, currentParticipant);
      }

      setAuctionId(newAuctionId);
      setAuctionConfig({
        id: newAuctionId,
        title,
        sessionCode: '',
        items,
        payouts,
        notes
      });

      // Load the config from Firebase to get session code
      // For now we'll get it from the created auction
      const auction = await getAuctionBySessionCode(''); // This won't work, need to fix
      if (auction) {
        setAuctionConfig(auction.config);
      }

      // Launch the auction
      await launchAuction(newAuctionId);
      setPhase('auction');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch auction');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (amount: number): Promise<boolean> => {
    if (!auctionId || !currentParticipant) return false;

    try {
      const success = await placeBid(auctionId, {
        participantId: currentParticipant.id,
        participantName: currentParticipant.displayName,
        amount
      });
      return success;
    } catch (err) {
      console.error('Error placing bid:', err);
      return false;
    }
  };

  const handlePauseResume = async (paused: boolean) => {
    if (!auctionId) return;
    try {
      await toggleAuctionTimer(auctionId, !paused);
    } catch (err) {
      console.error('Error toggling timer:', err);
    }
  };

  const handleVoidBid = async () => {
    if (!auctionId) return;
    try {
      await voidCurrentBid(auctionId);
    } catch (err) {
      console.error('Error voiding bid:', err);
    }
  };

  const handleCompleteItem = async (result: ItemRoundResult) => {
    if (!auctionId) return;
    try {
      await completeItemAuction(auctionId, result);
    } catch (err) {
      console.error('Error completing item:', err);
    }
  };

  const handleUpdateResult = async (
    resultId: string,
    grossEarnings: number,
    categoriesWon: string
  ) => {
    // Update result in local state for now
    setResults(results.map(r =>
      r.itemId === resultId
        ? { ...r, grossEarnings, categoriesWon }
        : r
    ));
  };

  const handleExport = async () => {
    // Export is handled in the Results component
    console.log('Exporting results');
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  if (loading && phase === 'signin') {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
        {!auctionId || !auctionState || !currentParticipant ? (
          <>
            {phase === 'signin' && (
              <SignIn
                onCreateAuction={handleCreateAuction}
                onJoinAuction={handleJoinAuction}
              />
            )}
            {phase === 'setup' && currentParticipant && (
              <Setup
                sessionCode="SETUP"
                onLaunchAuction={handleLaunchAuction}
              />
            )}
            {error && (
              <Container sx={{ mt: 2 }}>
                <Typography color="error">{error}</Typography>
              </Container>
            )}
          </>
        ) : (
          <>
            {showPayouts ? (
              <Results
                results={[]}
                participants={allParticipants}
                totalPot={auctionState.totalPot}
                auctionTitle={auctionConfig?.title || ''}
                auctionConfig={auctionConfig || {
                  id: auctionId,
                  title: '',
                  sessionCode: '',
                  items: [],
                  payouts: [],
                }}
                currentParticipant={currentParticipant}
                state={auctionState}
                onUpdateResult={handleUpdateResult}
                onExport={handleExport}
              />
            ) : showResults || auctionState.phase === 'complete' ? (
              <Results
                results={results}
                participants={allParticipants}
                totalPot={auctionState.totalPot}
                auctionTitle={auctionConfig?.title || ''}
                auctionConfig={auctionConfig || {
                  id: auctionId,
                  title: '',
                  sessionCode: '',
                  items: [],
                  payouts: [],
                }}
                currentParticipant={currentParticipant}
                state={auctionState}
                onUpdateResult={handleUpdateResult}
                onExport={handleExport}
              />
            ) : (
              <Auction
                state={auctionState}
                currentParticipant={currentParticipant}
                allParticipants={allParticipants}
                auctionTitle={auctionConfig?.title || ''}
                sessionCode={auctionConfig?.sessionCode || ''}
                onPlaceBid={handlePlaceBid}
                onPauseResume={handlePauseResume}
                onVoidBid={handleVoidBid}
                onViewPayouts={() => setShowPayouts(true)}
                onViewResults={() => setShowResults(true)}
                onCompleteItem={handleCompleteItem}
              />
            )}
          </>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;
