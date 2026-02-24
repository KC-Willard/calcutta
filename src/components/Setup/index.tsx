import { useState, useRef } from 'react';
import {
  Container,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { AuctionItem, PayoutCategory } from '../../types';
import { formatPercentage } from '../../utils/helpers';
import { testAuctionData } from '../../utils/testData';

interface SetupProps {
  sessionCode: string;
  onLaunchAuction: (
    title: string,
    items: AuctionItem[],
    payouts: PayoutCategory[],
    notes: string
  ) => Promise<void>;
}

export const Setup: React.FC<SetupProps> = ({ sessionCode, onLaunchAuction }) => {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutCategory[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemImageFile, setItemImageFile] = useState<File | undefined>();
  const [itemImagePreview, setItemImagePreview] = useState('');

  // Payout dialog
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [editingPayoutId, setEditingPayoutId] = useState<string | null>(null);
  const [payoutName, setPayoutName] = useState('');
  const [payoutType, setPayoutType] = useState<'win' | 'prop'>('win');
  const [payoutNumWinners, setPayoutNumWinners] = useState(1);
  const [payoutPercentage, setPayoutPercentage] = useState(0);

  // CSV import
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = () => {
    setEditingItemId(null);
    setItemName('');
    setItemImageFile(undefined);
    setItemImagePreview('');
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: AuctionItem) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemImagePreview(item.imageUrl || '');
    setItemImageFile(undefined);
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      setError('Item name is required');
      return;
    }

    let imageUrl = itemImagePreview;

    if (itemImageFile) {
      // In production, upload to Firebase Storage
      // For now, use data URL
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onloadend = () => {
          imageUrl = reader.result as string;
          resolve(null);
        };
        reader.readAsDataURL(itemImageFile);
      });
    }

    if (editingItemId) {
      setItems(items.map(item =>
        item.id === editingItemId
          ? { ...item, name: itemName, imageUrl: imageUrl || undefined }
          : item
      ));
    } else {
      setItems([
        ...items,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: itemName,
          imageUrl: imageUrl || undefined
        }
      ]);
    }

    setItemDialogOpen(false);
    setError('');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddPayout = () => {
    setEditingPayoutId(null);
    setPayoutName('');
    setPayoutType('win');
    setPayoutNumWinners(1);
    setPayoutPercentage(0);
    setPayoutDialogOpen(true);
  };

  const handleEditPayout = (payout: PayoutCategory) => {
    setEditingPayoutId(payout.id);
    setPayoutName(payout.name);
    setPayoutType(payout.type);
    setPayoutNumWinners(payout.numWinners);
    setPayoutPercentage(payout.percentageOfPot);
    setPayoutDialogOpen(true);
  };

  const handleSavePayout = () => {
    if (!payoutName.trim() || payoutNumWinners < 1 || payoutPercentage < 0) {
      setError('All payout fields are required and must be valid');
      return;
    }

    if (editingPayoutId) {
      setPayouts(payouts.map(payout =>
        payout.id === editingPayoutId
          ? {
              ...payout,
              name: payoutName,
              type: payoutType,
              numWinners: payoutNumWinners,
              percentageOfPot: payoutPercentage
            }
          : payout
      ));
    } else {
      setPayouts([
        ...payouts,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: payoutName,
          type: payoutType,
          numWinners: payoutNumWinners,
          percentageOfPot: payoutPercentage
        }
      ]);
    }

    setPayoutDialogOpen(false);
    setError('');
  };

  const handleDeletePayout = (id: string) => {
    setPayouts(payouts.filter(payout => payout.id !== id));
  };

  const handleLaunch = async () => {
    if (!title.trim()) {
      setError('Auction title is required');
      return;
    }
    if (items.length === 0) {
      setError('At least one item is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onLaunchAuction(title, items, payouts, notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch auction');
    } finally {
      setLoading(false);
    }
  };

  const handleItemImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setItemImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setItemImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadTestData = () => {
    setTitle(testAuctionData.title);
    setItems(testAuctionData.items);
    setPayouts(testAuctionData.payouts);
    setNotes(testAuctionData.notes);
    setError('');
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Skip header row if it exists (check for common headers)
        let startIdx = 0;
        if (lines[0]?.toLowerCase().includes('name') || lines[0]?.toLowerCase().includes('item')) {
          startIdx = 1;
        }

        const newItems: AuctionItem[] = [];
        for (let i = startIdx; i < lines.length; i++) {
          // Handle both quoted and unquoted CSV values
          const itemName = lines[i].replace(/^["']|["']$/g, '').trim();
          if (itemName) {
            newItems.push({
              id: Math.random().toString(36).substring(7),
              name: itemName
            });
          }
        }

        if (newItems.length === 0) {
          setError('No valid items found in CSV file');
          return;
        }

        setItems([...items, ...newItems]);
        setError('');
      } catch (err) {
        setError('Failed to parse CSV file: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
  };

  const isDevelopment = process.env.NODE_ENV === 'development';


  const payoutsByType = {
    win: payouts.filter(p => p.type === 'win'),
    prop: payouts.filter(p => p.type === 'prop')
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Auction Setup
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Session Code: <strong>{sessionCode}</strong> - Share this with participants to join
          </Typography>
        </Box>
        {isDevelopment && (
          <Button
            variant="outlined"
            color="primary"
            onClick={handleLoadTestData}
            size="small"
          >
            Load Test Data
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Auction Title */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Auction Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., 2026 NFL Calcutta"
          />
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Items ({items.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                size="small"
              >
                Add Item
              </Button>
              <Button
                variant="outlined"
                onClick={() => csvInputRef.current?.click()}
                size="small"
              >
                Import CSV
              </Button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleCSVImport}
              />
            </Box>
          </Box>

          {items.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No items added yet. Click "Add Item" to start.
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="50%">Name</TableCell>
                  <TableCell width="30%">Image</TableCell>
                  <TableCell width="20%">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      {item.imageUrl ? (
                        <Box
                          component="img"
                          src={item.imageUrl}
                          sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">No image</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditItem(item)}
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payouts Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Payout Structure
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddPayout}
              size="small"
            >
              Add Payout
            </Button>
          </Box>

          {payoutsByType.win.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Win Distribution
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right"># Winners</TableCell>
                    <TableCell align="right">% of Pot</TableCell>
                    <TableCell width="80px">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutsByType.win.map(payout => (
                    <TableRow key={payout.id}>
                      <TableCell>{payout.name}</TableCell>
                      <TableCell align="right">{payout.numWinners}</TableCell>
                      <TableCell align="right">{formatPercentage(payout.percentageOfPot)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPayout(payout)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePayout(payout.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          {payoutsByType.prop.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                Prop Distribution
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right"># Winners</TableCell>
                    <TableCell align="right">% of Pot</TableCell>
                    <TableCell width="80px">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payoutsByType.prop.map(payout => (
                    <TableRow key={payout.id}>
                      <TableCell>{payout.name}</TableCell>
                      <TableCell align="right">{payout.numWinners}</TableCell>
                      <TableCell align="right">{formatPercentage(payout.percentageOfPot)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPayout(payout)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePayout(payout.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          {payouts.length === 0 && (
            <Typography variant="body2" color="textSecondary">
              No payouts configured. Click "Add Payout" to configure the distribution.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Ties split the percentage amount evenly"
            multiline
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Launch Button */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleLaunch}
          disabled={!title.trim() || items.length === 0 || loading}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Launch Auction'}
        </Button>
      </Box>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItemId ? 'Edit Item' : 'Add Item'}
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <TextField
            fullWidth
            label="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g., Seattle Seahawks"
            sx={{ mb: 2 }}
            autoFocus
          />
          {itemImagePreview && (
            <Box
              component="img"
              src={itemImagePreview}
              sx={{ width: '100%', mb: 2, borderRadius: 1, maxHeight: 200, objectFit: 'contain' }}
            />
          )}
          <Button
            variant="outlined"
            component="label"
            fullWidth
          >
            {itemImageFile ? 'Change Image' : 'Upload Image (Optional)'}
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={handleItemImageSelect}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveItem}
            variant="contained"
            disabled={!itemName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payout Dialog */}
      <Dialog open={payoutDialogOpen} onClose={() => setPayoutDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPayoutId ? 'Edit Payout' : 'Add Payout'}
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value as 'win' | 'prop')}
                  label="Type"
                >
                  <MenuItem value="win">Win Distribution</MenuItem>
                  <MenuItem value="prop">Prop Distribution</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name"
                value={payoutName}
                onChange={(e) => setPayoutName(e.target.value)}
                placeholder="e.g., Wild Card Win"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Number of Winners"
                type="number"
                value={payoutNumWinners}
                onChange={(e) => setPayoutNumWinners(Math.max(1, parseInt(e.target.value) || 1))}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Percentage of Pot (%)"
                type="number"
                value={payoutPercentage * 100}
                onChange={(e) => setPayoutPercentage(Math.max(0, (parseFloat(e.target.value) || 0) / 100))}
                inputProps={{ min: 0, step: 0.1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSavePayout}
            variant="contained"
            disabled={!payoutName.trim() || payoutNumWinners < 1 || payoutPercentage < 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Setup;
