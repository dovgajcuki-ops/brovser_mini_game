/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Play, RotateCcw, ArrowDown, ArrowLeft, ArrowRight, CornerUpLeft, ChevronDown } from 'lucide-react';

interface TetrisProps {
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}

// Grid size
const COLS = 10;
const ROWS = 20;

// Tetromino configurations & shapes
const SHAPES = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

const COLORS: Record<string, string> = {
  I: 'bg-cyan-500 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
  O: 'bg-yellow-500 border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.4)]',
  T: 'bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
  S: 'bg-green-500 border-green-400 shadow-[0_0_8px_rgba(34,197,94,0.4)]',
  Z: 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
  J: 'bg-blue-500 border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
  L: 'bg-orange-500 border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
};

// Synth sounds for Tetris
const playTetrisSound = (type: 'move' | 'rotate' | 'clear' | 'gameover') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'move') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'rotate') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'clear') {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // scale C4 to G5 super rewarding!
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + idx * 0.05 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.15);
      });
    } else if (type === 'gameover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {}
};

export default function TetrisGame({ highScore, onUpdateHighScore }: TetrisProps) {
  // Board storage
  const [grid, setGrid] = useState<(string | null)[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );

  // States
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  
  // Current falling piece indices
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    type: string;
    r: number;
    c: number;
  } | null>(null);

  const gameIntervalRef = useRef<any>(null);

  // Generate random piece
  const getRandomPiece = () => {
    const keys = Object.keys(SHAPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const shape = SHAPES[type as keyof typeof SHAPES];
    return {
      shape,
      type,
      // Centered top row
      r: 0,
      c: Math.floor((COLS - shape[0].length) / 2),
    };
  };

  // Setup/Start board
  const startTetris = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setScore(0);
    setLines(0);
    setIsGameOver(false);
    setIsStarted(true);
    setCurrentPiece(getRandomPiece());
    playTetrisSound('clear');
  };

  // Collision logic
  const checkCollision = useCallback((
    pieceShape: number[][],
    startR: number,
    startC: number,
    currentGrid: (string | null)[][]
  ): boolean => {
    for (let r = 0; r < pieceShape.length; r++) {
      for (let c = 0; c < pieceShape[r].length; c++) {
        if (pieceShape[r][c] !== 0) {
          const boardR = startR + r;
          const boardC = startC + c;

          // Border check
          if (boardR >= ROWS || boardC < 0 || boardC >= COLS) {
            return true;
          }

          // Locked cell check
          if (boardR >= 0 && currentGrid[boardR][boardC] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Place current piece into locked grid state
  const lockPiece = useCallback(() => {
    if (!currentPiece) return;

    setGrid((prevGrid) => {
      const nextGrid = prevGrid.map(row => [...row]);
      
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c] !== 0) {
            const boardR = currentPiece.r + r;
            const boardC = currentPiece.c + c;
            if (boardR >= 0 && boardR < ROWS) {
              nextGrid[boardR][boardC] = currentPiece.type;
            }
          }
        }
      }

      // Check for filled lines to clear
      let clearedLines = 0;
      const cleanGrid = nextGrid.filter((row) => {
        const isFilled = row.every(cell => cell !== null);
        if (isFilled) clearedLines++;
        return !isFilled;
      });

      // Fill in cleared rows at top
      while (cleanGrid.length < ROWS) {
        cleanGrid.unshift(Array(COLS).fill(null));
      }

      // Update scores
      if (clearedLines > 0) {
        playTetrisSound('clear');
        setLines(prev => prev + clearedLines);
        setScore((prev) => {
          let extra = 100;
          if (clearedLines === 2) extra = 300;
          if (clearedLines === 3) extra = 500;
          if (clearedLines >= 4) extra = 800;
          const newScore = prev + extra;
          if (newScore > highScore) {
            onUpdateHighScore(newScore);
          }
          return newScore;
        });
      } else {
        playTetrisSound('move');
      }

      // Spawn next piece
      const nextPiece = getRandomPiece();
      if (checkCollision(nextPiece.shape, nextPiece.r, nextPiece.c, cleanGrid)) {
        // Top block reached, gameover
        setIsGameOver(true);
        playTetrisSound('gameover');
      } else {
        setCurrentPiece(nextPiece);
      }

      return cleanGrid;
    });
  }, [currentPiece, checkCollision, highScore, onUpdateHighScore]);

  // Drop core tick move
  const dropPiece = useCallback(() => {
    if (!isStarted || isGameOver || !currentPiece) return;

    if (!checkCollision(currentPiece.shape, currentPiece.r + 1, currentPiece.c, grid)) {
      setCurrentPiece(prev => prev ? { ...prev, r: prev.r + 1 } : null);
    } else {
      lockPiece();
    }
  }, [isStarted, isGameOver, currentPiece, grid, checkCollision, lockPiece]);

  // Moving piece sideways
  const handleSideMove = useCallback((offset: number) => {
    if (!isStarted || isGameOver || !currentPiece) return;
    if (!checkCollision(currentPiece.shape, currentPiece.r, currentPiece.c + offset, grid)) {
      playTetrisSound('move');
      setCurrentPiece(prev => prev ? { ...prev, c: prev.c + offset } : null);
    }
  }, [isStarted, isGameOver, currentPiece, grid, checkCollision]);

  // Rotate falling array clockwise matching bounding sizes
  const rotatePiece = useCallback(() => {
    if (!isStarted || isGameOver || !currentPiece) return;

    const shape = currentPiece.shape;
    const nextShape = Array.from({ length: shape[0].length }, (_, r) =>
      Array.from({ length: shape.length }, (_, c) => shape[shape.length - 1 - c][r])
    );

    // Wall-kick behavior if rotated off outer boundary blocks
    let nextCol = currentPiece.c;
    if (nextCol + nextShape[0].length > COLS) {
      nextCol = COLS - nextShape[0].length;
    }
    if (nextCol < 0) nextCol = 0;

    if (!checkCollision(nextShape, currentPiece.r, nextCol, grid)) {
      playTetrisSound('rotate');
      setCurrentPiece(prev => prev ? { ...prev, shape: nextShape, c: nextCol } : null);
    }
  }, [isStarted, isGameOver, currentPiece, grid, checkCollision]);

  // Drop fall helper
  const hardDrop = useCallback(() => {
    if (!isStarted || isGameOver || !currentPiece) return;

    let targetR = currentPiece.r;
    while (!checkCollision(currentPiece.shape, targetR + 1, currentPiece.c, grid)) {
      targetR++;
    }

    playTetrisSound('move');
    setCurrentPiece(prev => prev ? { ...prev, r: targetR } : null);
    // Timeout to lock
    setTimeout(() => {
      lockPiece();
    }, 40);
  }, [isStarted, isGameOver, currentPiece, grid, checkCollision, lockPiece]);

  // Running Loop triggers matching cleared lines speed levels
  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const currentSpeed = Math.max(100, 700 - lines * 15); // Speed acceleration!
    gameIntervalRef.current = setInterval(() => {
      dropPiece();
    }, currentSpeed);

    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    };
  }, [isStarted, isGameOver, dropPiece, lines]);

  // Keyboard binding controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStarted || isGameOver) return;

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          e.preventDefault();
          handleSideMove(-1);
          break;
        case 'arrowright':
        case 'd':
          e.preventDefault();
          handleSideMove(1);
          break;
        case 'arrowup':
        case 'w':
          e.preventDefault();
          rotatePiece();
          break;
        case 'arrowdown':
        case 's':
          e.preventDefault();
          dropPiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isGameOver, handleSideMove, dropPiece, rotatePiece, hardDrop]);

  // Render complete overlay grid state incorporating active falling tetromino coords
  const renderBoard = () => {
    const screenGrid = grid.map(row => [...row]);

    if (currentPiece) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c] !== 0) {
            const boardR = currentPiece.r + r;
            const boardC = currentPiece.c + c;
            if (boardR >= 0 && boardR < ROWS && boardC >= 0 && boardC < COLS) {
              screenGrid[boardR][boardC] = currentPiece.type;
            }
          }
        }
      }
    }

    return screenGrid;
  };

  const finalGrid = renderBoard();

  return (
    <div className="flex flex-col items-center justify-between h-full text-zinc-100 p-2 sm:p-4 font-mono select-none">
      
      {/* Side stats row */}
      <div className="w-full max-w-sm flex items-center justify-between border-b border-zinc-900 pb-3 mb-2.5">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Очки</span>
          <span className="text-lg font-bold text-zinc-200 leading-tight">{score}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Лінії</span>
          <span className="text-lg font-bold text-zinc-300 leading-tight">{lines}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/20 border border-amber-900/40 rounded text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span className="text-xs font-bold leading-none">{highScore}</span>
        </div>
      </div>

      {/* Main Board Center Stage */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative my-auto py-1">
        <div id="tetris-board-grid" className="relative p-1 bg-zinc-950 border-2 border-zinc-900 rounded shadow-2xl w-[190px] h-[364px] sm:w-[210px] sm:h-[404px] grid grid-cols-10 grid-rows-20 gap-[1px]">
          {finalGrid.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`rounded-[1px] transition-colors duration-75 border-[0.5px] border-zinc-950/20 ${
                  cell 
                    ? COLORS[cell] 
                    : 'bg-zinc-900/40 border-zinc-900/10'
                }`}
              />
            ))
          )}

          {/* Overlays / Screens */}
          {(!isStarted || isGameOver) && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center text-center p-4 z-20">
              {isGameOver ? (
                <>
                  <div className="text-red-500 font-bold tracking-widest text-sm uppercase animate-pulse mb-1">СЕСІЮ ЗАКІНЧЕНО</div>
                  <div className="text-xs text-zinc-500 mb-6 font-mono">Ви набрали {score} очок!</div>
                  <button
                    onClick={startTetris}
                    id="tetris-retry-btn"
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-500 rounded text-xs text-zinc-100 font-bold transition active:scale-95 text-center justify-center"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-0.5" /> Спробувати знову
                  </button>
                </>
              ) : (
                <>
                  <div className="text-zinc-300 font-extrabold tracking-wider text-base mb-2 select-none uppercase">
                    КЛАСИЧНИЙ ТЕТРІС
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-5 max-w-[150px] leading-relaxed">
                    Керування стрілками чи <kbd className="px-1 py-0.2 bg-zinc-900 border border-zinc-800/80 rounded">WASD</kbd>. <kbd className="px-1 py-0.2 bg-zinc-900 border border-zinc-800 rounded">Space</kbd> для миттєвого спуску.
                  </p>
                  <button
                    onClick={startTetris}
                    id="tetris-start-btn"
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-transparent rounded text-xs text-zinc-950 font-extrabold transition active:scale-95 shadow-lg shadow-white/5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current mr-0.5" /> Грати
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual buttons for Mobile screens */}
      {isStarted && !isGameOver && (
        <div className="w-full max-w-sm flex items-center justify-between gap-2.5 pt-3">
          <div className="flex gap-1.5">
            <button
              onClick={() => handleSideMove(-1)}
              id="tetris-left-btn"
              className="w-10 h-10 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold"
              title="Вліво"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSideMove(1)}
              id="tetris-right-btn"
              className="w-10 h-10 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold"
              title="Вправо"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={rotatePiece}
            id="tetris-rotate-btn"
            className="w-11 h-11 border border-zinc-800 rounded-full bg-zinc-900 hover:bg-zinc-800 active:bg-zoom hover:border-zinc-550 flex items-center justify-center text-zinc-300 font-extrabold"
            title="Обертання"
          >
            <CornerUpLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-1.5">
            <button
              onClick={dropPiece}
              id="tetris-soft-drop-btn"
              className="w-10 h-10 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold"
              title="Прискорити"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onClick={hardDrop}
              id="tetris-hard-drop-btn"
              className="w-10 h-10 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold"
              title="Скинути"
            >
              <ChevronDown className="w-5 h-5 text-zinc-300 animate-bounce" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
