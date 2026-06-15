/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

export default function TicTacToeGame({ highScore, onUpdateHighScore }: any) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const calculateWinner = (squares: any[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (board[i] || calculateWinner(board)) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    
    if (calculateWinner(newBoard)) {
      onUpdateHighScore(highScore + 1);
    }
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(b => b !== null);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="mb-4 text-xl font-bold text-zinc-100">
        {winner ? `Переможець: ${winner}` : isDraw ? 'Нічия!' : `Хід: ${xIsNext ? 'X' : 'O'}`}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="w-20 h-20 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl font-bold text-zinc-200 hover:bg-zinc-800 transition"
          >
            {cell && <span className={cell === 'X' ? 'text-blue-400' : 'text-rose-400'}>{cell}</span>}
          </button>
        ))}
      </div>
      {(winner || isDraw) && (
        <button onClick={() => { setBoard(Array(9).fill(null)); setXIsNext(true); }} className="mt-6 flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded text-zinc-100 hover:bg-zinc-700">
          <RotateCcw className="w-4 h-4" /> Заново
        </button>
      )}
    </div>
  );
}
