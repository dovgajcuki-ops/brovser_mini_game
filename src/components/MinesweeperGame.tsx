/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Flag, RefreshCw, Trophy, Skull, Zap } from 'lucide-react';

interface MinesweeperProps {
  highScore: number;
  onUpdateHighScore: (score: number) => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface BoardConfig {
  rows: number;
  cols: number;
  mines: number;
}

const CONFIGS: Record<Difficulty, BoardConfig> = {
  easy: { rows: 8, cols: 8, mines: 10 },
  medium: { rows: 12, cols: 12, mines: 25 },
  hard: { rows: 15, cols: 15, mines: 45 },
};

interface Cell {
  row: number;
  col: number;
  hasMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  count: number;
}

// Retro sound effect generator using Web Audio API
const playSound = (type: 'reveal' | 'flag' | 'explosion' | 'win') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'reveal') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'flag') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'explosion') {
      // Noise buffer for explosion
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.4);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } else if (type === 'win') {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + idx * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.2);
      });
    }
  } catch (e) {
    // Web audio blocked or unsupported
  }
};

export default function MinesweeperGame({ highScore, onUpdateHighScore }: MinesweeperProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [timer, setTimer] = useState(0);
  const [mineCount, setMineCount] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  
  const timerId = useRef<any>(null);

  // Initialize Board
  const initBoard = (currentDifficulty: Difficulty) => {
    const config = CONFIGS[currentDifficulty];
    const newBoard: Cell[][] = Array.from({ length: config.rows }, (_, r) =>
      Array.from({ length: config.cols }, (_, c) => ({
        row: r,
        col: c,
        hasMine: false,
        isRevealed: false,
        isFlagged: false,
        count: 0,
      }))
    );
    setBoard(newBoard);
    setGameOver(false);
    setWin(false);
    setTimer(0);
    setMineCount(config.mines);
    setFirstClick(true);
    if (timerId.current) clearInterval(timerId.current);
  };

  useEffect(() => {
    initBoard(difficulty);
    return () => {
      if (timerId.current) clearInterval(timerId.current);
    };
  }, [difficulty]);

  // Restart trigger
  const handleRestart = () => {
    playSound('reveal');
    initBoard(difficulty);
  };

  // Start timer
  const startTimer = () => {
    if (timerId.current) clearInterval(timerId.current);
    timerId.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  // Generate Mines after first click to guarantee safety
  const generateMines = (safeRow: number, safeCol: number, currentBoard: Cell[][]) => {
    const config = CONFIGS[difficulty];
    let minesPlaced = 0;
    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));

    while (minesPlaced < config.mines) {
      const r = Math.floor(Math.random() * config.rows);
      const c = Math.floor(Math.random() * config.cols);

      // Distance check to make sure the first clicked area is completely safe (radius 1)
      const distRow = Math.abs(r - safeRow);
      const distCol = Math.abs(c - safeCol);
      const isTooClose = distRow <= 1 && distCol <= 1;

      if (!newBoard[r][c].hasMine && !isTooClose) {
        newBoard[r][c].hasMine = true;
        minesPlaced++;
      }
    }

    // Calculate neighborhood numbers
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!newBoard[r][c].hasMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
                if (newBoard[nr][nc].hasMine) count++;
              }
            }
          }
          newBoard[r][c].count = count;
        }
      }
    }

    return newBoard;
  };

  // Reveal empty adjacent area recursively
  const revealCell = (r: number, c: number, currentBoard: Cell[][]): Cell[][] => {
    const config = CONFIGS[difficulty];
    const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })));
    const queue: [number, number][] = [[r, c]];
    newBoard[r][c].isRevealed = true;

    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      
      if (newBoard[currR][currC].count === 0 && !newBoard[currR][currC].hasMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
              const target = newBoard[nr][nc];
              if (!target.isRevealed && !target.isFlagged && !target.hasMine) {
                newBoard[nr][nc].isRevealed = true;
                if (target.count === 0) {
                  queue.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }

    return newBoard;
  };

  // Handle clicking on a cell
  const handleClick = (r: number, c: number) => {
    if (gameOver || win || board[r][c].isRevealed || board[r][c].isFlagged) return;

    let currentBoard = board;

    if (firstClick) {
      setFirstClick(false);
      currentBoard = generateMines(r, c, board);
      startTimer();
    }

    // Step on mine
    if (currentBoard[r][c].hasMine) {
      // Game Over
      playSound('explosion');
      if (timerId.current) clearInterval(timerId.current);
      
      const lossBoard = currentBoard.map(row =>
        row.map(cell => {
          if (cell.hasMine) {
            return { ...cell, isRevealed: true };
          }
          return cell;
        })
      );
      setBoard(lossBoard);
      setGameOver(true);
      return;
    }

    // Reveal Safe Block
    playSound('reveal');
    const nextBoard = revealCell(r, c, currentBoard);
    setBoard(nextBoard);
    checkWin(nextBoard);
  };

  // Check victory condition
  const checkWin = (currentBoard: Cell[][]) => {
    const config = CONFIGS[difficulty];
    let unrevealedSafeCells = 0;

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        const cell = currentBoard[r][c];
        if (!cell.hasMine && !cell.isRevealed) {
          unrevealedSafeCells++;
        }
      }
    }

    if (unrevealedSafeCells === 0) {
      // WIN
      playSound('win');
      if (timerId.current) clearInterval(timerId.current);
      setWin(true);

      // Save record (standard metric: time in seconds, or high score based on difficulty and time)
      // Standard easy = rows*cols - mines cleared. Let's do a score: Difficulty factor * 1000 - time.
      const multiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
      const calculatedScore = Math.max(10, 1000 * multiplier - timer);
      if (highScore === 0 || calculatedScore > highScore) {
        onUpdateHighScore(calculatedScore);
      }
    }
  };

  // Handle Flagging (Right click or tap toggling)
  const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || win || board[r][c].isRevealed) return;

    playSound('flag');
    const newBoard = board.map(row => row.map(cell => {
      if (cell.row === r && cell.col === c) {
        const nextFlagState = !cell.isFlagged;
        setMineCount(prev => prev + (nextFlagState ? -1 : 1));
        return { ...cell, isFlagged: nextFlagState };
      }
      return cell;
    }));
    setBoard(newBoard);
  };

  // Colors for miner alerts
  const countColor = (count: number) => {
    switch (count) {
      case 1: return 'text-blue-400 font-bold';
      case 2: return 'text-green-400 font-bold';
      case 3: return 'text-red-400 font-bold';
      case 4: return 'text-indigo-400 font-bold font-extrabold';
      case 5: return 'text-amber-500 font-bold';
      case 6: return 'text-cyan-400 font-bold';
      case 7: return 'text-pink-400 font-bold';
      case 8: return 'text-purple-400 font-bold';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full text-zinc-100 p-4 font-mono select-none">
      {/* Upper Control Bar */}
      <div className="w-full max-w-md flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3 mb-3">
        <div className="flex gap-1">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`px-2 py-1 text-xs uppercase tracking-widest border transition ${
                difficulty === diff
                  ? 'bg-zinc-800 border-zinc-500 text-zinc-100 font-bold'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {diff === 'easy' ? 'Легко' : diff === 'medium' ? 'Сер.': 'Важко'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs text-amber-400/90 bg-amber-950/20 px-2 py-1 border border-amber-900/40 rounded">
          <Trophy className="w-3.5 h-3.5 mr-1" />
          <span>Рекорд: </span>
          <span className="font-bold">{highScore}</span>
        </div>
      </div>

      {/* Info Stats Row */}
      <div className="w-full max-w-md grid grid-cols-3 gap-2 py-2 px-3 bg-zinc-950 border border-zinc-900 rounded mb-4 text-center">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Міни</div>
          <div className="text-lg font-bold text-red-500 font-mono tracking-wider">
            {String(Math.max(0, mineCount)).padStart(3, '0')}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={handleRestart}
            id="ms-restart-btn"
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded transition active:scale-95 text-zinc-300"
            title="Заново"
          >
            <RefreshCw className={`w-5 h-5 ${gameOver ? 'animate-pulse text-red-500' : win ? 'text-green-400' : ''}`} />
          </button>
        </div>

        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Час</div>
          <div className="text-lg font-bold text-zinc-300 font-mono tracking-wider">
            {String(timer).padStart(3, '0')}
          </div>
        </div>
      </div>

      {/* Main Grid Board */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden my-auto py-2">
        <div
          id="ms-board-container"
          className="grid gap-0.5 p-2 bg-zinc-950 border-2 border-zinc-900 rounded shadow-2xl h-full aspect-auto sm:gap-1"
          style={{
            gridTemplateRows: `repeat(${CONFIGS[difficulty].rows}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${CONFIGS[difficulty].cols}, minmax(0, 1fr))`,
            aspectRatio: `${CONFIGS[difficulty].cols} / ${CONFIGS[difficulty].rows}`,
            maxHeight: "100%",
            maxWidth: "100%"
          }}
        >
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isRevealed = cell.isRevealed;
              const isFlagged = cell.isFlagged;
              const hasMine = cell.hasMine;

              let cellClass = "w-full h-full text-[10px] sm:text-[11px] md:text-xs font-bold flex items-center justify-center rounded border cursor-pointer select-none transition-all duration-100 min-w-0 min-h-0 ";
              
              if (isRevealed) {
                cellClass += hasMine 
                  ? "bg-red-950/80 border-red-900 text-red-200" 
                  : "bg-zinc-900/50 border-zinc-900";
              } else {
                cellClass += isFlagged 
                  ? "bg-zinc-900/90 border-zinc-800 hover:bg-zinc-800" 
                  : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 active:bg-zinc-600";
              }

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleClick(rIdx, cIdx)}
                  onContextMenu={(e) => handleRightClick(e, rIdx, cIdx)}
                  className={cellClass}
                >
                  {isRevealed ? (
                    hasMine ? (
                      <Skull className="w-4 h-4 text-red-500" />
                    ) : (
                      cell.count > 0 ? (
                        <span className={countColor(cell.count)}>{cell.count}</span>
                      ) : ''
                    )
                  ) : (
                    isFlagged ? (
                      <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10 animate-bounce" />
                    ) : ''
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Controls description / Mobile hints */}
      <div className="w-full max-w-md border-t border-zinc-900 pt-3 mt-4 text-center">
        {gameOver && (
          <div className="text-red-500 text-center font-bold text-xs uppercase tracking-wider mb-2 animate-pulse">
            💥 Ви натрапили на міну! Спробуйте ще раз.
          </div>
        )}
        {win && (
          <div className="text-green-400 text-center font-bold text-xs uppercase tracking-wider mb-2 animate-bounce">
            🎉 Чудово! Всі міни знешкоджено!
          </div>
        )}
        {!gameOver && !win && (
          <div className="text-[11px] text-zinc-500 leading-relaxed flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-zinc-400" /> ЛКМ: Відкрити
            </span>
            <span className="flex items-center gap-1">
              <Flag className="w-3 h-3 text-amber-500" /> ПКМ / Довгий дотик: Прапорець
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
