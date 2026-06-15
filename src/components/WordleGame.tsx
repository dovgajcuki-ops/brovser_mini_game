/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

const WORDS = ["ВЕСНА", "СОНЦЕ", "МРІЯ", "КНИГА", "ДЕРЕВО", "МОРЕ", "РАБІСТЬ"];
const TARGET = WORDS[Math.floor(Math.random() * WORDS.length)];

export default function WordleGame({ highScore, onUpdateHighScore }: any) {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === 'Enter' && currentGuess.length === 5) {
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentGuess('');
        if (currentGuess === TARGET || newGuesses.length === 6) {
          setGameOver(true);
          if (currentGuess === TARGET) onUpdateHighScore(highScore + 10);
        }
      } else if (e.key === 'Backspace') {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (/^[А-ЯІЇЄҐа-яіїєґ]$/.test(e.key) && currentGuess.length < 5) {
        setCurrentGuess(prev => prev + e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, guesses, highScore, onUpdateHighScore]);

  const renderCell = (guess: string, i: number) => {
    const isSubmitted = guess.length === 5 && guesses.includes(guess);
    const letter = guess[i] || '';
    let bgColor = 'bg-zinc-950 border-zinc-800';
    if (isSubmitted) {
      if (TARGET[i] === letter) bgColor = 'bg-green-600 border-green-600 outline-none';
      else if (TARGET.includes(letter)) bgColor = 'bg-yellow-600 border-yellow-600';
      else bgColor = 'bg-zinc-800 border-zinc-800';
    } else if (letter) {
      bgColor = 'bg-zinc-900 border-zinc-600';
    }

    return (
      <div key={i} className={`w-12 h-12 flex items-center justify-center font-bold text-xl border-2 uppercase text-white transition-colors duration-300 ${bgColor}`}>
        {letter}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid grid-rows-6 gap-2 mb-6">
        {Array.from({ length: 6 }).map((_, row) => {
          const guess = row < guesses.length ? guesses[row] : (row === guesses.length ? currentGuess : '');
          return (
            <div key={row} className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, col) => renderCell(guess, col))}
            </div>
          );
        })}
      </div>
      {gameOver && (
        <div className="text-center">
          <div className="text-xl font-bold mb-2 text-zinc-100">{guesses.includes(TARGET) ? 'Ви вгадали!' : `Слово було: ${TARGET}`}</div>
          <button onClick={() => { setGuesses([]); setCurrentGuess(''); setGameOver(false); }} className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded">Нова гра</button>
        </div>
      )}
    </div>
  );
}
