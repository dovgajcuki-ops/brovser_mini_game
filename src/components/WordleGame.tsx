/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PencilLine, Play, RefreshCw } from 'lucide-react';

const WORDS = ["ВЕСНА", "СОНЦЕ", "МРІЯ", "КНИГА", "ДЕРЕВО", "МОРЕ", "РАДІСТЬ", "ВІТЕР", "КАЗКА"];
const getRandomWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];

export default function WordleGame({ highScore, onUpdateHighScore }: any) {
  const [targetWord, setTargetWord] = useState(getRandomWord());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [customWord, setCustomWord] = useState('');

  const wordLen = targetWord.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || setupMode) return;
      if (e.key === 'Enter' && currentGuess.length === wordLen) {
        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentGuess('');
        if (currentGuess === targetWord || newGuesses.length === 6) {
          setGameOver(true);
          if (currentGuess === targetWord) onUpdateHighScore(highScore + 10);
        }
      } else if (e.key === 'Backspace') {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (/^[А-ЯІЇЄҐа-яіїєґA-Za-z]$/.test(e.key) && currentGuess.length < wordLen) {
        setCurrentGuess(prev => prev + e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, guesses, highScore, onUpdateHighScore, targetWord, setupMode, wordLen]);

  const renderCell = (guess: string, i: number, isSubmitted: boolean) => {
    const letter = guess[i] || '';
    let bgColor = 'bg-zinc-950 border-zinc-800';
    if (isSubmitted) {
      if (targetWord[i] === letter) bgColor = 'bg-green-600 border-green-600 outline-none';
      else if (targetWord.includes(letter)) bgColor = 'bg-yellow-600 border-yellow-600';
      else bgColor = 'bg-red-600 border-red-600';
    } else if (letter) {
      bgColor = 'bg-zinc-900 border-zinc-600';
    }

    return (
      <div key={i} className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-bold text-lg sm:text-xl border-2 uppercase text-white transition-colors duration-300 ${bgColor}`}>
        {letter}
      </div>
    );
  };

  const handleStartCustom = () => {
    if (customWord.trim().length < 3) return;
    setTargetWord(customWord.trim().toUpperCase());
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setSetupMode(false);
    setCustomWord('');
  };

  const handleRandomRestart = () => {
    setTargetWord(getRandomWord());
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setSetupMode(false);
  };

  if (setupMode) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto animate-fade-in p-6 bg-zinc-950 border border-zinc-900 rounded-xl">
        <h2 className="text-xl font-bold font-mono text-zinc-100 mb-4 tracking-tight">Задати своє слово</h2>
        <input 
          type="password"
          value={customWord}
          onChange={e => setCustomWord(e.target.value)}
          placeholder="Введіть слово (приховано)"
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-4 py-3 text-center text-xl text-zinc-100 font-mono focus:outline-none focus:border-zinc-500 mb-6"
        />
        <div className="flex gap-3 w-full">
          <button 
             onClick={handleStartCustom}
             disabled={customWord.trim().length < 3}
             className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold py-2.5 rounded transition"
          >
             <Play className="w-4 h-4" /> Почати гру
          </button>
          <button onClick={() => setSetupMode(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 rounded transition">
            Скасувати
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-sm flex justify-between mb-4 px-2">
        <button onClick={() => setSetupMode(true)} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
           <PencilLine className="w-3.5 h-3.5" /> Загадати слово
        </button>
      </div>
      <div className="flex flex-col gap-2 mb-6 pointer-events-none">
        {Array.from({ length: 6 }).map((_, row) => {
          const isSubmitted = row < guesses.length;
          const guess = isSubmitted ? guesses[row] : (row === guesses.length ? currentGuess : '');
          return (
            <div key={row} className="flex gap-1.5 sm:gap-2 justify-center">
              {Array.from({ length: wordLen }).map((_, col) => renderCell(guess, col, isSubmitted))}
            </div>
          );
        })}
      </div>
      {gameOver && (
        <div className="text-center animate-fade-in">
          <div className="text-xl font-bold mb-4 font-mono tracking-tight text-emerald-400">{guesses.includes(targetWord) ? 'Ви вгадали!' : `Слово було: ${targetWord}`}</div>
          <button onClick={handleRandomRestart} className="px-6 py-2.5 flex items-center gap-2 mx-auto bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded transition">
            <RefreshCw className="w-4 h-4" /> Випадкове слово
          </button>
        </div>
      )}
    </div>
  );
}
