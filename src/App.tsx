/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameId, GameInfo, HighScores } from './types';
import GameCard from './components/GameCard';
import DinoGame from './components/DinoGame';
import TetrisGame from './components/TetrisGame';
import SnakeGame from './components/SnakeGame';
import MinesweeperGame from './components/MinesweeperGame';
import Game2048 from './components/Game2048';
import PacmanGame from './components/PacmanGame';
import SolitaireGame from './components/SolitaireGame';
import TicTacToeGame from './components/TicTacToeGame';
import ArkanoidGame from './components/ArkanoidGame';
import WordleGame from './components/WordleGame';
import SudokuGame from './components/SudokuGame';
import MahjongGame from './components/MahjongGame';
import AlchemyGame from './components/AlchemyGame';
import ChessGame from './components/ChessGame';
import BattleshipGame from './components/BattleshipGame';
import FlappyBirdGame from './components/FlappyBirdGame';
import DoodleJumpGame from './components/DoodleJumpGame';
import CookieClickerGame from './components/CookieClickerGame';
import MarioGame from './components/MarioGame';
import SonicGame from './components/SonicGame';
import DonkeyKongGame from './components/DonkeyKongGame';
import { Gamepad2, ChevronLeft, Trophy, Github, Keyboard, HelpCircle, Heart, Minimize2 } from 'lucide-react';

const GAMES: GameInfo[] = [
  {
    id: 'dino',
    title: 'Динозаврик',
    description: 'Перестрибуйте якнайдовше',
    instructions: 'Стрілка Вгору / Пробіл — Стрибок, Стрілка Вниз — Пригинатися на ходу.',
    icon: 'flame',
    accentColor: 'from-orange-500 to-amber-400',
  },
  {
    id: 'tetris',
    title: 'Тетріс',
    description: 'Складайте геометричні фігури',
    instructions: 'Вліво / Вправо — Рух, Вгору — Поворот деталі, Вниз — Прискорити, Space — Скинути.',
    icon: 'layers',
    accentColor: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'snake',
    title: 'Класична Змійка',
    description: 'Збирайте фрукти, ростіть до максимальних розмірів',
    instructions: 'W/A/S/D або Кнопки Стрілок',
    icon: 'grid',
    accentColor: 'from-emerald-500 to-teal-400',
  },
  {
    id: 'minesweeper',
    title: 'Мінний Сапер',
    description: 'Аналізуйте цифри сусідів',
    instructions: 'Лівий клік — відкрити комірку, Правий клік — встановити прапорець.',
    icon: 'skull',
    accentColor: 'from-rose-500 to-red-600',
  },
  {
    id: '2048',
    title: 'Головоломка 2048',
    description: 'Зсувайте плиткове колесо, об’єднуйте однакові',
    instructions: 'Будь-яка стрілка або клавіші WASD рухають усю дошку.',
    icon: 'brain',
    accentColor: 'from-fuchsia-500 to-pink-500',
  },
  {
    id: 'pacman',
    title: 'Pac-Man',
    description: 'Поїдайте крапки в лабіринті',
    instructions: 'Керуйте пакманом стрілками або WASD',
    icon: 'ghost',
    accentColor: 'from-yellow-400 to-yellow-600',
  },
  {
    id: 'solitaire',
    title: 'Пасьянс Косинка',
    description: 'Класична карткова гра',
    instructions: 'Перетягуйте карти або клікайте для переміщення.',
    icon: 'cards',
    accentColor: 'from-green-600 to-green-800',
  },
  {
    id: 'tictactoe',
    title: 'Хрестики-нулики',
    description: 'Зберіть лінію з трьох',
    instructions: 'Клікайте по клітинках на полі 3x3',
    icon: 'x',
    accentColor: 'from-blue-400 to-cyan-500',
  },
  {
    id: 'arkanoid',
    title: 'Арканоїд',
    description: 'Розбивайте блоки м\'ячем',
    instructions: 'Стрілки вліво/вправо для руху платформи.',
    icon: 'hammer',
    accentColor: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'wordle',
    title: 'Wordle',
    description: 'Вгадайте слово з 5 букв',
    instructions: 'Вводьте слова, колір букв підкаже наближення.',
    icon: 'text',
    accentColor: 'from-green-500 to-yellow-500',
  },
  {
    id: 'sudoku',
    title: 'Судоку',
    description: 'Заповніть сітку 9x9 цифрами',
    instructions: 'Вибирайте клітинку і цифру від 1 до 9.',
    icon: 'grid3x3',
    accentColor: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'mahjong',
    title: 'Маджонг',
    description: 'Знаходьте пари однакових кісток',
    instructions: 'Клікайте по вільних кістках для їх прибирання.',
    icon: 'layout',
    accentColor: 'from-red-600 to-orange-500',
  },
  {
    id: 'alchemy',
    title: 'Little Alchemy',
    description: 'Створюйте нові елементи з базових',
    instructions: 'Комбінуйте елементи, перетягуючи їх один на одного.',
    icon: 'flask',
    accentColor: 'from-purple-400 to-fuchsia-600',
  },
  {
    id: 'chess',
    title: 'Шахи',
    description: 'Класична стратегічна гра',
    instructions: 'Обирайте фігури та правильні ходи.',
    icon: 'crown',
    accentColor: 'from-zinc-500 to-zinc-700',
  },
  {
    id: 'battleship',
    title: 'Морський бій',
    description: 'Втопіть кораблі супротивника',
    instructions: 'Клікайте по координатах на ворожому полі.',
    icon: 'target',
    accentColor: 'from-blue-600 to-blue-800',
  },
  {
    id: 'flappybird',
    title: 'Flappy Bird',
    description: 'Лети і не зіштовхуйся з трубами',
    instructions: 'Пробіл або тапання для стрибка.',
    icon: 'bird',
    accentColor: 'from-yellow-400 to-green-500',
  },
  {
    id: 'doodlejump',
    title: 'Doodle Jump',
    description: 'Стрибайте по платформах вгору',
    instructions: 'Стрілки вліво/вправо для руху.',
    icon: 'arrowUp',
    accentColor: 'from-lime-400 to-green-500',
  },
  {
    id: 'cookieclicker',
    title: 'Cookie Clicker',
    description: 'Клікайте і купуйте покращення',
    instructions: 'Клікайте на печиво для збільшення рахунку.',
    icon: 'cookie',
    accentColor: 'from-amber-600 to-yellow-700',
  },
  {
    id: 'mario',
    title: 'Super Mario',
    description: 'Ретро платформер',
    instructions: 'Керуйте стрілками для руху та стрибку.',
    icon: 'star',
    accentColor: 'from-red-500 to-blue-500',
  },
  {
    id: 'sonic',
    title: 'Sonic',
    description: 'Швидкісний їжак',
    instructions: 'Керуйте стрілками на швидкість.',
    icon: 'zap',
    accentColor: 'from-blue-500 to-blue-700',
  },
  {
    id: 'donkeykong',
    title: 'Donkey Kong',
    description: 'Ухиляйтесь від бочок',
    instructions: 'Лазіть по драбинах (Вгору) та стрибайте (Пробіл).',
    icon: 'mountain',
    accentColor: 'from-orange-600 to-red-800',
  },
];

