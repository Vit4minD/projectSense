"use client";

import React, { useState, useEffect, useCallback } from "react";

class MathGame {
  private question: string;
  private answer: number;
  private score: number;
  private operations: string[];

  constructor() {
    this.question = "";
    this.answer = 0;
    this.score = 0;
    this.operations = ["+", "-", "*", "/"];
    this.generateQuestion();
  }

  private generateQuestion() {
    const operation =
      this.operations[Math.floor(Math.random() * this.operations.length)];
    let num1 = Math.floor(Math.random() * 100) + 1;
    let num2 = Math.floor(Math.random() * 100) + 1;

    if (operation === "+") {
      num1 = Math.floor(Math.random() * 100) + 1;
      num2 = Math.floor(Math.random() * 100) + 1;
    } else if (operation === "-") {
      num1 = Math.floor(Math.random() * 100) + 1;
      num2 = Math.floor(Math.random() * 100) + 1;
      if (num1 < num2) {
        [num1, num2] = [num2, num1];
      }
    } else if (operation === "*") {
      num1 = Math.floor(Math.random() * 11 - 2 + 1) + 2;
      num2 = Math.floor(Math.random() * 99 - 2 + 1) + 2;
    } else if (operation === "/") {
      num2 = Math.floor(Math.random() * 11 - 2 + 1) + 2;
      num1 = num2 * (Math.floor(Math.random() * 10) + 2);
    } else {
      throw new Error("Unknown operation");
    }

    this.question = `${num1} ${operation} ${num2}`;
    this.answer = eval(this.question);
  }

  public getQuestion() {
    return this.question;
  }

  public getScore() {
    return this.score;
  }

  public checkAnswer(userAnswer: string) {
    const parsedAnswer = parseFloat(userAnswer);
    if (!isNaN(parsedAnswer) && parsedAnswer === this.answer) {
      this.score += 1;
      this.generateQuestion();
      return true;
    }
    return false;
  }

  public resetGame() {
    this.score = 0;
    this.generateQuestion();
  }
}

const Highscore: React.FC<{ highscore: number }> = ({ highscore }) => (
  <div className="text-2xl font-bold text-white mt-4">
    <p>Highscore: {highscore}</p>
  </div>
);

const MathGameComponent: React.FC = () => {
  const [game, setGame] = useState(new MathGame());
  const [currentQuestion, setCurrentQuestion] = useState(game.getQuestion());
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(game.getScore());
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameOver, setGameOver] = useState(false);
  const [highscore, setHighscore] = useState<number>(() =>
    parseInt(localStorage.getItem("highscore") || "0", 10)
  );

  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setGameOver(true);
          if (score > highscore) {
            setHighscore(score);
            localStorage.setItem("highscore", score.toString());
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, score, highscore]);

  useEffect(() => {
    if (!gameOver) {
      setCurrentQuestion(game.getQuestion());
      setScore(game.getScore());
    }
  }, [game, gameOver]);

  const handleAnswerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (gameOver) return;

      const answer = e.target.value;
      setUserAnswer(answer);

      if (game.checkAnswer(answer)) {
        setScore(game.getScore());
        setCurrentQuestion(game.getQuestion());
        setUserAnswer("");
      }
    },
    [game, gameOver]
  );

  const handlePlayAgain = useCallback(() => {
    const newGame = new MathGame();
    setGame(newGame);
    setCurrentQuestion(newGame.getQuestion());
    setScore(newGame.getScore());
    setTimeLeft(120); // Reset timer immediately
    setGameOver(false);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col bg-orange-300 p-4">
      {!gameOver && (
        <>
          <h1 className="absolute text-white top-4 left-1/2 transform -translate-x-1/2 text-3xl md:text-5xl font-bold underline">
            Zetamac
          </h1>
          <div className="absolute top-4 left-4 text-xl md:text-2xl font-semibold text-white">
            Score: {score}
          </div>
        </>
      )}
      {gameOver ? (
        <div className="flex flex-col items-center justify-center flex-grow mt-16">
          <h2 className="text-4xl font-bold text-white -mt-16 mb-4">
            Game Over
          </h2>
          <p className="text-2xl text-white">Your Score: {score}</p>
          <Highscore highscore={highscore} />
          <button
            onClick={handlePlayAgain}
            className="font-semibold mt-8 px-8 py-4 bg-white text-orange-300 rounded hover:bg-white"
          >
            Play Again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-grow -mt-16">
          <div className="text-2xl font-semibold text-white -mt-16 mb-4 underline">
            Time Left: {timeLeft}
          </div>
          <div className="flex items-center">
            <div className="text-5xl font-semibold text-white mr-4">
              {currentQuestion}
            </div>
            <div className="text-[2.25rem] md:text-5xl font-semibold text-white mr-4">
              =
            </div>
            <input
              type="text"
              value={userAnswer}
              onChange={handleAnswerChange}
              placeholder=""
              className="text-5xl font-semibold text-white border-b border-white bg-transparent outline-none w-32 md:w-64"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MathGameComponent;
