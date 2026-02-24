import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
  IconButton,
  Divider,
  Grid,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import GetAppIcon from '@mui/icons-material/GetApp';
import { ItemRoundResult, Participant, AuctionConfig, AuctionState } from '../../types';
import { formatCurrency, formatPercentage } from '../../utils/helpers';
import { exportToExcel } from '../../utils/helpers';

interface ResultsProps {
  results: ItemRoundResult[];
  participants: Participant[];
  totalPot: number;
  auctionTitle: string;
  auctionConfig: AuctionConfig;
  currentParticipant: Participant;
  state: AuctionState;
  onUpdateResult: (resultId: string, grossEarnings: number, categoriesWon: string) => Promise<void>;
  onExport: () => Promise<void>;
  onBack?: () => void;
}

export const Results: React.FC<ResultsProps> = ({
  results,
  participants,
  totalPot,
  auctionTitle,
  auctionConfig,
  currentParticipant,
  state,
  onUpdateResult,
  onExport,
  onBack
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGrossEarnings, setEditGrossEarnings] = useState(0);
  const [editCategoriesWon, setEditCategoriesWon] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const handleEditClick = (result: ItemRoundResult) => {
    setEditingId(result.itemId);
    setEditGrossEarnings(result.grossEarnings ?? 0);
    setEditCategoriesWon(result.categoriesWon ?? '');
  };

  const handleSaveEdit = async () => {
    if (editingId) {
      await onUpdateResult(editingId, editGrossEarnings, editCategoriesWon);
      setEditingId(null);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Calculate participant stats
      const participantStats = new Map<string, {
        displayName: string;
        totalSpent: number;
        itemsWon: string[];
        grossEarnings: number;
      }>();

      participants.forEach(p => {
        participantStats.set(p.id, {
          displayName: p.displayName,
          totalSpent: 0,
          itemsWon: [],
          grossEarnings: 0
        });
      });

      results.forEach(result => {
        const stat = participantStats.get(result.winnerId);
        if (stat) {
          stat.totalSpent += result.salePrice;
          stat.itemsWon.push(result.itemName);
          stat.grossEarnings += result.grossEarnings ?? 0;
        }
      });

      const exportData = {
        auctionTitle,
        totalPot,
        results,
        participants,
        payouts: auctionConfig.payouts,
        notes: auctionConfig.notes
      };

      exportToExcel(exportData);
      await onExport();
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate per-participant totals
  const participantSummary = participants.map(p => {
    const pResults = results.filter(r => r.winnerId === p.id);
    const totalSpent = pResults.reduce((sum, r) => sum + r.salePrice, 0);
    const grossEarnings = pResults.reduce((sum, r) => sum + (r.grossEarnings ?? 0), 0);
    const netEarnings = grossEarnings - totalSpent;

    return {
      participant: p,
      totalSpent,
      grossEarnings,
      netEarnings,
      itemsWon: pResults.map(r => r.itemName),
      itemsCount: pResults.length
    };
  }).filter(s => s.totalSpent > 0);

  const totalGrossEarnings = participantSummary.reduce((sum, s) => sum + s.grossEarnings, 0);
  const totalNetEarnings = participantSummary.reduce((sum, s) => sum + s.netEarnings, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {onBack && (
            <IconButton onClick={onBack} sx={{ color: 'primary.main' }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Auction Results
          </Typography>
        </Box>
        {currentParticipant.isHost && state.phase === 'complete' && (
          <Button
            variant="contained"
            startIcon={<GetAppIcon />}
            onClick={handleExport}
            disabled={exportLoading}
          >
            {exportLoading ? <CircularProgress size={24} /> : 'Download Results'}
          </Button>
        )}
      </Box>

      {/* Items Summary */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Items Summary
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Item Name</TableCell>
                  <TableCell align="right">Sale Price</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell align="right">Pot %</TableCell>
                  <TableCell align="right">Gross Earnings</TableCell>
                  <TableCell align="right">Net Earnings</TableCell>
                  <TableCell>Categories Won</TableCell>
                  {currentParticipant.isHost && <TableCell width="60px">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3 }}>
                      <Typography color="textSecondary">No items sold yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  results.map(result => {
                    const potPercent = totalPot > 0 ? result.salePrice / totalPot : 0;
                    const netEarnings = (result.grossEarnings ?? 0) - result.salePrice;

                    return (
                      <TableRow key={result.itemId}>
                        <TableCell>{result.itemName}</TableCell>
                        <TableCell align="right">{formatCurrency(result.salePrice)}</TableCell>
                        <TableCell>{result.winnerName}</TableCell>
                        <TableCell align="right">{formatPercentage(potPercent)}</TableCell>
                        <TableCell align="right">
                          {editingId === result.itemId ? (
                            <TextField
                              type="number"
                              size="small"
                              value={editGrossEarnings}
                              onChange={(e) => setEditGrossEarnings(parseFloat(e.target.value) || 0)}
                              sx={{ width: 100 }}
                            />
                          ) : (
                            formatCurrency(result.grossEarnings ?? 0)
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {editingId === result.itemId ? (
                            <Typography>{formatCurrency(editGrossEarnings - result.salePrice)}</Typography>
                          ) : (
                            formatCurrency(netEarnings)
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === result.itemId ? (
                            <TextField
                              size="small"
                              value={editCategoriesWon}
                              onChange={(e) => setEditCategoriesWon(e.target.value)}
                              placeholder="e.g., Wild Card, Division"
                            />
                          ) : (
                            <Typography>{result.categoriesWon || '-'}</Typography>
                          )}
                        </TableCell>
                        {currentParticipant.isHost && (
                          <TableCell>
                            {editingId === result.itemId ? (
                              <>
                                <Button
                                  size="small"
                                  onClick={handleSaveEdit}
                                  variant="contained"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={() => handleEditClick(result)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>

          {results.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Total Sale Price</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(results.reduce((sum, r) => sum + r.salePrice, 0))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Total Gross Earnings</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(results.reduce((sum, r) => sum + (r.grossEarnings ?? 0), 0))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Total Net Earnings</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(results.reduce((sum, r) => sum + ((r.grossEarnings ?? 0) - r.salePrice), 0))}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Per-Participant Summary */}
      {participantSummary.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Per-Participant Summary
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">$ Spent</TableCell>
                    <TableCell align="right">% of Pot</TableCell>
                    <TableCell>Items Won</TableCell>
                    <TableCell align="right">Gross Earnings</TableCell>
                    <TableCell align="right">Net Earnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participantSummary.map(summary => {
                    const potPercent = totalPot > 0 ? summary.totalSpent / totalPot : 0;

                    return (
                      <TableRow key={summary.participant.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {summary.participant.avatarUrl && (
                              <Box
                                component="img"
                                src={summary.participant.avatarUrl}
                                sx={{ width: 32, height: 32, borderRadius: '50%' }}
                              />
                            )}
                            {summary.participant.displayName}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(summary.totalSpent)}</TableCell>
                        <TableCell align="right">{formatPercentage(potPercent)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {summary.itemsWon.join(', ')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(summary.grossEarnings)}</TableCell>
                        <TableCell align="right">{formatCurrency(summary.netEarnings)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {participantSummary.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Total Spent</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(participantSummary.reduce((sum, s) => sum + s.totalSpent, 0))}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Total Gross Earnings</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(totalGrossEarnings)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Total Net Earnings</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(totalNetEarnings)}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payout Structure */}
      {auctionConfig.payouts.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Payout Structure
            </Typography>

            <Grid container spacing={3}>
              {auctionConfig.payouts
                .filter(p => p.type === 'win')
                .length > 0 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Win Distribution
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>Category</TableCell>
                        <TableCell align="right"># Winners</TableCell>
                        <TableCell align="right">Per Winner</TableCell>
                        <TableCell align="right">Implied $</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auctionConfig.payouts
                        .filter(p => p.type === 'win')
                        .map(payout => {
                          const impliedAmount = totalPot * payout.percentageOfPot;
                          return (
                            <TableRow key={payout.id}>
                              <TableCell>{payout.name}</TableCell>
                              <TableCell align="right">{payout.numWinners}</TableCell>
                              <TableCell align="right">{formatPercentage(payout.percentageOfPot)}</TableCell>
                              <TableCell align="right">{formatCurrency(impliedAmount)}</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </Grid>
              )}

              {auctionConfig.payouts
                .filter(p => p.type === 'prop')
                .length > 0 && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Prop Distribution
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell>Category</TableCell>
                        <TableCell align="right"># Winners</TableCell>
                        <TableCell align="right">Per Winner</TableCell>
                        <TableCell align="right">Implied $</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auctionConfig.payouts
                        .filter(p => p.type === 'prop')
                        .map(payout => {
                          const impliedAmount = totalPot * payout.percentageOfPot;
                          return (
                            <TableRow key={payout.id}>
                              <TableCell>{payout.name}</TableCell>
                              <TableCell align="right">{payout.numWinners}</TableCell>
                              <TableCell align="right">{formatPercentage(payout.percentageOfPot)}</TableCell>
                              <TableCell align="right">{formatCurrency(impliedAmount)}</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </Grid>
              )}
            </Grid>

            {auctionConfig.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2">
                  <strong>Notes:</strong> {auctionConfig.notes}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default Results;
