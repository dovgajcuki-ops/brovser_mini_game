/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

const INITIAL_BOARD = [
  5, 3, 0, 0, 7, 0, 0, 0, 0,
  6, 0, 0, 1, 9, 5, 0, 0, 0,
  0, 9, 8, 0, 0, 0, 0, 6, 0,
  8, 0, 0, 0, 6, 0, 0, 0, 3,
  4, 0, 0, 8, 0, 3, 0, 0, 1,
  7, 0, 0, 0, 2, 0, 0, 0, 6,
  0, 6, 0, 0, 0, 0, 2, 8, 0,
  0, 0, 0, 4, 1, 9, 0, 0, 5,
  0, 0, 0, 0, 8, 0, 0, 7, 9
];

export default function SudokuGame({ highScore, onUpdateHighScore }: any) {
  const [board, setBoard] = useState([...INITIAL_BOARD]);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (INITIAL_BOARD[idx] === 0) setSelected(idx);
  };

  const handleInput = (num: number) => {
    if (selected !== null) {
      const nextBoard = [...board];
      nextBoard[selected] = num;
      setBoard(nextBoard);
      
      if (!nextBoard.includes(0)) {
        onUpdateHighScore(highScore + 100);
      }
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput(0);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selected, board]);

  return (
    <div className="flex flex-col items-center text-zinc-100 font-mono select-none">
      <div className="grid grid-cols-9 gap-0 border-2 border-zinc-700 bg-zinc-950 inline-grid">
        {board.map((val, idx) => {
          const row = Math.floor(idx / 9);
          const col = idx % 9;
          const isInitial = INITIAL_BOARD[idx] !== 0;
          let cellClass = "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-zinc-800 text-lg cursor-pointer transition ";
          
          if (row % 3 === 0) cellClass += "border-t-zinc-600 ";
          if (col % 3 === 0) cellClass += "border-l-zinc-600 ";
          
          if (selected === idx) cellClass += "bg-blue-900/50 text-white ";
          else if (isInitial) cellClass += "text-zinc-500 bg-zinc-900/50 font-bold ";
          else cellClass += "text-blue-300 hover:bg-zinc-800 ";

          return (
            <div key={idx} className={cellClass} onClick={() => handleSelect(idx)}>
              {val !== 0 ? val : ''}
            </div>
          );
        })}
      </div>
      <div className="mt-6 grid grid-cols-9 gap-1 sm:gap-2">
        {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
          <button key={num} onClick={() => handleInput(num)} className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-800 hover:bg-zinc-700 rounded text-xl font-bold">
            {num}
          </button>
        ))}
        <button onClick={() => handleInput(0)} className="col-span-9 py-2 mt-2 bg-red-950/40 text-red-400 hover:bg-red-900/40 rounded transition">Очистити клітинку</button>
      </div>
    </div>
  );
}
