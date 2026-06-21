/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Users, Wifi, Target, RotateCcw } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export default function BattleshipGame({ highScore, onUpdateHighScore }: any) {
  const [board, setBoard] = useState(Array(100).fill(0)); // 0: empty, 1: ship (hidden), 2: miss, 3: hit
  const [hits, setHits] = useState(0);

  // Online state
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('player-joined', ({ playerIndex }) => {
        setPlayerIndex(playerIndex);
        setInRoom(true);
        if (playerIndex === 0) setIsMyTurn(true);
      });
      socket.on('game-ready', () => {
        setOpponentConnected(true);
      });
      socket.on('game-action', (action) => {
        if (action.type === 'FIRE') {
          // Check our board, wait, in Battleship players have separate boards.
          // Since the original was just 1 board for 1 player, we can make it a shared board where players hunt ships planted by the server.
          // Or we can just synchronize the board completely like tic-tac-toe, where player 1 and 2 try to hit ships and whoever hits more wins.
        }
      });
      socket.on('game-state-update', (state) => {
        setBoard(state.board);
        setHits(state.hits || 0);
        setIsMyTurn(state.nextTurn === playerIndex);
        if (state.gameOver) setGameOver(true);
      });
      socket.on('player-disconnected', () => {
        setOpponentConnected(false);
        setGameOver(true);
      });
    }
    return () => {
      if (socket) {
        socket.off('player-joined');
        socket.off('game-ready');
        socket.off('game-action');
        socket.off('game-state-update');
        socket.off('player-disconnected');
      }
    };
  }, [socket, playerIndex]);

  const joinRoom = () => {
    if (!roomId) return;
    const newSocket = io();
    setSocket(newSocket);
    newSocket.emit('join-game', { roomId });
  };

  const initLocalGame = () => {
    const newBoard = Array(100).fill(0);
    let shipsPlaced = 0;
    while (shipsPlaced < 5) {
      const idx = Math.floor(Math.random() * 100);
      if (newBoard[idx] === 0) {
        newBoard[idx] = 1;
        shipsPlaced++;
      }
    }
    setBoard(newBoard);
    setHits(0);
    setGameOver(false);
  };

  const startGameOnline = () => {
    const newBoard = Array(100).fill(0);
    let shipsPlaced = 0;
    while (shipsPlaced < 5) {
      const idx = Math.floor(Math.random() * 100);
      if (newBoard[idx] === 0) {
        newBoard[idx] = 1;
        shipsPlaced++;
      }
    }
    setBoard(newBoard);
    setHits(0);
    setGameOver(false);
    socket?.emit('game-state-update', { roomId, state: { board: newBoard, hits: 0, nextTurn: 0, gameOver: false } });
  };

  const handleFire = (idx: number) => {
    if (gameOver || board[idx] > 1) return;
    
    if (isOnline) {
      if (!opponentConnected || !isMyTurn) return;
    }

    const newBoard = [...board];
    let newHits = hits;
    let turnContinues = false;

    if (newBoard[idx] === 1) {
      newBoard[idx] = 3; // hit
      newHits += 1;
      setHits(newHits);
      turnContinues = true; // hit gives another turn
      if (newHits === 5) {
        setGameOver(true);
        if (!isOnline) onUpdateHighScore(highScore + 50);
      }
    } else {
      newBoard[idx] = 2; // miss
    }
    setBoard(newBoard);

    if (isOnline && socket) {
      const nextTurn = turnContinues ? playerIndex : (playerIndex === 0 ? 1 : 0);
      socket.emit('game-state-update', { 
         roomId, 
         state: { board: newBoard, hits: newHits, nextTurn, gameOver: newHits === 5 } 
      });
      setIsMyTurn(turnContinues);
    }
  };

  if (!isOnline && !inRoom && !gameOver && hits === 0 && board.every(c => c === 0)) {
     // Initial screen
     return (
        <div className="flex flex-col items-center justify-center p-4">
          <div className="flex gap-4 mb-4">
            <button onClick={initLocalGame} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 rounded-xl text-zinc-100 hover:bg-zinc-700 font-bold">
               Локальна гра
            </button>
            <button onClick={() => setIsOnline(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 font-bold">
               <Wifi className="w-5 h-5" /> Грати онлайн
            </button>
          </div>
        </div>
     );
  }

  if (isOnline && !inRoom) {
    return (
      <div className="flex flex-col items-center justify-center p-4 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-zinc-100">Морський бій: Онлайн</h2>
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
    <div className="flex flex-col items-center font-mono p-4">
      {isOnline && (
         <div className="flex items-center justify-between w-full max-w-[320px] mb-4 text-sm text-zinc-400">
            <span>Кімната: {roomId}</span>
            <span className="flex items-center gap-1">
               <Users className="w-4 h-4" /> {opponentConnected ? '2/2' : '1/2'}
            </span>
         </div>
      )}
      <div className="text-zinc-300 mb-2 flex items-center gap-2 font-bold text-lg">
         <Target className="w-5 h-5" /> Влучень: <span className={hits === 5 ? 'text-green-400' : 'text-white'}>{hits} / 5</span>
      </div>
      
      {isOnline && opponentConnected && !gameOver && (
          <div className={`mb-4 font-bold ${isMyTurn ? 'text-blue-400' : 'text-zinc-500'}`}>
             {isMyTurn ? 'Ваш хід!' : 'Хід суперника...'}
          </div>
      )}

      {isOnline && !opponentConnected && !gameOver && (
          <div className="text-amber-500 text-sm mb-4 animate-pulse font-bold">Очікування суперника...</div>
      )}

      <div className={`grid grid-cols-10 gap-1 bg-zinc-900 p-2 rounded ${(isOnline && (!isMyTurn || !opponentConnected)) ? 'opacity-70 pointer-events-none' : ''}`}>
        {board.map((cell, idx) => {
          let cellClass = "w-6 h-6 sm:w-8 sm:h-8 border border-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition";
          if (cell === 2) cellClass += " bg-zinc-700"; // miss
          if (cell === 3) cellClass += " bg-red-600 border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]"; // hit
          return (
            <div key={idx} onClick={() => handleFire(idx)} className={cellClass}>
              {cell === 3 && <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />}
              {cell === 2 && <div className="w-2 h-2 bg-zinc-500 rounded-full" />}
            </div>
          );
        })}
      </div>
      
      {gameOver && (
        <div className="mt-6 flex flex-col items-center">
            <div className="mb-4 text-xl text-green-400 font-bold">Гра закінчена! {hits === 5 ? 'Усі кораблі знищено!' : ''}</div>
            <button onClick={isOnline ? startGameOnline : initLocalGame} className="px-6 py-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold transition shadow-lg hover:shadow-blue-600/20">
              <RotateCcw className="w-5 h-5" /> Почати нову гру
            </button>
        </div>
      )}

      {isOnline && inRoom && playerIndex === 0 && hits === 0 && !gameOver && opponentConnected && board.every(c => c === 0) && (
          <button onClick={startGameOnline} className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold transition">
             Згенерувати поле
          </button>
      )}
    </div>
  );
}
