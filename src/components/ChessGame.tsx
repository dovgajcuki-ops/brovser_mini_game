/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users, Wifi, RotateCcw } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

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

  // Online state
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('player-joined', ({ playerIndex }) => {
        setPlayerIndex(playerIndex);
        setInRoom(true);
      });
      socket.on('game-ready', () => {
        setOpponentConnected(true);
      });
      socket.on('game-state-update', (state) => {
        setBoard(state.board);
      });
      socket.on('player-disconnected', () => {
        setOpponentConnected(false);
      });
    }
    return () => {
      if (socket) {
        socket.off('player-joined');
        socket.off('game-ready');
        socket.off('game-state-update');
        socket.off('player-disconnected');
      }
    };
  }, [socket]);

  const joinRoom = () => {
    if (!roomId) return;
    const newSocket = io();
    setSocket(newSocket);
    newSocket.emit('join-game', { roomId });
  };

  const handleClick = (r: number, c: number) => {
    if (isOnline && !opponentConnected) return;

    if (selected) {
        if (selected.r !== r || selected.c !== c) {
            const nextBoard = [...board].map(row => [...row]);
            nextBoard[r][c] = nextBoard[selected.r][selected.c];
            nextBoard[selected.r][selected.c] = '';
            setBoard(nextBoard);
            
            if (isOnline && socket) {
                socket.emit('game-state-update', { roomId, state: { board: nextBoard } });
            } else {
                onUpdateHighScore(highScore + 2); // score for a move local
            }
        }
        setSelected(null);
    } else {
        if (board[r][c] !== '') {
            setSelected({r, c});
        }
    }
  };

  const resetGame = () => {
     const nextBoard = INITIAL_BOARD.map(row => [...row]);
     setBoard(nextBoard);
     setSelected(null);
     if (isOnline && socket) {
         socket.emit('game-state-update', { roomId, state: { board: nextBoard } });
     }
  };

  if (!isOnline && !inRoom && board === board /* trigger logic */) {
     const hasMoves = JSON.stringify(board) !== JSON.stringify(INITIAL_BOARD);
     if (!hasMoves) {
       return (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="flex gap-4 mb-4">
              <button onClick={() => setBoard([...board])} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 rounded-xl text-zinc-100 hover:bg-zinc-700 font-bold">
                 Локальна гра
              </button>
              <button onClick={() => setIsOnline(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 font-bold">
                 <Wifi className="w-5 h-5" /> Грати онлайн
              </button>
            </div>
          </div>
       );
     }
  }

  if (isOnline && !inRoom) {
    return (
      <div className="flex flex-col items-center justify-center p-4 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-zinc-100">Шахи: Онлайн</h2>
        <input 
          type="text" 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)} 
          placeholder="Введіть ID кімнати"
          className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 mb-4 text-white"
        />
        <button onClick={joinRoom} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded mb-4">
          Приєднатися
        </button>
        <button onClick={() => setIsOnline(false)} className="text-zinc-400 hover:text-white text-sm">Скасувати</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      {isOnline && (
         <div className="flex items-center justify-between w-full max-w-[320px] mb-4 text-sm text-zinc-400">
            <span>Кімната: {roomId}</span>
            <span className="flex items-center gap-1">
               <Users className="w-4 h-4" /> {opponentConnected ? '2/2' : '1/2'}
            </span>
         </div>
      )}

      {isOnline && !opponentConnected && (
          <div className="text-amber-500 text-sm mb-4 animate-pulse font-bold">Очікування суперника...</div>
      )}

      <div className={`grid grid-cols-8 border-4 border-zinc-800 rounded shadow-xl ${isOnline && !opponentConnected ? 'opacity-70 pointer-events-none' : ''}`}>
        {board.map((row, rIdx) => 
          row.map((cell, cIdx) => {
              const isDark = (rIdx + cIdx) % 2 === 1;
              const isSelected = selected?.r === rIdx && selected?.c === cIdx;
              return (
                  <div 
                    key={`${rIdx}-${cIdx}`} 
                    onClick={() => handleClick(rIdx, cIdx)}
                    className={`w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-3xl sm:text-4xl cursor-pointer select-none transition-colors
                    ${isDark ? 'bg-emerald-800 text-emerald-100 hover:bg-emerald-700' : 'bg-amber-100 text-amber-900 hover:bg-amber-50'}
                    ${isSelected ? 'ring-inset ring-4 ring-blue-500 bg-blue-300' : ''}`}
                  >
                      {cell}
                  </div>
              )
          })
        )}
      </div>

      <div className="mt-4 text-xs font-mono text-zinc-500 flex flex-col items-center">
         <span>Свободний режим переміщення фігур</span>
         <button onClick={resetGame} className="mt-4 px-4 py-2 border border-zinc-800 text-zinc-300 rounded hover:bg-zinc-800 transition flex items-center gap-2">
            <RotateCcw className="w-3 h-3" /> Скинути фігури
         </button>
      </div>
    </div>
  );
}
