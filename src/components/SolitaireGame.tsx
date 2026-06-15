/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

// Very minimal Solitaire-like card moving placeholder
const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

export default function SolitaireGame({ highScore, onUpdateHighScore }: any) {
  const [columns, setColumns] = useState(() => {
    return Array.from({length: 7}, (_, i) => 
      Array.from({length: i + 1}, () => `${VALUES[Math.floor(Math.random()*VALUES.length)]}${SUITS[Math.floor(Math.random()*SUITS.length)]}`)
    );
  });
  
  const [selected, setSelected] = useState<{col: number, row: number} | null>(null);

  const handleClick = (colIdx: number, rowIdx: number) => {
    if (selected) {
      if (selected.col !== colIdx) {
        const newCols = [...columns];
        const cardToMove = newCols[selected.col].pop(); // simplified: only move top card
        if (cardToMove) {
            newCols[colIdx].push(cardToMove);
            setColumns(newCols);
            onUpdateHighScore(highScore + 5);
        }
      }
      setSelected(null);
    } else {
        if (rowIdx === columns[colIdx].length - 1) {
            setSelected({col: colIdx, row: rowIdx});
        }
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-[400px]">
        <div className="text-zinc-500 mb-4 text-sm font-mono text-center">СПРОЩЕНИЙ ПАСЬЯНС (Клік на останню карту стовпчика, потім клік на інший стовпчик)</div>
        <div className="flex gap-2 sm:gap-4 justify-center items-start w-full">
            {columns.map((col, cIdx) => (
                <div key={cIdx} className="flex flex-col items-center w-12 sm:w-16">
                    {col.length === 0 && (
                        <div onClick={() => handleClick(cIdx, 0)} className="w-12 h-16 sm:w-16 sm:h-24 rounded border-2 border-dashed border-zinc-700 cursor-pointer" />
                    )}
                    {col.map((card, rIdx) => {
                        const isRed = card.includes('♥') || card.includes('♦');
                        return (
                        <div 
                            key={rIdx} 
                            onClick={() => handleClick(cIdx, rIdx)}
                            className={`w-12 h-16 sm:w-16 sm:h-24 bg-white rounded shadow-md border flex items-center justify-center font-bold text-sm sm:text-xl transition cursor-pointer -mt-8 first:mt-0 ${(selected?.col === cIdx && selected?.row === rIdx) ? 'ring-2 ring-blue-500 -translate-y-2' : ''}`}
                            style={{ zIndex: rIdx }}
                        >
                            <span className={isRed ? 'text-red-600' : 'text-zinc-900'}>{card}</span>
                        </div>
                    )})}
                </div>
            ))}
        </div>
    </div>
  );
}
