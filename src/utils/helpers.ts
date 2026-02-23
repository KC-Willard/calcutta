import XLSX from 'xlsx';
import { ItemRoundResult, PayoutCategory, Participant, AuctionState } from '../types';

interface ExportData {
  auctionTitle: string;
  totalPot: number;
  results: ItemRoundResult[];
  participants: Participant[];
  payouts: PayoutCategory[];
  notes?: string;
}

export function exportToExcel(data: ExportData): void {
  const workbook = XLSX.utils.book_new();
  
  // Prepare sheet data
  const sheetData: any[] = [];
  
  // Header section
  sheetData.push([]);
  sheetData.push(['Payment/Venmo', '', data.auctionTitle]);
  sheetData.push([]);
  
  // Items table
  sheetData.push(['Item Name', 'Sale Price', 'Owner', 'Pot %', 'Gross Earnings', 'Net Earnings', 'Categories Won']);
  
  let totalItemPrice = 0;
  data.results.forEach(result => {
    const potPercent = data.totalPot > 0 ? (result.salePrice / data.totalPot * 100).toFixed(2) : '0';
    const netEarnings = (result.grossEarnings ?? 0) - result.salePrice;
    
    sheetData.push([
      result.itemName,
      result.salePrice,
      result.winnerName,
      potPercent + '%',
      result.grossEarnings ?? '',
      netEarnings,
      result.categoriesWon || ''
    ]);
    
    totalItemPrice += result.salePrice;
  });
  
  // Total row
  sheetData.push([
    'TOTAL',
    totalItemPrice,
    '',
    '100%',
    '',
    ''
  ]);
  
  sheetData.push([]);
  sheetData.push([]);
  
  // Per-participant summary
  const participantStats = calculateParticipantStats(data.results, data.participants);
  
  sheetData.push(['Paid?', 'Name', '$ Spent', '% of Pot', 'Items Won', 'Gross Earnings', 'Net Earnings']);
  
  let totalGrossEarnings = 0;
  let totalNetEarnings = 0;
  
  participantStats.forEach(stats => {
    const percentOfPot = data.totalPot > 0 ? (stats.totalSpent / data.totalPot * 100).toFixed(2) : '0';
    const netEarnings = (stats.grossEarnings ?? 0) - stats.totalSpent;
    
    sheetData.push([
      '',
      stats.participantName,
      stats.totalSpent,
      percentOfPot + '%',
      stats.itemsWon.join(', '),
      stats.grossEarnings ?? '',
      netEarnings
    ]);
    
    totalGrossEarnings += stats.grossEarnings ?? 0;
    totalNetEarnings += netEarnings;
  });
  
  sheetData.push([
    '',
    'TOTAL',
    totalItemPrice,
    '100%',
    '',
    totalGrossEarnings,
    totalNetEarnings
  ]);
  
  sheetData.push([]);
  sheetData.push([]);
  
  // Payout distributions
  const winPayouts = data.payouts.filter(p => p.type === 'win');
  const propPayouts = data.payouts.filter(p => p.type === 'prop');
  
  if (winPayouts.length > 0) {
    sheetData.push(['Win Distribution']);
    sheetData.push(['Category', '# Teams', 'Amount for Win', 'Implied $', 'Winner(s)']);
    
    winPayouts.forEach(payout => {
      const impliedAmount = data.totalPot * payout.percentageOfPot;
      sheetData.push([
        payout.name,
        payout.numWinners,
        (payout.percentageOfPot * 100).toFixed(1) + '%',
        '$' + impliedAmount.toFixed(2),
        ''
      ]);
    });
  }
  
  sheetData.push([]);
  
  if (propPayouts.length > 0) {
    sheetData.push(['Prop Distribution']);
    sheetData.push(['Category', '# Teams', 'Amount for Win', 'Implied $', 'Winner(s)']);
    
    propPayouts.forEach(payout => {
      const impliedAmount = data.totalPot * payout.percentageOfPot;
      sheetData.push([
        payout.name,
        payout.numWinners,
        (payout.percentageOfPot * 100).toFixed(1) + '%',
        '$' + impliedAmount.toFixed(2),
        ''
      ]);
    });
  }
  
  if (data.notes) {
    sheetData.push([]);
    sheetData.push(['Notes: ' + data.notes]);
  }
  
  // Create sheet
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 }
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Auction');
  XLSX.writeFile(workbook, `${data.auctionTitle}-results.xlsx`);
}

interface ParticipantStats {
  participantId: string;
  participantName: string;
  totalSpent: number;
  itemsWon: string[];
  grossEarnings?: number;
}

function calculateParticipantStats(
  results: ItemRoundResult[],
  participants: Participant[]
): ParticipantStats[] {
  const stats = new Map<string, ParticipantStats>();
  
  participants.forEach(participant => {
    stats.set(participant.id, {
      participantId: participant.id,
      participantName: participant.displayName,
      totalSpent: 0,
      itemsWon: [],
      grossEarnings: 0
    });
  });
  
  results.forEach(result => {
    const stat = stats.get(result.winnerId);
    if (stat) {
      stat.totalSpent += result.salePrice;
      stat.itemsWon.push(result.itemName);
      stat.grossEarnings = (stat.grossEarnings ?? 0) + (result.grossEarnings ?? 0);
    }
  });
  
  return Array.from(stats.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

// Calculate payout amounts based on total pot
export function calculatePayoutAmounts(
  totalPot: number,
  payouts: PayoutCategory[]
): { category: string; impliedAmount: number }[] {
  return payouts.map(payout => ({
    category: payout.name,
    impliedAmount: totalPot * payout.percentageOfPot
  }));
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format percentage
export function formatPercentage(decimal: number): string {
  return (decimal * 100).toFixed(1) + '%';
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

// Generate random color for avatar
export function getAvatarColor(name: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C9A8'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
