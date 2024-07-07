"use client";
import { useEffect, useState } from "react";
import {
  database,
  createGameSession,
  joinGameSession,
  getAvailableGames,
  auth,
  db,
  endGameSession,
  startGameSession,
  setQuestions,
  getGameSession,
} from "@/firebase/config";
import { onValue, ref } from "firebase/database";
import { User } from "firebase/auth";
import { collection } from "firebase/firestore";

export interface Player {
  questionsSolved: number;
}

export interface GameState {
  players: {
    [key: string]: Player;
  };
  state: string;
  startTime: string;
  questions?: {
    body: string;
    ans: string;
  }[];
}

export interface Matchmaking {
  games: {
    [key: string]: GameState;
  };
}

export default function Multiplayer() {
  const [availableGames, setAvailableGames] = useState<[string, GameState][]>(
    []
  );
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const playerData = { questionsSolved: 100 };
  const [questionsSolved, setQuestionsSolved] = useState<number>(1);
  const [user, setUser] = useState<null | User>(null);
  const colRef = collection(db, "users");
  const [playerId, setEmail] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [playersData, setPlayersData] = useState(null);
  const [trick, setTrick] = useState("1");
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        if (user) {
          const email = user.email;
          if (email) setEmail(email.substring(0, email.indexOf("@")));
        }
      }
    });
    return () => unsubscribe();
  }, [colRef, user]);

  useEffect(() => {
    const fetchAvailableGames = async () => {
      const games = await getAvailableGames();
      setAvailableGames(games);
    };

    fetchAvailableGames();
  }, [refresh]);

  const handleCreateGame = async () => {
    const newGameId = await createGameSession();
    await joinGameSession(newGameId, playerId, playerData);
    await setQuestions(newGameId, String(trick));
    setGameId(newGameId);
    listenToGameUpdates(newGameId);
  };

  const handleJoinGame = async (gameId: string) => {
    await joinGameSession(gameId, playerId, playerData);
    setGameId(gameId);
    listenToGameUpdates(gameId);
  };

  const handleEndGame = async () => {
    if (gameId) {
      await endGameSession(gameId);
      setGameState(null);
      setGameId(null);
    }
  };

  const handleStartGame = async () => {
    if (gameId) {
      await startGameSession(gameId);
      // Optionally, you may want to fetch the updated game state here after starting the game
    }
  };

  const listenToGameUpdates = (gameId: string) => {
    const gameRef = ref(database, `games/${gameId}`);
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data as GameState);
      }
    });
  };

  const handleAnswerQuestion = async (
    questionIndex: number,
    playerAnswer: string
  ) => {
    if (
      gameId &&
      gameState &&
      gameState.questions &&
      gameState.questions[questionIndex]
    ) {
      const correctAnswer = gameState.questions[questionIndex].ans;
      if (playerAnswer === correctAnswer) {
        // Update questionsSolved
        console.log(questionsSolved + 1);
        setQuestionsSolved(questionsSolved + 1);
        console.log("yes right");
      }
    }
  };

  useEffect(() => {
    if (questionsSolved) {
      console.log(getGameSession(gameId));
    }
  }, [questionsSolved]);

  return (
    <div className="min-h-screen bg-orange-300 flex flex-col items-center">
      <h1 className="absolute top-4 left-4 font-extrabold text-orange-300 text-5xl underline bg-white px-4 py-2 border border-gray-300 rounded">
        Project Sense
      </h1>
      {gameId ? (
        gameState && (
          <div className="w-full max-w-2xl mt-32 px-4">
            <p className="text-center text-white font-semibold text-3xl">
              Game State: {gameState.state}
            </p>
            <div className="mt-4 text-3xl font-semibold underline text-white">
              {Object.keys(gameState.players).map((playerId) => (
                <div key={playerId} className="text-center">
                  <p>{playerId}</p>
                </div>
              ))}
            </div>
            {gameState.state === "waiting" && (
              <button
                className="mt-4 mx-auto block px-6 py-3 border-2 border-white bg-white text-orange-300 hover:bg-gray-100 transition-all duration-300 font-semibold text-xl rounded"
                onClick={handleStartGame}
              >
                Start Game
              </button>
            )}
            {gameState.state === "in_progress" && (
              <div className="mt-4">
                <h2 className="font-semibold underline text-white text-center text-2x">
                  Questions
                </h2>
                <div className="flex flex-col space-y-4">
                  {gameState.questions &&
                    gameState.questions.map((question, index) => (
                      <div
                        key={index}
                        className="font-semibold text-white text-xl mt-2 flex items-center justify-center"
                      >
                        <p className="text-right pr-2">{question.body}</p>
                        <span className="mx-2 text-xl">=</span>
                        <input
                          type="text"
                          className="text-center bg-transparent outline-none border-0 border-b-2 border-gray-500 focus:ring-0 focus:border-green-500 w-32 font-semibold"
                          onChange={(e) =>
                            handleAnswerQuestion(index, e.target.value)
                          }
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
            {gameState.state === "ended" && (
              <div className="mt-4 text-center">
                <h2>Game Ended!</h2>
                <p>
                  Winner:{" "}
                  {/* Implement logic to determine and display winner */}
                </p>
              </div>
            )}
            <button
              className="mt-4 mx-auto block px-6 py-3 border-2 border-white bg-white text-orange-300 hover:bg-gray-100 transition-all duration-300 font-semibold text-xl rounded"
              onClick={handleEndGame}
            >
              End Game
            </button>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center mt-32">
          <h2 className=" mt-12 font-semibold text-white text-center text-3xl mb-4">
            Available Games
          </h2>
          {availableGames.length > 0 ? (
            <ul className="w-full max-w-2xl px-4">
              {availableGames.map(([id, game]) => (
                <li
                  key={id}
                  className="mb-2 font-semibold text-white text-3xl text-center underline"
                >
                  <button onClick={() => handleJoinGame(id)}>
                    Join Game {id}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center font-semibold text-white text-3xl mb-4">
              No available games. Create a new one!
            </p>
          )}
          <button
            className="mb-4 mx-auto block text-white text-3xl font-semibold underline "
            onClick={handleCreateGame}
          >
            Create New Game
          </button>
          <input
            type="number"
            min="1"
            max="52"
            className="mb-4"
            onChange={(e) => {
              setTrick(e.target.value);
            }}
          />
          <button
            className="mb-4 mx-auto block text-3xl font-semibold text-white underline"
            onClick={() => setRefresh(refresh + 1)}
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
