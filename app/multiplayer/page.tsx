"use client";
import { useEffect, useMemo, useState } from "react";
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
} from "@/firebase/config";
import { onValue, ref, remove, update } from "firebase/database";
import { User } from "firebase/auth";
import { collection } from "firebase/firestore";
import { HiRefresh } from "react-icons/hi";
import MathComponent from "../components/MathComponent";
import { FaCrown } from "react-icons/fa";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Menu, MenuButton, Button, MenuList, MenuItem, ChakraProvider } from "@chakra-ui/react";
import { problemSet } from "../utils/problemGenerator";
import { useRouter } from "next/navigation";

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
  const [currentBoard, setCurrentBoard] = useState(1);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const playerData = { questionsSolved: 1 };
  const [questionsSolved, setQuestionsSolved] = useState<number>(1);
  const [user, setUser] = useState<null | User>(null);
  const colRef = collection(db, "users");
  const [playerId, setEmail] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [trick, setTrick] = useState("1");
  const [index, setIndex] = useState(0);
  const [userAns, setUserAns] = useState("");
  const [winner, setWinner] = useState("");
  const keys = useMemo(() => Object.keys(problemSet).map(Number), []);
  const [stopTimer, setStopTimer] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const router = useRouter();

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
    if (gameState && gameState.questions && userAns === gameState.questions[questionsSolved].ans) {
      setQuestionsSolved(questionsSolved + 1)
      const playerPositionRef = ref(database, `games/${gameId}/players/${playerId}`);
      update(playerPositionRef, { questionsSolved: questionsSolved + 1 });
      setUserAns("")
      console.log(questionsSolved)
    }
  }, [userAns])

  const disableScroll = () => {
    document.body.style.overflow = 'hidden';
  };

  const enableScroll = () => {
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    const fetchAvailableGames = async () => {
      const games = await getAvailableGames();
      setAvailableGames(games);
    };

    fetchAvailableGames();
  }, [refresh]);

  const handleCreateGame = async () => {
    console.log(currentBoard)
    const newGameId = await createGameSession();
    await joinGameSession(newGameId, playerId, playerData);
    setGameId(newGameId);
    listenToGameUpdates(newGameId);
  };

  const handleJoinGame = async (gameId: string) => {
    await joinGameSession(gameId, playerId, { questionsSolved: 1 });
    setQuestionsSolved(1)
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
      await setQuestions(gameId, String(currentBoard));
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
  useEffect(() => {
    if (gameState && gameState.state === "in_progress") {
      setStopTimer(false);
      setStartTime(Date.now()); // Reset the startTime to the current timestamp
      setElapsedTime(0);
    } else if (gameState && gameState.state == 'ended') {
      setStopTimer(true);
      setStartTime(Date.now()); // Reset the startTime to the current timestamp
      setElapsedTime(0);
      setUserAns("")
      const gameRef = ref(database, `games/${gameId}`);
      update(gameRef, { state: 'ended' });
      gameState ? Object.keys(gameState.players).map((playerIdd) => { gameState.players[playerIdd]?.questionsSolved === 6 ? setWinner(playerIdd) : null }) : null
      setTimeout(() => {
        remove(gameRef)
        setIndex(0)
      }, 6000); // 10000 milliseconds = 10 seconds
    }
  }, [gameState, gameState?.state])
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
    let animationFrameId: number;

    const updateElapsedTime = () => {
      if (!stopTimer) {
        setElapsedTime(Date.now() - startTime);
        animationFrameId = requestAnimationFrame(updateElapsedTime);
      }
    };

    animationFrameId = requestAnimationFrame(updateElapsedTime);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [startTime, stopTimer]);

  useEffect(() => {
    if (questionsSolved === 6) {
      const gameRef = ref(database, `games/${gameId}`);
      update(gameRef, { state: 'ended' });
      gameState ? Object.keys(gameState.players).map((playerId) => { gameState.players[playerId]?.questionsSolved === 6 ? setWinner(playerId) : null }) : null
      setTimeout(() => {
        remove(gameRef)
        setIndex(0)
      }, 7500); // 10000 milliseconds = 10 seconds
    }
  }, [questionsSolved]);

  const formatTime = (time: number) => {
    const milliseconds = Math.floor((time % 1000) / 10);
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  return (
    <ChakraProvider>
      <div className="min-h-screen bg-orange-300 flex flex-col items-center font-mono">
        <button onClick={() => router.push("/home")} className="absolute top-4 left-4 font-extrabold text-orange-300 text-5xl underline bg-white px-4 py-2 border border-gray-300 rounded">
          Project Sense
        </button>
        {index == 0 ?
          <div className="gap-y-4 font-mono text-white text-8xl font-extrabold items-start justify-center flex flex-col fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <button className="relative group" onClick={() => { setIndex(1); setRefresh(refresh + 1) }}>
              FIND GAME
              <span className="absolute -bottom-1 left-0 w-0 h-2 bg-white transition-all group-hover:w-full duration-700"></span>
            </button>
            <button className="relative group" onClick={() => { setIndex(2); handleCreateGame(); setQuestionsSolved(1) }}>
              CREATE GAME
              <span className="absolute -bottom-1 left-0 w-0 h-2 bg-white transition-all group-hover:w-full duration-700"></span>
            </button>
          </div> : index == 1 ?
            <div>
              <button onClick={() => { setIndex(0) }} className="hover:bg-gray-300 mt-24 bg-white w-fit text-4xl font-extrabold text-orange-300 text-left ml-8 rounded-3xl p-2 px-4">{"<"}</button>
              <div className="   w-screen text-center text-white font-extrabold text-7xl">
                LOBBY SELECT
                <div className="  absolute w-2/3 rounded-2xl rounded-b-none border-b-0 shadow-xl border-8 border-orange-500 bottom-0 h-3/4 left-1/2 transform -translate-x-1/2 bg-white text-black text-4xl p-4">
                  <button
                    className="items-center gap-x-2 flex flex-row justify-center mb-4 ml-auto  text-3xl font-semibold text-black "
                    onClick={() => setRefresh(refresh + 1)}
                  >
                    REFRESH <HiRefresh />
                  </button>
                  <hr className="text-black mt-4 w-full mb-4 "></hr>
                  {availableGames.length > 0 ? (
                    <ul className="flex flex-row gap-x-8 ">
                      {availableGames.map(([id, game]) => (
                        <li
                          key={id}
                          className=""
                        >
                          <button key={id + ""} className="underline underline-offset-2 decoration-[2px] hover:decoration-[3px] " onClick={() => { handleJoinGame(id); setIndex(2) }}>
                            {id}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center font-semibold text-black text-3xl mt-4 mb-4">
                      No available games. Create a new one or try Refreshing!
                    </p>
                  )}
                </div>
              </div>
            </div>
            : <div className="w-screen">
              {gameState && gameState.state === "in_progress" ?
                <div>
                  <button onClick={() => { setIndex(0) }} className="hover:bg-gray-300 mt-24 bg-white w-fit text-4xl font-extrabold text-orange-300 text-left ml-8 rounded-3xl p-2 px-4">{"<"}</button>
                  <div className="   w-screen text-center text-white font-extrabold text-7xl">
                    {formatTime(elapsedTime)}
                  </div>
                  <div
                    className={`font-semibold ${trick === "26" ||
                      trick === "27" ||
                      trick === "35" ||
                      trick === "42" ||
                      trick === "43"
                      ? "text-[2.0rem] md:text-[2.3rem]"
                      : "text-[3.0rem] md:text-6xl"
                      } w-screen flex flex-col md:flex-row text-white justify-center items-center gap-x-4 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  overflow-wrap break-words whitespace-pre-wrap`}
                  >
                    <>
                      <div className={`text-center md:text-left ml-[0px] `}>
                        <MathComponent math={gameState.questions ? gameState.questions[questionsSolved].body : ""} />
                      </div>
                      <div className="text-center md:text-left">=</div>
                      <input
                        autoFocus={true}
                        className="pb-2 w-2/3 md:w-1/5 focus:outline-none border-b-2 text-center bg-orange-300"
                        type="text"
                        value={userAns}
                        onChange={(e) => {
                          setUserAns(e.target.value);
                        }}
                      />
                    </>
                  </div>
                </div> : gameState && gameState.state === "ended" ?
                  <div>
                    <button onClick={() => { setIndex(0) }} className="hover:bg-gray-300 mt-24 bg-white w-fit text-4xl font-extrabold text-orange-300 text-left ml-8 rounded-3xl p-2 px-4">{"<"}</button>
                    <div className="gap-y-4 font-mono text-white text-8xl font-extrabold gap-x-4 items-center  justify-center flex flex-row fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <FaCrown />Winner: {winner}
                    </div>
                  </div> :
                  <>
                    <button onClick={() => { setIndex(0) }} className="hover:bg-gray-300 mt-24 bg-white w-fit text-4xl font-extrabold text-orange-300 text-left ml-8 rounded-3xl p-2 px-4">{"<"}</button>
                    <div className="   w-screen text-center text-white font-extrabold text-7xl">
                      LOBBY {gameId}
                      <div className="mx-auto h-[60vh] overflow-auto w-1/3 mt-8 rounded-2xl shadow-xl border-8 border-orange-500  bg-white text-black text-4xl p-4">
                        <p className="text-left underline">Players:</p>
                        <div className="text-left mr-auto mt-3">
                          {gameState ? Object.keys(gameState.players).map((playerId) => (
                            <div key={playerId} className="text-left ml-4">
                              <p>{playerId}</p>
                            </div>
                          )) : "Empty"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-x-4 flex-row justify-center items-center w-screen">
                      <button
                        className="hover:bg-gray-300 mt-4  block font-extrabold px-6 py-3 bg-white text-orange-300  transition-all duration-300 text-2xl rounded"
                        onClick={() => {
                          handleStartGame(); setStopTimer(false); setStartTime(Date.now()); // Reset the startTime to the current timestamp
                          setElapsedTime(0);
                        }}// Reset the elapsedTime to 0 }} 
                      >
                        Start Game
                      </button>
                      <button
                        className="hover:bg-gray-300 mt-4  block font-extrabold px-6 py-3 bg-white text-orange-300  transition-all duration-300 text-2xl rounded"
                        onClick={() => {
                          const gameRef = ref(database, `games/${gameId}`);
                          remove(gameRef);
                          setIndex(0);
                        }}
                      >
                        End Game
                      </button>
                    </div>
                    <Menu onOpen={disableScroll} onClose={enableScroll}>
                      <MenuButton
                        color="rgb(253, 186, 116)"
                        backgroundColor="white"
                        className="mt-4 left-1/2 transform -translate-x-1/2 text-5xl "
                        as={Button}
                        rightIcon={<ChevronDownIcon />}
                      >
                        <MathComponent math={problemSet[currentBoard]} />
                      </MenuButton>

                      <MenuList
                        maxH="10rem"
                        overflowY="auto"
                        style={{ maxHeight: "10rem", width: "100%", maxWidth: "20rem" }}
                      >
                        {keys.map((value) =>
                          currentBoard !== value ? (
                            <MenuItem
                              onClick={() => {
                                setCurrentBoard(value);
                              }}
                              key={value}
                            >
                              <MathComponent math={problemSet[value]} />
                            </MenuItem>
                          ) : (
                            <></>
                          )
                        )}
                      </MenuList>
                    </Menu>
                  </>}
            </div>
        }
      </div >
    </ChakraProvider >
  );
}

