const fs = require('fs');
const path = require('path');

const flagsDir = 'public/flags';

const flagsMap = {
  brazil: { name: 'Brazil', file: 'Flag_of_Brazil.svg' },
  mexico: { name: 'Mexico', file: 'Flag_of_Mexico.svg' },
  usa: { name: 'United States', file: 'Flag_of_the_United_States.svg' },
  france: { name: 'France', file: 'france.svg' }
};

const items = [];

Object.entries(flagsMap).forEach(([id, { name, file }]) => {
  const filePath = path.join(flagsDir, file);
  const data = fs.readFileSync(filePath);
  const base64 = Buffer.from(data).toString('base64');
  const imageUrl = `data:image/png;base64,${base64}`;
  
  items.push({
    id,
    name,
    imageUrl
  });
});

const testDataContent = `import { AuctionItem, PayoutCategory } from '../types';

/**
 * Test data for development - 2026 World Cup Auction
 * 
 * TO USE: Click "Load Test Data" button in the Setup screen (only visible in npm run dev mode)
 * 
 * FLAG IMAGES: Base64-encoded PNG images embedded in this file.
 */

export const testAuctionData = {
  title: '2026 World Cup',
  items: [
    ${items.map(item => `{
      id: '${item.id}',
      name: '${item.name}',
      imageUrl: '${item.imageUrl}'
    }`).join(',\n    ')}
  ] as AuctionItem[],
  payouts: [
    {
      id: 'winner',
      name: 'Winner',
      type: 'win' as const,
      numWinners: 1,
      percentageOfPot: 0.65
    },
    {
      id: 'runner-up',
      name: 'Runner-Up',
      type: 'win' as const,
      numWinners: 1,
      percentageOfPot: 0.30
    },
    {
      id: '3rd-place',
      name: '3rd Place',
      type: 'win' as const,
      numWinners: 1,
      percentageOfPot: 0.05
    }
  ] as PayoutCategory[],
  notes: 'Test auction - 2026 World Cup teams'
};
`;

fs.writeFileSync('src/utils/testData.ts', testDataContent);
console.log('✓ Generated src/utils/testData.ts with embedded base64 images');
