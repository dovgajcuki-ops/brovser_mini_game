export type GameId = 'dino' | 'tetris' | 'snake' | 'minesweeper' | '2048' | 'pacman' | 'solitaire' | 'tictactoe' | 'arkanoid' | 'wordle' | 'sudoku' | 'mahjong' | 'alchemy' | 'chess' | 'battleship' | 'flappybird' | 'doodlejump' | 'cookieclicker' | 'mario' | 'sonic' | 'donkeykong';

export interface GameInfo {
  id: GameId;
  title: string;
  description: string;
  instructions: string;
  icon: string; // lucide icon name
  accentColor: string; // Tailwind class
}

export interface HighScores {
  dino: number;
  tetris: number;
  snake: number;
  minesweeper: number;
  '2048': number;
  pacman: number;
  solitaire: number;
  tictactoe: number;
  arkanoid: number;
  wordle: number;
  sudoku: number;
  mahjong: number;
  alchemy: number;
  chess: number;
  battleship: number;
  flappybird: number;
  doodlejump: number;
  cookieclicker: number;
  mario: number;
  sonic: number;
  donkeykong: number;
}
