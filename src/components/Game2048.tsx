/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, RefreshCw, Sparkles, Play, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface Game2048Props {
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}

type Board2048 = number[][];

const play2048Sound = (type: 'move' | 'merge' | 'gameover') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'move') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'merge') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'gameover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (e) {}
};

export default function Game2048({ highScore, onUpdateHighScore }: Game2048Props) {
  const [board, setBoard] = useState<Board2048>(() => [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Helper: check if there are empty spots
  const getEmptyCells = (grid: Board2048) => {
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (grid[r][c] === 0) empty.push({ r, c });
      }
    }
    return empty;
  };

  // Helper: place random tile (2 or 4)
  const addRandomTile = useCallback((grid: Board2048): Board2048 => {
    const nextGrid = grid.map(row => [...row]);
    const emptyCells = getEmptyCells(nextGrid);
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      nextGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
    return nextGrid;
  }, []);

  // Initialize core 2048 board
  const initBoard = () => {
    let emptyGrid = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    emptyGrid = addRandomTile(emptyGrid);
    emptyGrid = addRandomTile(emptyGrid);
    
    setBoard(emptyGrid);
    setScore(0);
    setGameOver(false);
    setIsStarted(true);
    play2048Sound('merge');
  };

  // Move Logic in 2048: Slide grid left
  const slideLeft = (grid: Board2048): { grid: Board2048; scoreGained: number; changed: boolean } => {
    let scoreGained = 0;
    let changed = false;
    const nextGrid = grid.map((row) => {
      // 1. Shift cells (remove zeros)
      let filtered = row.filter((val) => val !== 0);
      const originalRow = [...row];
      
      // 2. Combine pairs
      const nextRow = [];
      for (let i = 0; i < filtered.length; i++) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          const mergedValue = filtered[i] * 2;
          nextRow.push(mergedValue);
          scoreGained += mergedValue;
          i++; // Skip merged tile
        } else {
          nextRow.push(filtered[i]);
        }
      }

      // 3. Match length back to 4 with trailing zeros
      while (nextRow.length < 4) {
        nextRow.push(0);
      }

      // Check if anything changed
      if (JSON.stringify(nextRow) !== JSON.stringify(originalRow)) {
        changed = true;
      }
      return nextRow;
    });

    return { grid: nextGrid, scoreGained, changed };
  };

  // Matrix utility rotations to reuse slideLeft for all moves
  const rotateRight = (grid: Board2048): Board2048 => {
    const nextGrid = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        nextGrid[c][3 - r] = grid[r][c];
      }
    }
    return nextGrid;
  };

  const rotateLeft = (grid: Board2048): Board2048 => {
    const nextGrid = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        nextGrid[3 - c][r] = grid[r][c];
      }
    }
    return nextGrid;
  };

  const handleArrowMove = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (!isStarted || gameOver) return;

    let currentGrid = board.map(row => [...row]);
    let response: { grid: Board2048; scoreGained: number; changed: boolean };

    if (dir === 'LEFT') {
      response = slideLeft(currentGrid);
    } else if (dir === 'RIGHT') {
      // Rotate 180 degrees
      let temp = rotateRight(rotateRight(currentGrid));
      let slideRes = slideLeft(temp);
      response = {
        grid: rotateLeft(rotateLeft(slideRes.grid)),
        scoreGained: slideRes.scoreGained,
        changed: slideRes.changed,
      };
    } else if (dir === 'UP') {
      let temp = rotateLeft(currentGrid);
      let slideRes = slideLeft(temp);
      response = {
        grid: rotateRight(slideRes.grid),
        scoreGained: slideRes.scoreGained,
        changed: slideRes.changed,
      };
    } else { // DOWN
      let temp = rotateRight(currentGrid);
      let slideRes = slideLeft(temp);
      response = {
        grid: rotateLeft(slideRes.grid),
        scoreGained: slideRes.scoreGained,
        changed: slideRes.changed,
      };
    }

    if (response.changed) {
      if (response.scoreGained > 0) {
        play2048Sound('merge');
      } else {
        play2048Sound('move');
      }

      const nextScore = score + response.scoreGained;
      setScore(nextScore);
      if (nextScore > highScore) {
        onUpdateHighScore(nextScore);
      }

      // Add fresh random tile
      const withRandom = addRandomTile(response.grid);
      setBoard(withRandom);

      // Check if board locked (Game Over)
      checkGameOver(withRandom);
    }
  }, [board, gameOver, isStarted, score, highScore, onUpdateHighScore, addRandomTile]);

  // Check board locks
  const checkGameOver = (grid: Board2048) => {
    // 1. If any cell is empty, not gameover
    if (getEmptyCells(grid).length > 0) return;

    // 2. If any adjacent tiles match, not gameover
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = grid[r][c];
        if (r < 3 && grid[r + 1][c] === val) return;
        if (c < 3 && grid[r][c + 1] === val) return;
      }
    }

    // Grid completely blocked
    setGameOver(true);
    play2048Sound('gameover');
  };

  // Keyboard Event attachment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let moveDir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          moveDir = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moveDir = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveDir = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveDir = 'RIGHT';
          break;
      }

      if (moveDir) {
        e.preventDefault();
        handleArrowMove(moveDir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleArrowMove]);

  // Custom styling classes for active values
  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-zinc-900 border-zinc-800 text-zinc-300';
      case 4: return 'bg-zinc-850 border-zinc-700 text-zinc-200';
      case 8: return 'bg-orange-950/40 border-orange-900 text-orange-400';
      case 16: return 'bg-orange-900/60 border-orange-700 text-orange-300';
      case 32: return 'bg-rose-950/50 border-rose-800 text-rose-400';
      case 64: return 'bg-rose-900/60 border-rose-600 text-rose-300';
      case 128: return 'bg-amber-950/50 border-amber-800 text-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.2)]';
      case 256: return 'bg-amber-900/50 border-amber-655 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
      case 512: return 'bg-yellow-950/60 border-yellow-700 text-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
      case 1024: return 'bg-emerald-950/50 border-emerald-800 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
      case 2048: return 'bg-purple-950/75 border-purple-800 text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.7)] font-bold';
      default: return 'bg-violet-950/80 border-violet-700 text-violet-100 shadow-[0_0_24px_#a855f7]';
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full text-zinc-100 p-4 font-mono select-none">
      
      {/* Header controls */}
      <div className="w-full max-w-xs flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Рахунок</span>
          <span className="text-xl font-bold font-mono text-zinc-200">{score}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-950/20 border border-amber-900/40 rounded text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span className="text-xs font-bold leading-none">{highScore}</span>
        </div>
      </div>

      {/* Grid container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xs relative my-auto">
        <div id="game-2048-board" className="relative p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg shadow-2xl w-72 h-72 grid grid-cols-4 grid-rows-4 gap-2.5">
          {board.map((row, rIdx) =>
            row.map((val, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-14 h-14 rounded-md border flex items-center justify-center text-sm font-bold tracking-tight transition-all duration-150 ${
                  val === 0 
                    ? 'bg-zinc-950/50 border-zinc-900/80 text-transparent' 
                    : getTileColor(val)
                }`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}

          {/* Overlays */}
          {(!isStarted || gameOver) && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center text-center p-4 z-20">
              {gameOver ? (
                <>
                  <div className="text-red-500 font-bold tracking-widest text-lg uppercase animate-pulse mb-1">КІНЕЦЬ ГРИ</div>
                  <div className="text-xs text-zinc-500 mb-6">Жодних ходів не залишилось. Спробуйте ще раз!</div>
                  <button
                    onClick={initBoard}
                    id="2048-retry-btn"
                    className="flex items-center gap-2 px-5 py-2 hover:bg-zinc-800 bg-zinc-900 border border-zinc-800 hover:border-zinc-500 rounded text-xs text-zinc-100 font-semibold transition active:scale-95 text-center justify-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-0.5" /> Грати знову
                  </button>
                </>
              ) : (
                <>
                  <div className="text-zinc-300 font-extrabold tracking-wider text-xl mb-2 flex items-center gap-1.5 justify-center">
                    <Sparkles className="w-5 h-5 text-zinc-300" /> PUZZLE 2048
                  </div>
                  <p className="text-xs text-zinc-500 mb-6 max-w-[200px] leading-relaxed">
                    Зсувайте плитки за допомогою стрілок чи <kbd className="px-1 py-0.2 bg-zinc-950 border border-zinc-900 rounded">WASD</kbd>. Об'єднуйте однакові числа, щоб отримати 2048!
                  </p>
                  <button
                    onClick={initBoard}
                    id="2048-start-btn"
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-transparent rounded text-xs text-zinc-950 font-bold transition active:scale-95 shadow-lg shadow-white/5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current mr-0.5" /> Почати гру
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual Touch controls */}
      <div className="w-full max-w-xs flex justify-center pt-4">
        <div className="grid grid-cols-3 gap-1.5 w-32">
          <div />
          <button
            onClick={() => handleArrowMove('UP')}
            id="btn2048-up"
            className="w-9 h-9 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div />
          
          <button
            onClick={() => handleArrowMove('LEFT')}
            id="btn2048-left"
            className="w-9 h-9 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-800" />
          </div>
          <button
            onClick={() => handleArrowMove('RIGHT')}
            id="btn2048-right"
            className="w-9 h-9 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <div />
          <button
            onClick={() => handleArrowMove('DOWN')}
            id="btn2048-down"
            className="w-9 h-9 border border-zinc-800 rounded bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 flex items-center justify-center text-zinc-400"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <div />
        </div>
      </div>

    </div>
  );
}
