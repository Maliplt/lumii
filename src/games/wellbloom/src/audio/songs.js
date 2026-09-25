// original loops, one per screen mood
export const SONGS = {
  menu: {
    bpm: 104,
    tracks: [
      {
        wave: 'square',
        volume: 0.045,
        notes: `E5 - G5 - C6 - B5 A5 | G5 - - - E5 - - - | F5 - A5 - C6 - A5 G5 | E5 - - - - - . .
                D5 - F5 - A5 - G5 F5 | E5 - G5 - C6 - - - | B5 - A5 - G5 - F5 D5 | C5 - - - . . . .`,
      },
      {
        wave: 'triangle',
        volume: 0.11,
        notes: `C3 - . C3 G2 - . G2 | C3 - . C3 G2 - . G2 | F2 - . F2 C3 - . C3 | C3 - . C3 G2 - . G2
                D3 - . D3 A2 - . A2 | C3 - . C3 G2 - . G2 | G2 - . G2 D3 - . D3 | C3 - . C3 G2 - C3 .`,
      },
      {
        wave: 'square',
        volume: 0.018,
        notes: `. E4 . G4 . E4 . G4 | . E4 . G4 . E4 . G4 | . F4 . A4 . F4 . A4 | . E4 . G4 . E4 . G4
                . F4 . A4 . F4 . A4 | . E4 . G4 . E4 . G4 | . B3 . D4 . B3 . D4 | . E4 . G4 . C4 . .`,
      },
    ],
  },

  meadow: {
    bpm: 112,
    tracks: [
      {
        wave: 'square',
        volume: 0.042,
        notes: `F5 - A5 - C6 - A5 - | G5 - Bb5 - A5 G5 F5 - | E5 - G5 - Bb5 - G5 E5 | F5 - - - C5 - - -
                D5 - F5 - A5 - F5 D5 | C5 - E5 - G5 - A5 Bb5 | A5 - G5 - F5 - E5 G5 | F5 - - - . . . .`,
      },
      {
        wave: 'triangle',
        volume: 0.11,
        notes: `F2 . C3 . F2 . C3 . | C3 . G2 . C3 . G2 . | C3 . G2 . C3 . Bb2 . | F2 . C3 . F2 . A2 .
                D3 . A2 . D3 . A2 . | C3 . G2 . C3 . G2 . | Bb2 . F2 . C3 . C3 . | F2 . C3 . F2 - - -`,
      },
      {
        wave: 'noise',
        volume: 0.025,
        notes: `. . x . . . x . | . . x . . . x x | . . x . . . x . | . . x . . . x .
                . . x . . . x . | . . x . . . x x | . . x . . . x . | . . x . . . . .`,
      },
    ],
  },

  canyon: {
    bpm: 96,
    tracks: [
      {
        wave: 'square',
        volume: 0.042,
        notes: `A4 - - C5 D5 - E5 - | G5 - E5 - D5 - - - | C5 - D5 - E5 - G5 E5 | A5 - - - - - . .
                G5 - E5 - D5 - C5 - | D5 - E5 - C5 - A4 - | G4 - A4 - C5 - D5 C5 | A4 - - - . . . .`,
      },
      {
        wave: 'triangle',
        volume: 0.12,
        notes: `A2 . E3 . A2 . E3 . | G2 . D3 . G2 . D3 . | F2 . C3 . F2 . C3 . | A2 . E3 . A2 . E3 .
                E2 . B2 . E2 . B2 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . D3 . | A2 . E3 . A2 - - -`,
      },
      {
        wave: 'noise',
        volume: 0.03,
        notes: `x . . x . . x . | x . . x . . x . | x . . x . . x . | x . . x . x x .
                x . . x . . x . | x . . x . . x . | x . . x . . x . | x . . . . . . .`,
      },
    ],
  },

  frost: {
    bpm: 84,
    tracks: [
      {
        wave: 'sine',
        volume: 0.07,
        notes: `F#5 - A5 - D6 - - - | C#6 - A5 - E5 - - - | D5 - F#5 - B5 - A5 - | A5 - - - - - . .
                G5 - B5 - D6 - B5 - | A5 - F#5 - D5 - - - | E5 - G5 - F#5 - E5 - | D5 - - - . . . .`,
      },
      {
        wave: 'triangle',
        volume: 0.1,
        notes: `D3 - - - A2 - - - | A2 - - - E3 - - - | B2 - - - F#2 - - - | A2 - - - - - - -
                G2 - - - D3 - - - | D3 - - - A2 - - - | A2 - - - A2 - - - | D3 - - - - - - -`,
      },
      {
        wave: 'sine',
        volume: 0.03,
        notes: `D4 F#4 A4 D5 A4 F#4 D4 F#4 | A3 C#4 E4 A4 E4 C#4 A3 C#4 | B3 D4 F#4 B4 F#4 D4 B3 D4 | A3 C#4 E4 A4 E4 C#4 A3 C#4
                G3 B3 D4 G4 D4 B3 G3 B3 | D4 F#4 A4 D5 A4 F#4 D4 F#4 | A3 C#4 E4 A4 E4 C#4 A3 C#4 | D4 F#4 A4 D5 A4 . . .`,
      },
    ],
  },

  twilight: {
    bpm: 76,
    tracks: [
      {
        wave: 'triangle',
        volume: 0.08,
        notes: `E5 - - - A5 - G5 - | E5 - - - D5 - C5 - | D5 - - - E5 - G5 - | E5 - - - - - . .
                C5 - - - D5 - E5 - | G5 - - - A5 - G5 E5 | D5 - - - C5 - B4 - | A4 - - - . . . .`,
      },
      {
        wave: 'sine',
        volume: 0.12,
        notes: `A2 - - - E3 - - - | F2 - - - C3 - - - | G2 - - - D3 - - - | A2 - - - E3 - - -
                F2 - - - C3 - - - | C3 - - - G2 - - - | G2 - - - D3 - - - | A2 - - - - - - -`,
      },
      {
        wave: 'sine',
        volume: 0.03,
        notes: `A3 C4 E4 A4 E4 C4 A3 C4 | F3 A3 C4 F4 C4 A3 F3 A3 | G3 B3 D4 G4 D4 B3 G3 B3 | A3 C4 E4 A4 E4 C4 A3 C4
                F3 A3 C4 F4 C4 A3 F3 A3 | C4 E4 G4 C5 G4 E4 C4 E4 | G3 B3 D4 G4 D4 B3 G3 B3 | A3 C4 E4 A4 E4 . . .`,
      },
    ],
  },

  sky: {
    bpm: 116,
    tracks: [
      {
        wave: 'square',
        volume: 0.042,
        notes: `D5 - G5 - B5 - A5 G5 | A5 - D6 - B5 - - - | C6 - B5 - A5 - G5 A5 | B5 - - - G5 - - -
                E5 - G5 - C6 - B5 A5 | B5 - G5 - D5 - - - | E5 - F#5 - G5 - A5 F#5 | G5 - - - . . . .`,
      },
      {
        wave: 'triangle',
        volume: 0.11,
        notes: `G2 . D3 . G2 . D3 . | D3 . A2 . D3 . A2 . | C3 . G2 . A2 . E3 . | G2 . D3 . G2 . B2 .
                C3 . G2 . C3 . G2 . | G2 . D3 . G2 . D3 . | D3 . A2 . D3 . F#3 . | G2 . D3 . G2 - - -`,
      },
      {
        wave: 'square',
        volume: 0.017,
        notes: `. B4 . D5 . B4 . D5 | . A4 . D5 . A4 . F#4 | . C5 . E5 . A4 . C5 | . B4 . D5 . B4 . D5
                . C5 . E5 . C5 . E5 | . B4 . D5 . B4 . D5 | . A4 . C5 . A4 . D5 | . B4 . D5 . G4 . .`,
      },
    ],
  },
};
