/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

export default function BattleshipGame({ highScore, onUpdateHighScore }: any) {
  const [board, setBoard] = useState(Array(100).fill(0)); // 0: empty, 1: ship, 2: miss, 3: hit
  const [started, setStarted] = useState(false);
  const [hits, setHits] = useState(0);

  const initGame = () => {
    const newBoard = Array(100).fill(0);
    // Simple random placement of 5 ships of size 1 for minimum playable prototype
    let shipsPlaced = 0;
    while (shipsPlaced < 5) {
      const idx = Math.floor(Math.random() * 100);
      if (newBoard[idx] === 0) {
        newBoard[idx] = 1;
        shipsPlaced++;
      }
    }
    setBoard(newBoard);
    setStarted(true);
    setHits(0);
  };

  const handleFire = (idx: number) => {
    if (!started || board[idx] > 1) return;
    const newBoard = [...board];
    if (newBoard[idx] === 1) {
      newBoard[idx] = 3; // hit
      const newHits = hits + 1;
      setHits(newHits);
      if (newHits === 5) {
        onUpdateHighScore(highScore + 50);
        setStarted(false);
      }
    } else {
      newBoard[idx] = 2; // miss
    }
    setBoard(newBoard);
  };

  return (
    <div className="flex flex-col items-center font-mono">
      <div className="text-zinc-300 mb-4">Влучень: {hits} / 5</div>
      <div className="grid grid-cols-10 gap-1 bg-zinc-900 p-2 rounded">
        {board.map((cell, idx) => {
          let cellClass = "w-6 h-6 sm:w-8 sm:h-8 border border-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition";
          if (cell === 2) cellClass += " bg-zinc-700"; // miss
          if (cell === 3) cellClass += " bg-red-600"; // hit
          return (
            <div key={idx} onClick={() => handleFire(idx)} className={cellClass}>
              {cell === 3 && <div className="w-2 h-2 bg-yellow-400 rounded-full" />}
            </div>
          );
        })}
      </div>
      <button onClick={initGame} className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold transition">
        {started ? 'Перезапуск' : 'Почати бій'}
      </button>
      {!started && hits === 5 && <div className="mt-4 text-green-400 font-bold">Перемога!</div>}
    </div>
  );
}
