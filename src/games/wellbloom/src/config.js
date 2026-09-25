export const GAME = {
  title: 'Wellbloom',
  version: '1.0.0',
  // changing the seed reshuffles every story level
  seed: 'wellbloom/1',
  saveKey: 'wellbloom.save',
  saveVersion: 1,
};

// size of one board tile in art pixels
export const TILE = 16;

// border drawn around the board, in art pixels
export const BOARD_FRAME = 5;

export const ECONOMY = {
  startingDewdrops: 3,
  dewdropsPerNewStar: 1,
  dailyReward: 3,
};

export const SUPPORTED_LANGUAGES = ['en', 'tr', 'de', 'fr', 'it', 'es', 'ar'];
export const RTL_LANGUAGES = ['ar'];
