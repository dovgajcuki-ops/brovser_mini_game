/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

// Very minimal grid based mock of Chess just for UI placeholder
const INITIAL_BOARD = [
  ['♜','♞','♝','♛','♚','♝','♞','♜'],
  ['♟','♟','♟','♟','♟','♟','♟','♟'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['♙','♙','♙','♙','♙','♙','♙','♙'],
  ['♖','♘','♗','♕','♔','♗','♘','♖']
];

export default function ChessGame({ highScore, onUpdateHighScore }: any) {
  const [board, setBoard] = useState(INITIAL_BOARD.map(row => [...row]));
  const [selected, setSelected] = useState<{r: number, c: number} | null>(null);

  const handleClick = (r: number, c: number) => {
    if (selected) {
        if (selected.r !== r || selected.c !== c) {
            const nextBoard = [...board];
            nextBoard[r][c] = nextBoard[selected.r][selected.c];
            nextBoard[selected.r][selected.c] = '';
            setBoard(nextBoard);
            onUpdateHighScore(highScore + 2); // score for a move
        }
        setSelected(null);
    } else {
        if (board[r][c] !== '') {
            setSelected({r, c});
        }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-8 border-4 border-zinc-800 rounded">
        {board.map((row, rIdx) => 
          row.map((cell, cIdx) => {
              const isDark = (rIdx + cIdx) % 2 === 1;
              const isSelected = selected?.r === rIdx && selected?.c === cIdx;
              return (
                  <div 
                    key={`${rIdx}-${cIdx}`} 
                    onClick={() => handleClick(rIdx, cIdx)}
                    className={`w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center text-xl sm:text-3xl cursor-pointer select-none 
                    ${isDark ? 'bg-emerald-800 text-emerald-100' : 'bg-amber-100 text-amber-900'}
                    ${isSelected ? 'ring-inset ring-4 ring-blue-500 bg-blue-300' : ''}`}
                  >
                      {cell}
                  </div>
              )
          })
        )}
      </div>
      <div className="mt-4 text-xs font-mono text-zinc-500">Свободний режим переміщення фігур</div>
    </div>
  );
}
