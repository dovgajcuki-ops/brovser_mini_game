/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RotateCcw, Users, Wifi } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function TicTacToeGame({ highScore, onUpdateHighScore }: any) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  
  // Online state
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O' | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('player-joined', ({ playerIndex }) => {
        setPlayerSymbol(playerIndex === 0 ? 'X' : 'O');
        setInRoom(true);
      });
      socket.on('game-ready', () => {
        setOpponentConnected(true);
      });
      socket.on('game-state-update', (state) => {
        setBoard(state.board);
        setXIsNext(state.xIsNext);
      });
      socket.on('player-disconnected', () => {
        setOpponentConnected(false);
        setBoard(Array(9).fill(null));
        setXIsNext(true);
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
    
    if (isOnline) {
      if (!opponentConnected) return;
      const currentSymbol = xIsNext ? 'X' : 'O';
      if (currentSymbol !== playerSymbol) return; // not your turn
    }

    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    
    setBoard(newBoard);
    setXIsNext(!xIsNext);

    if (isOnline && socket) {
      socket.emit('game-state-update', { roomId, state: { board: newBoard, xIsNext: !xIsNext } });
    }
    
    if (calculateWinner(newBoard) && !isOnline) {
      onUpdateHighScore(highScore + 1);
    }
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(b => b !== null);

  const resetGame = () => {
    const newBoard = Array(9).fill(null);
    setBoard(newBoard);
    setXIsNext(true);
    if (isOnline && socket) {
      socket.emit('game-state-update', { roomId, state: { board: newBoard, xIsNext: true } });
    }
  };

  if (!isOnline && !inRoom) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="flex gap-4 mb-8">
          <button onClick={() => setIsOnline(false)} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 rounded-xl text-zinc-100 hover:bg-zinc-700 font-bold">
             Локальна гра
          </button>
          <button onClick={() => setIsOnline(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 font-bold">
             <Wifi className="w-5 h-5" /> Грати онлайн
          </button>
        </div>
        <Board board={board} handleClick={handleClick} winner={winner} isDraw={isDraw} xIsNext={xIsNext} />
        {(winner || isDraw) && (
          <button onClick={resetGame} className="mt-6 flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded text-zinc-100 hover:bg-zinc-700">
            <RotateCcw className="w-4 h-4" /> Заново
          </button>
        )}
      </div>
    );
  }

  if (isOnline && !inRoom) {
    return (
      <div className="flex flex-col items-center justify-center p-4 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-zinc-100">Онлайн гра</h2>
        <input 
          type="text" 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)} 
          placeholder="Введіть ID кімнати (напр. 123)"
          className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 mb-4 text-white"
        />
        <button onClick={joinRoom} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded mb-4">
          Приєднатися
        </button>
        <button onClick={() => setIsOnline(false)} className="text-zinc-400 hover:text-white text-sm">Скасувати</button>
      </div>
    );
  }

  // Active online game
  return (
    <div className="flex flex-col items-center justify-center p-4">
       <div className="flex items-center justify-between w-full max-w-[250px] mb-4 text-sm text-zinc-400">
          <span>Кімната: {roomId}</span>
          <span className="flex items-center gap-1">
             <Users className="w-4 h-4" /> {opponentConnected ? '2/2' : '1/2'}
          </span>
       </div>
       <div className="mb-4 text-center">
         <div className="text-xl font-bold text-zinc-100">
           {winner ? `Переможець: ${winner}` : isDraw ? 'Нічия!' : `Хід: ${xIsNext ? 'X' : 'O'}`}
         </div>
         <div className="text-sm font-bold mt-1 text-zinc-400">
           Ви граєте за: <span className={playerSymbol === 'X' ? 'text-blue-400' : 'text-rose-400'}>{playerSymbol}</span>
         </div>
         {!opponentConnected && (
             <div className="text-amber-500 text-sm mt-2 animate-pulse font-bold">Очікування суперника...</div>
         )}
       </div>
       <Board board={board} handleClick={handleClick} winner={winner} isDraw={isDraw} xIsNext={xIsNext} />
       {(winner || isDraw) && (
          <button onClick={resetGame} className="mt-6 flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded text-zinc-100 hover:bg-zinc-700">
            <RotateCcw className="w-4 h-4" /> Заново
          </button>
       )}
    </div>
  );
}

function Board({ board, handleClick, winner, isDraw, xIsNext }: any) {
  return (
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell: any, i: number) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="w-20 h-20 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-3xl font-bold text-zinc-200 hover:bg-zinc-800 transition"
          >
            {cell && <span className={cell === 'X' ? 'text-blue-400' : 'text-rose-400'}>{cell}</span>}
          </button>
        ))}
      </div>
  );
}
