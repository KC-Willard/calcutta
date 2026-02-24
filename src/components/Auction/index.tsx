import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  Avatar,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import { AuctionState, Participant, ItemRoundResult } from '../../types';
import { formatCurrency, getInitials, getAvatarColor } from '../../utils/helpers';
import { Room } from '../Room';

interface AuctionProps {
  state: AuctionState;
  currentParticipant: Participant;
  allParticipants: Participant[];
  auctionTitle: string;
  sessionCode: string;
  onPlaceBid: (amount: number) => Promise<boolean>;
  onPauseResume: (paused: boolean) => Promise<void>;
  onVoidBid: () => Promise<void>;
  onViewResults: () => void;
  onCompleteItem: (result: ItemRoundResult) => Promise<void>;
}

export const Auction: React.FC<AuctionProps> = ({
  state,
  currentParticipant,
  allParticipants,
  auctionTitle,
  sessionCode,
  onPlaceBid,
  onPauseResume,
  onVoidBid,
  onViewResults,
  onCompleteItem
}) => {
  const [customBid, setCustomBid] = useState('');
  const [bidError, setBidError] = useState('');
  const [voidConfirm, setVoidConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState(state.timerSeconds);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const completionTriggeredRef = useRef(false);

  // Countdown timer - just count down
  useEffect(() => {
    console.log('Timer effect triggered:', { timerRunning: state.timerRunning, timerSeconds: state.timerSeconds });
    
    // Clear existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Reset completion flag when timer resets
    completionTriggeredRef.current = false;
    setTimerDisplay(state.timerSeconds);
    console.log('Timer display set to:', state.timerSeconds);

    // Start countdown if timer is running
    if (state.timerRunning) {
      console.log('Starting timer countdown from', state.timerSeconds);
      timerIntervalRef.current = setInterval(() => {
        setTimerDisplay(prev => Math.max(0, prev - 1));
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [state.timerRunning, state.timerSeconds, state.currentBidderId]);

  // Handle completion when timer reaches 0
  useEffect(() => {
    console.log('Timer effect check:', {
      timerDisplay,
      timerRunning: state.timerRunning,
      hasBidderId: !!state.currentBidderId,
      hasItem: !!state.currentItem,
      notTriggered: !completionTriggeredRef.current
    });

    if (timerDisplay === 0 && state.timerRunning && !completionTriggeredRef.current && state.currentBidderId && state.currentItem) {
      console.log('TRIGGERING COMPLETION');
      completionTriggeredRef.current = true;
      
      // Timer expired - complete the item
      const bidderName = allParticipants.find(p => p.id === state.currentBidderId)?.displayName || '';
      const result: ItemRoundResult = {
        itemId: state.currentItem.id,
        itemName: state.currentItem.name,
        winnerId: state.currentBidderId,
        winnerName: bidderName,
        salePrice: state.currentBid,
        timestamp: Date.now(),
        bidHistory: state.bidHistory
      };
      
      console.log('Calling onCompleteItem with result:', result);
      onCompleteItem(result);
    }
  }, [timerDisplay, state.timerRunning, state.currentBidderId, state.currentItem, state.currentBid, state.bidHistory, allParticipants, onCompleteItem]);

  const handlePlaceBid = async (amount: number) => {
    console.log('Placing bid:', amount);
    setBidError('');

    if (amount <= state.currentBid) {
      setBidError(`Must be greater than current bid of ${formatCurrency(state.currentBid)}`);
      return;
    }

    setLoading(true);
    try {
      const success = await onPlaceBid(amount);
      if (!success) {
        setBidError('Bid was rejected - may be too low');
      } else {
        setCustomBid('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomBid = async () => {
    const amount = parseFloat(customBid);
    if (isNaN(amount) || amount <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }
    await handlePlaceBid(amount);
  };

  const getCurrentBidder = (): Participant | undefined => {
    return allParticipants.find(p => p.id === state.currentBidderId);
  };

  const bidder = getCurrentBidder();
  const timerPercent = (state.timerSeconds / 30) * 100;
  const timerColor = state.timerSeconds < 10 ? '#f44336' : '#4caf50';

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {auctionTitle}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Session: {sessionCode}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle1" color="textSecondary">
            Total Pot
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
            {formatCurrency(state.totalPot)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={onViewResults}
            variant="outlined"
            size="small"
          >
            View Results
          </Button>
        </Box>
      </Box>

      {/* Room/Participants */}
      <Room
        participants={allParticipants}
        currentParticipantId={currentParticipant.id}
        sessionCode={sessionCode}
      />

      {/* Main Auction Area */}
      {state.phase === 'complete' ? (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              🎉 Auction Has Concluded 🎉
            </Typography>
            <Button
              variant="contained"
              onClick={onViewResults}
            >
              View Final Results
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Item */}
          {state.currentItem && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                  <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
                    {state.currentItem.imageUrl ? (
                      <Box
                        component="img"
                        src={state.currentItem.imageUrl}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 300,
                          borderRadius: 2,
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 300,
                          backgroundColor: '#f5f5f5',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography color="textSecondary">No image</Typography>
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
                      {state.currentItem.name}
                    </Typography>

                    {/* Timer */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                        Time Remaining
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography
                          variant="h2"
                          sx={{
                            fontWeight: 'bold',
                            color: timerColor,
                            fontFamily: 'monospace'
                          }}
                        >
                          {state.timerRunning ? timerDisplay : state.timerSeconds}s
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={timerPercent}
                          sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: timerColor
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Current Bid Display */}
                    {state.currentBid > 0 && bidder ? (
                      <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Avatar
                            sx={{
                              backgroundColor: getAvatarColor(bidder.displayName),
                              fontWeight: 'bold'
                            }}
                            src={bidder.avatarUrl}
                          >
                            {!bidder.avatarUrl && getInitials(bidder.displayName)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Current Bid
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {bidder.displayName}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                          {formatCurrency(state.currentBid)}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
                        <Typography variant="h6" color="textSecondary">
                          Waiting for first bid...
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Bid Controls */}
          {state.phase === 'active' && (
            <>
              {bidError && <Alert severity="error" sx={{ mb: 2 }}>{bidError}</Alert>}

              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Place Your Bid
                  </Typography>

                  {/* Quick bid buttons */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => handlePlaceBid(state.currentBid + 1)}
                        disabled={loading || state.phase !== 'active'}
                      >
                        +$1
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => handlePlaceBid(state.currentBid + 5)}
                        disabled={loading || state.phase !== 'active'}
                      >
                        +$5
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => handlePlaceBid(state.currentBid + 10)}
                        disabled={loading || state.phase !== 'active'}
                      >
                        +$10
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Custom bid input */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Custom Bid Amount"
                        value={customBid}
                        onChange={(e) => setCustomBid(e.target.value)}
                        placeholder={`Must exceed ${formatCurrency(state.currentBid)}`}
                        disabled={loading || state.phase !== 'active'}
                        helperText={state.currentBid > 0 ? `Minimum bid: ${formatCurrency(state.currentBid + 0.01)}` : 'Enter minimum starting bid'}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        fullWidth
                        size="large"
                        variant="contained"
                        onClick={handleCustomBid}
                        disabled={loading || !customBid || state.phase !== 'active'}
                        sx={{ height: '100%' }}
                      >
                        Bid
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </>
          )}

          {/* Host Controls */}
          {currentParticipant.isHost && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Host Controls
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={state.timerRunning ? <PauseIcon /> : <PlayArrowIcon />}
                      onClick={() => onPauseResume(!state.timerRunning)}
                      disabled={state.phase !== 'active'}
                    >
                      {state.timerRunning ? 'Pause' : 'Resume'} Timer
                    </Button>
                  </Grid>
                  {state.currentBidderId && (
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setVoidConfirm(true)}
                      >
                        Void Current Bid
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Auction Progress / Recently Sold Items */}
      {state.results && state.results.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Items Sold ({state.results.length})
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {state.results.map((result, index) => (
                <Box
                  key={result.itemId}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                    borderBottom: '1px solid #e0e0e0'
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {result.itemName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Won by: {result.winnerName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4caf50', minWidth: 80, textAlign: 'right' }}>
                    {formatCurrency(result.salePrice)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Void Confirmation Dialog */}
      <Dialog open={voidConfirm} onClose={() => setVoidConfirm(false)}>
        <DialogTitle>Void Current Bid?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to void the current bid of {formatCurrency(state.currentBid)}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidConfirm(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              setVoidConfirm(false);
              await onVoidBid();
            }}
            color="error"
            variant="contained"
          >
            Void Bid
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Auction;
