/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

// Simplified Mahjong prototype
const TILES = ['🀀','🀁','🀂','🀃','🀄','🀅','🀆','🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏'];

export default function MahjongGame({ highScore, onUpdateHighScore }: any) {
  const [board, setBoard] = useState(() => {
    let arr = [...TILES, ...TILES, ...TILES, ...TILES].sort(() => Math.random() - 0.5);
    return arr.map((t, i) => ({ id: i, val: t, active: true }));
  });
  
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (!board[idx].active) return;
    
    if (selected === null) {
      setSelected(idx);
    } else {
      if (selected !== idx && board[selected].val === board[idx].val) {
        // match
        const newBoard = [...board];
        newBoard[selected].active = false;
        newBoard[idx].active = false;
        setBoard(newBoard);
        setSelected(null);
        
        onUpdateHighScore(highScore + 10);
      } else {
        setSelected(idx); // change selection
      }
    }
  };

  const isWon = board.every(t => !t.active);

  return (
    <div className="flex flex-col items-center p-4">
      <div className="grid grid-cols-8 gap-1 sm:gap-2 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        {board.map((tile, i) => (
          <div 
            key={tile.id} 
            onClick={() => handleSelect(i)}
            className={`w-8 h-10 sm:w-12 sm:h-16 flex items-center justify-center text-xl sm:text-3xl rounded shadow transition ${tile.active ? 'bg-amber-100 text-zinc-900 cursor-pointer hover:-translate-y-1' : 'opacity-0 pointer-events-none'} ${selected === i ? 'ring-4 ring-blue-500 bg-amber-200' : ''}`}
          >
            {tile.val}
          </div>
        ))}
      </div>
      {isWon && <div className="mt-6 text-2xl text-green-400 font-bold">Рівень Пройдено!</div>}
    </div>
  );
}
