import { Box, Card, CardContent, Typography, Avatar, Grid, Chip } from '@mui/material';
import { Participant } from '../../types';
import { getInitials, getAvatarColor } from '../../utils/helpers';

interface RoomProps {
  participants: Participant[];
  currentParticipantId: string;
  sessionCode: string;
}

export const Room: React.FC<RoomProps> = ({ participants, currentParticipantId, sessionCode }) => {
  return (
    <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Room ({participants.length})
          </Typography>
          <Chip
            label={`Session: ${sessionCode}`}
            variant="outlined"
            size="small"
          />
        </Box>

        <Grid container spacing={2}>
          {participants.map(participant => (
            <Grid item xs={12} sm={6} md={4} key={participant.id}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  backgroundColor: participant.id === currentParticipantId ? '#e3f2fd' : '#ffffff',
                  borderRadius: 1,
                  border: participant.id === currentParticipantId ? '2px solid #1976d2' : '1px solid #e0e0e0'
                }}
              >
                <Avatar
                  sx={{
                    backgroundColor: getAvatarColor(participant.displayName),
                    fontWeight: 'bold',
                    width: 40,
                    height: 40
                  }}
                  src={participant.avatarUrl}
                >
                  {!participant.avatarUrl && getInitials(participant.displayName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: participant.id === currentParticipantId ? 'bold' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {participant.displayName}
                  </Typography>
                  {participant.isHost && (
                    <Chip
                      label="Host"
                      size="small"
                      variant="outlined"
                      sx={{ marginTop: 0.5 }}
                    />
                  )}
                  {participant.id === currentParticipantId && (
                    <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                      (You)
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};
