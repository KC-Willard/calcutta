import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { getInitials, getAvatarColor } from '../../utils/helpers';

interface SignInProps {
  onCreateAuction: (displayName: string, profilePicture?: File) => Promise<void>;
  onJoinAuction: (displayName: string, sessionCode: string, profilePicture?: File) => Promise<void>;
}

type Mode = 'initial' | 'create' | 'join';

export const SignIn: React.FC<SignInProps> = ({ onCreateAuction, onJoinAuction }) => {
  const [mode, setMode] = useState<Mode>('initial');
  const [displayName, setDisplayName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onCreateAuction(displayName, profilePicture);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    if (!sessionCode.trim()) {
      setError('Session code is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onJoinAuction(displayName, sessionCode.toUpperCase(), profilePicture);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join auction');
    } finally {
      setLoading(false);
    }
  };

  const avatarBgColor = getAvatarColor(displayName);
  const initials = getInitials(displayName);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Calcutta Auction
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Real-time bidding platform
        </Typography>
      </Box>

      {mode === 'initial' && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" gutterBottom>
              Get Started
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
              Create a new auction or join an existing one
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => { setMode('create'); setError(''); }}
              >
                Create Auction (Host)
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => { setMode('join'); setError(''); }}
              >
                Join Auction (Participant)
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {(mode === 'create' || mode === 'join') && (
        <Card>
          <CardContent sx={{ pt: 4 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Preview Avatar */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: avatarBgColor,
                  fontSize: '2rem',
                  fontWeight: 'bold'
                }}
                src={previewUrl}
              >
                {initials}
              </Avatar>
            </Box>

            <Grid container spacing={2}>
              {/* Display Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={loading}
                  autoFocus
                />
              </Grid>

              {/* Session Code (for join mode) */}
              {mode === 'join' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Session Code"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    placeholder="e.g., NFL2025"
                    disabled={loading}
                  />
                </Grid>
              )}

              {/* Profile Picture Upload */}
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                >
                  {profilePicture ? 'Change Profile Picture' : 'Upload Profile Picture (Optional)'}
                  <input
                    hidden
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    type="file"
                    onChange={handleFileSelect}
                    disabled={loading}
                  />
                </Button>
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12} sx={{ pt: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => { setMode('initial'); setError(''); }}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={mode === 'create' ? handleCreate : handleJoin}
                    disabled={!displayName.trim() || loading}
                  >
                    {loading ? <CircularProgress size={24} /> : (mode === 'create' ? 'Create' : 'Join')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default SignIn;
