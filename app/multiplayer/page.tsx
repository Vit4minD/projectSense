"use client"
import { useEffect, useState } from "react";
import { database, createGameSession, joinGameSession, getAvailableGames, auth, db, endGameSession, startGameSession, setQuestions, getGameSession } from "@/firebase/config";
import { onValue, ref } from "firebase/database";
import { User } from "firebase/auth";
import { collection } from "firebase/firestore";

export interface Player {
    questionsSolved: number
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
    const [availableGames, setAvailableGames] = useState<[string, GameState][]>([]);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [gameId, setGameId] = useState<string | null>(null);
    const playerData = { questionsSolved: 100 };
    const [questionsSolved, setQuestionsSolved] = useState<number>(1);
    const [user, setUser] = useState<null | User>(null);
    const colRef = collection(db, "users");
    const [playerId, setEmail] = useState("")
    const [refresh, setRefresh] = useState(0);
    const [playersData, setPlayersData] = useState(null);
    const [trick, setTrick] = useState("1")
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
            if (authUser) {
                setUser(authUser);
                if (user) {
                    const email = user.email;
                    if (email)
                        setEmail(email.substring(0, email.indexOf("@")))
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
        await setQuestions(newGameId, String(trick))
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

    const handleAnswerQuestion = async (questionIndex: number, playerAnswer: string) => {
        if (gameId && gameState && gameState.questions && gameState.questions[questionIndex]) {
            const correctAnswer = gameState.questions[questionIndex].ans;
            if (playerAnswer === correctAnswer) {
                // Update questionsSolved
                console.log(questionsSolved + 1)
                setQuestionsSolved(questionsSolved + 1);
                console.log("yes right")
            }
        }
    };

    useEffect(() => {
        if (questionsSolved) {
            console.log(getGameSession(gameId))
        }
    }, [questionsSolved]);

    return (
        <div>
            <h1>Multiplayer Menu</h1>
            {gameId ? (
                gameState && (
                    <div>
                        <p>Game State: {gameState.state}</p>
                        <div>
                            {Object.keys(gameState.players).map((playerId) => (
                                <div key={playerId}>
                                    <p>{playerId}</p>
                                </div>
                            ))}
                        </div>
                        {gameState.state === 'waiting' && (
                            <button onClick={handleStartGame}>Start Game</button>
                        )}
                        {gameState.state === 'in_progress' && (
                            <div>
                                <h2>Questions</h2>
                                {gameState.questions && gameState.questions.map((question, index) => (
                                    <div key={index}>
                                        <p>{question.body}</p>
                                        <input type="text" onChange={(e) => handleAnswerQuestion(index, e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        )}
                        {gameState.state === 'ended' && (
                            <div>
                                <h2>Game Ended!</h2>
                                <p>Winner: {/* Implement logic to determine and display winner */}</p>
                            </div>
                        )}
                        <button onClick={handleEndGame}>End Game</button>
                    </div>
                )
            ) : (
                <div>
                    <h2>Available Games</h2>
                    {availableGames.length > 0 ? (
                        <ul>
                            {availableGames.map(([id, game]) => (
                                <li key={id}>
                                    <button onClick={() => handleJoinGame(id)}>Join Game {id}</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No available games. Create a new one!</p>
                    )}
                    <button onClick={handleCreateGame}>Create New Game</button>
                    <input type="number" min="1" max="52" onChange={(e) => {setTrick(e.target.value)}}></input>
                    <button onClick={() => { setRefresh(refresh + 1) }}>Refresh</button>
                </div>
            )}
        </div>
    );
}