const INITIAL_HIGH_SCORES: HighScores = {
  dino: 0,
  tetris: 0,
  snake: 0,
  minesweeper: 0,
  '2048': 0,
  pacman: 0,
  solitaire: 0,
  tictactoe: 0,
  arkanoid: 0,
  wordle: 0,
  sudoku: 0,
  mahjong: 0,
  alchemy: 0,
  chess: 0,
  battleship: 0,
  flappybird: 0,
  doodlejump: 0,
  cookieclicker: 0,
  mario: 0,
  sonic: 0,
  donkeykong: 0,
};

export default function App() {
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [highScores, setHighScores] = useState<HighScores>(INITIAL_HIGH_SCORES);
  const [totalScoreSum, setTotalScoreSum] = useState(0);

  // Load high scores
  useEffect(() => {
    try {
      const savedScores = localStorage.getItem('arcade_records');
      if (savedScores) {
        const parsed = JSON.parse(savedScores);
        // Fallback for missing keys in older saves
        const combined = { ...INITIAL_HIGH_SCORES, ...parsed };
        setHighScores(combined);
      }
    } catch (e) {
      console.error('Failed to parse highscores', e);
    }
  }, []);

  // Recalculate total score
  useEffect(() => {
    const sum = (Object.values(highScores) as number[]).reduce((a, b) => a + b, 0);
    setTotalScoreSum(sum);
  }, [highScores]);

  // Handle Score Updates
  const handleUpdateHighScore = (gameId: GameId, nextScore: number) => {
    setHighScores((prev) => {
      const nextScores = {
        ...prev,
        [gameId]: Math.max(prev[gameId] || 0, nextScore),
      };
      localStorage.setItem('arcade_records', JSON.stringify(nextScores));
      return nextScores;
    });
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 12) return 'Доброго ранку';
    if (hours >= 12 && hours < 18) return 'Доброго дня';
    if (hours >= 18 && hours < 23) return 'Доброго вечора';
    return 'Доброї ночі';
  };

  const selectedGameInfo = GAMES.find((g) => g.id === selectedGameId);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans relative antialiased selection:bg-zinc-800 selection:text-white">
      {/* Background soft grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      {/* Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-zinc-900 border border-zinc-850 rounded-lg">
            <Gamepad2 className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Клієнтський Аркадний Портал</span>
            <h1 className="text-base font-semibold text-zinc-100 tracking-tight leading-none mt-0.5">Ретро Міні-Ігри</h1>
          </div>
        </div>

        {/* Global Record Line summary */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg font-mono">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-zinc-400">Загальний рекорд: </span>
          <span className="text-sm font-bold text-amber-500 leading-none">{totalScoreSum}</span>
        </div>
      </header>

      {/* Main Grid Deck with miniatures */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div className="mb-10 max-w-xl">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{getGreeting()}!</span>
          <h2 className="text-2xl font-bold font-sans text-zinc-100 tracking-tight mt-1">Обирайте гру та встановлюйте нові рекорди</h2>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
            Повністю автономні міні-ігри у темному мінімалістичному стилі. Кожна гра плавно розгортається на повний екран і має власне звукове супроводження.
          </p>
        </div>

        {/* Dynamic Cards Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="games-grid">
          {GAMES.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              highScore={highScores[game.id]}
              onSelect={(id) => setSelectedGameId(id)}
            />
          ))}
        </div>
      </main>

      {/* Footer information section */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600 font-mono">
        <div className="flex items-center gap-1.5">
          <Keyboard className="w-4 h-4" />
          <span>Керування підтримується стрілками клавіатури або тач-джойстиками</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500">
          <span>Створено для розваг</span>
          <Heart className="w-3.5 h-3.5 text-zinc-650 fill-zinc-600/30" />
        </div>
      </footer>

      {/* FULLSCREEN VIEW OVERLAY (Zoom unfolded mode) */}
      {selectedGameId && selectedGameInfo && (
        <div
          id="game-fullscreen-portal"
          className="fixed inset-0 bg-[#09090b]/98 backdrop-blur-md z-50 flex flex-col overflow-hidden animate-fade-in"
        >
          {/* Unfolded Header Bar */}
          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b border-zinc-900">
            <button
              onClick={() => setSelectedGameId(null)}
              id="fullscreen-back-btn"
              className="group flex items-center gap-2 px-3.5 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg hover:border-zinc-700 text-xs text-zinc-400 hover:text-zinc-200 transition-all font-mono"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Повернутися</span>
            </button>

            <div className="text-center">
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">АКТИВНА ГРА</span>
              <h2 className="text-base font-semibold text-zinc-100 tracking-tight leading-none mt-0.5">
                {selectedGameInfo.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 border border-zinc-900 rounded-lg font-mono text-xs text-zinc-400">
              <Trophy className="w-3.5 h-3.5 text-amber-500 mr-0.5" />
              <span>Ваш рекорд: </span>
              <span className="font-bold text-amber-500 text-sm leading-none">
                {highScores[selectedGameId]}
              </span>
            </div>
          </div>

          {/* Active core game frame cabinet wrapper */}
          <div className="flex-1 flex flex-col md:flex-row max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-hidden">
            {/* Real Game Component Renderer */}
            <div className="flex-1 bg-zinc-950/45 border border-zinc-900 rounded-2xl relative flex items-center justify-center p-2 sm:p-6 overflow-hidden md:max-h-[calc(100vh-170px)]">
              {selectedGameId === 'dino' && (
                <DinoGame
                  highScore={highScores.dino}
                  onUpdateHighScore={(s) => handleUpdateHighScore('dino', s)}
                />
              )}
              {selectedGameId === 'tetris' && (
                <TetrisGame
                  highScore={highScores.tetris}
                  onUpdateHighScore={(s) => handleUpdateHighScore('tetris', s)}
                />
              )}
              {selectedGameId === 'snake' && (
                <SnakeGame
                  highScore={highScores.snake}
                  onUpdateHighScore={(s) => handleUpdateHighScore('snake', s)}
                />
              )}
              {selectedGameId === 'minesweeper' && (
                <MinesweeperGame
                  highScore={highScores.minesweeper}
                  onUpdateHighScore={(s) => handleUpdateHighScore('minesweeper', s)}
                />
              )}
              {selectedGameId === '2048' && (
                <Game2048
                  highScore={highScores['2048']}
                  onUpdateHighScore={(s) => handleUpdateHighScore('2048', s)}
                />
              )}
              {selectedGameId === 'pacman' && (
                <PacmanGame highScore={highScores.pacman} onUpdateHighScore={(s) => handleUpdateHighScore('pacman', s)} />
              )}
              {selectedGameId === 'solitaire' && (
                <SolitaireGame highScore={highScores.solitaire} onUpdateHighScore={(s) => handleUpdateHighScore('solitaire', s)} />
              )}
              {selectedGameId === 'tictactoe' && (
                <TicTacToeGame highScore={highScores.tictactoe} onUpdateHighScore={(s) => handleUpdateHighScore('tictactoe', s)} />
              )}
              {selectedGameId === 'arkanoid' && (
                <ArkanoidGame highScore={highScores.arkanoid} onUpdateHighScore={(s) => handleUpdateHighScore('arkanoid', s)} />
              )}
              {selectedGameId === 'wordle' && (
                <WordleGame highScore={highScores.wordle} onUpdateHighScore={(s) => handleUpdateHighScore('wordle', s)} />
              )}
              {selectedGameId === 'sudoku' && (
                <SudokuGame highScore={highScores.sudoku} onUpdateHighScore={(s) => handleUpdateHighScore('sudoku', s)} />
              )}
              {selectedGameId === 'mahjong' && (
                <MahjongGame highScore={highScores.mahjong} onUpdateHighScore={(s) => handleUpdateHighScore('mahjong', s)} />
              )}
              {selectedGameId === 'alchemy' && (
                <AlchemyGame highScore={highScores.alchemy} onUpdateHighScore={(s) => handleUpdateHighScore('alchemy', s)} />
              )}
              {selectedGameId === 'chess' && (
                <ChessGame highScore={highScores.chess} onUpdateHighScore={(s) => handleUpdateHighScore('chess', s)} />
              )}
              {selectedGameId === 'battleship' && (
                <BattleshipGame highScore={highScores.battleship} onUpdateHighScore={(s) => handleUpdateHighScore('battleship', s)} />
              )}
              {selectedGameId === 'flappybird' && (
                <FlappyBirdGame highScore={highScores.flappybird} onUpdateHighScore={(s) => handleUpdateHighScore('flappybird', s)} />
              )}
              {selectedGameId === 'doodlejump' && (
                <DoodleJumpGame highScore={highScores.doodlejump} onUpdateHighScore={(s) => handleUpdateHighScore('doodlejump', s)} />
              )}
              {selectedGameId === 'cookieclicker' && (
                <CookieClickerGame highScore={highScores.cookieclicker} onUpdateHighScore={(s) => handleUpdateHighScore('cookieclicker', s)} />
              )}
              {selectedGameId === 'mario' && (
                <MarioGame highScore={highScores.mario} onUpdateHighScore={(s) => handleUpdateHighScore('mario', s)} />
              )}
              {selectedGameId === 'sonic' && (
                <SonicGame highScore={highScores.sonic} onUpdateHighScore={(s) => handleUpdateHighScore('sonic', s)} />
              )}
              {selectedGameId === 'donkeykong' && (
                <DonkeyKongGame highScore={highScores.donkeykong} onUpdateHighScore={(s) => handleUpdateHighScore('donkeykong', s)} />
              )}
            </div>

            {/* Cabinet Info instructions side drawer on widescreen layout */}
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-zinc-900 mt-4 md:mt-0 pt-4 md:pt-0 md:pl-6 flex flex-col gap-4 select-none font-mono">
              <div>
                <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Швидка довідка
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2 p-3 bg-zinc-950/60 border border-zinc-900/60 rounded-xl">
                  {selectedGameInfo.instructions}
                </p>
              </div>

              <div className="hidden md:block">
                <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Мінімалістична металічна тема
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed mt-2 leading-relaxed">
                  Цей аркадний портал використовує темні кольори та лаконічний дизайн, щоб ви могли повністю сфокусуватися на грі. Всі звуки генеруються за допомогою Web Audio API без використання сторонніх аудіофайлів.
                </p>
              </div>

              {/* Back out button for convenient mobile space */}
              <button
                onClick={() => setSelectedGameId(null)}
                className="mt-auto px-4 py-2.5 md:flex items-center justify-center gap-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-all text-center w-full"
              >
                <Minimize2 className="w-4 h-4 mr-1" />
                <span>Згорнути вікно</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
