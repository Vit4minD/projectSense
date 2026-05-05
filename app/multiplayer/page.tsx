"use client";
import { useEffect, useMemo, useState } from "react";
import {
  database,
  createRoom,
  joinRoom,
  getAvailableRooms,
  auth,
  endRoom,
  startRoom,
  setQuestions,
  trackEvent,
} from "@/firebase/config";
import { onValue, ref, remove, update } from "firebase/database";
import { User } from "firebase/auth";
import { HiRefresh } from "react-icons/hi";
import MathComponent from "../components/MathComponent";
import { FaCrown } from "react-icons/fa";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { Menu, MenuButton, Button, MenuList, MenuItem, ChakraProvider } from "@chakra-ui/react";
import { problemSet } from "../utils/problemGenerator";
import { useRouter } from "next/navigation";

export interface Player {
  questionsSolved: number;
  displayName?: string;
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

export default function Multiplayer() {
  const [availableRooms, setAvailableRooms] = useState<[string, GameState][]>([]);
  const [currentBoard, setCurrentBoard] = useState(1);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [questionsSolved, setQuestionsSolved] = useState<number>(1);
  const [user, setUser] = useState<null | User>(null);
  const [displayName, setDisplayName] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [trick] = useState("1");
  const [index, setIndex] = useState(0);
  const [userAns, setUserAns] = useState("");
  const [winner, setWinner] = useState("");
  const keys = useMemo(() => Object.keys(problemSet).map(Number), []);
  const [stopTimer, setStopTimer] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);
        const email = authUser.email;
        if (email) {
          const at = email.indexOf("@");
          setDisplayName(at > 0 ? email.substring(0, at) : email);
        } else {
          setDisplayName(authUser.uid.substring(0, 6));
        }
      } else {
        setUser(null);
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (
      gameState &&
      gameState.questions &&
      user &&
      roomCode &&
      userAns === gameState.questions[questionsSolved].ans
    ) {
      const next = questionsSolved + 1;
      setQuestionsSolved(next);
      update(ref(database, `rooms/${roomCode}/players/${user.uid}`), {
        questionsSolved: next,
      });
      setUserAns("");
    }
  }, [userAns]);

  const disableScroll = () => {
    document.body.style.overflow = "hidden";
  };

  const enableScroll = () => {
    document.body.style.overflow = "auto";
  };

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      const rooms = await getAvailableRooms();
      setAvailableRooms(rooms as [string, GameState][]);
    };

    fetchAvailableRooms();
  }, [refresh]);

  const playerLabel = (uid: string) => gameState?.players[uid]?.displayName ?? uid.substring(0, 6);

  const handleCreateRoom = async () => {
    if (!user) return;
    const code = await createRoom();
    await joinRoom(code, user.uid, { questionsSolved: 1, displayName });
    setRoomCode(code);
    listenToRoomUpdates(code);
  };

  const handleJoinRoom = async (code: string) => {
    if (!user) return;
    await joinRoom(code, user.uid, { questionsSolved: 1, displayName });
    setQuestionsSolved(1);
    setRoomCode(code);
    listenToRoomUpdates(code);
  };

  const handleStartGame = async () => {
    if (roomCode) {
      await startRoom(roomCode);
      await setQuestions(roomCode, String(currentBoard));
    }
  };

  const listenToRoomUpdates = (code: string) => {
    const roomRef = ref(database, `rooms/${code}`);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data as GameState);
      }
    });
  };
  useEffect(() => {
    if (gameState && gameState.state === "in_progress") {
      setStopTimer(false);
      setStartTime(Date.now());
      setElapsedTime(0);
    } else if (gameState && gameState.state === "ended" && roomCode) {
      setStopTimer(true);
      setStartTime(Date.now());
      setElapsedTime(0);
      setUserAns("");
      const roomRef = ref(database, `rooms/${roomCode}`);
      update(roomRef, { state: "ended" });
      Object.keys(gameState.players).forEach((uid) => {
        if (gameState.players[uid]?.questionsSolved === 6) setWinner(playerLabel(uid));
      });
      endRoom(roomCode);
      trackEvent("multiplayer_game_completed", {
        won: !!user && gameState.players[user.uid]?.questionsSolved === 6,
        players_count: Object.keys(gameState.players).length,
        trick_id: trick,
        duration_ms: elapsedTime,
      });
    } else if (gameState && gameState.state === "end_clicked") {
      setIndex(0);
    }
  }, [gameState?.state]);

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
    if (questionsSolved === 6 && roomCode) {
      const roomRef = ref(database, `rooms/${roomCode}`);
      update(roomRef, { state: "ended" });
      if (gameState) {
        Object.keys(gameState.players).forEach((uid) => {
          if (gameState.players[uid]?.questionsSolved === 6) setWinner(playerLabel(uid));
        });
      }
      setTimeout(() => {
        remove(roomRef);
        setIndex(0);
      }, 7500);
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
        <button
          onClick={() => router.push("/home")}
          className="absolute top-2 md:top-4 left-2 md:left-4 font-extrabold text-orange-300 text-3xl md:text-5xl underline bg-white px-2 md:px-4 py-1 md:py-2 border border-gray-300 rounded"
        >
          Project Sense
        </button>
        {index === 0 ? (
          <div className="gap-y-8 md:gap-y-4 -mt-8 md:mt-0 font-mono text-white text-[3.25rem] md:text-8xl font-extrabold items-start justify-center flex flex-col fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 md:w-auto">
            <button
              className="relative group "
              onClick={() => {
                setIndex(1);
                setRefresh(refresh + 1);
              }}
            >
              FIND ROOM
              <span className="absolute  -bottom-1 left-0 w-0 h-2 bg-white transition-all group-hover:w-full duration-700"></span>
            </button>
            <button
              className="relative group"
              onClick={() => {
                setIndex(2);
                handleCreateRoom();
                setQuestionsSolved(1);
              }}
            >
              CREATE ROOM
              <span className="absolute -bottom-1 left-0 w-0 h-2 bg-white transition-all group-hover:w-full duration-700"></span>
            </button>
          </div>
        ) : index === 1 ? (
          <div>
            <button
              onClick={() => {
                setIndex(0);
                if (roomCode && user) {
                  remove(ref(database, `rooms/${roomCode}/players/${user.uid}`));
                  setGameState(null);
                  setRoomCode(null);
                  setQuestionsSolved(1);
                  setIndex(0);
                }
              }}
              className="hover:bg-gray-300 mt-16 md:mt-24 bg-white w-fit text-2xl md:text-4xl font-extrabold text-orange-300 text-left ml-3 md:ml-8 rounded-3xl p-2 px-4"
            >
              {"<"}
            </button>
            <div className="   w-screen mt-1 md:-mt-24 text-center text-white font-extrabold text-3xl md:text-7xl underline">
              LOBBY SELECT
              <div className=" absolute w-3/4 md:w-3/5  rounded-2xl   shadow-xl border-8 border-orange-500 bottom-4 h-[calc(80vh-2rem)] left-1/2 transform -translate-x-1/2 bg-white text-black text-4xl p-4 overflow-auto">
                <button
                  className="items-center gap-x-2 flex flex-row justify-center mb-4 ml-auto  text-3xl font-semibold text-black "
                  onClick={() => setRefresh(refresh + 1)}
                >
                  REFRESH <HiRefresh />
                </button>
                <hr className="text-black mt-4 w-full mb-4 "></hr>
                {availableRooms.length > 0 ? (
                  <ul className="flex flex-wrap gap-x-8 ">
                    {availableRooms.map(([id]) => (
                      <li key={id} className="">
                        <button
                          key={id + ""}
                          className="underline underline-offset-2 decoration-[2px] hover:decoration-[3px]  "
                          onClick={() => {
                            handleJoinRoom(id);
                            setIndex(2);
                          }}
                        >
                          {id}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center font-semibold text-black text-3xl mt-4 mb-4">
                    No available rooms. Create a new one or try Refreshing!
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-screen">
            {gameState && gameState.state === "in_progress" ? (
              <div>
                <div className="absolute flex flex-col right-0 text-right p-4 justify-between">
                  {gameState
                    ? Object.keys(gameState.players).map((uid, idx) => (
                        <div
                          key={idx}
                          className="flex flex-row items-center justify-between text-right"
                        >
                          <label className="mr-2 font-semibold text-lg text-slate-100">
                            {playerLabel(uid)}
                          </label>
                          <progress
                            className="progress progress-info w-72 h-4"
                            value={gameState.players[uid]?.questionsSolved - 1}
                            max="5"
                          ></progress>
                        </div>
                      ))
                    : null}
                </div>
                <button
                  onClick={() => {
                    setIndex(0);
                    if (roomCode && user) {
                      remove(ref(database, `rooms/${roomCode}/players/${user.uid}`));
                      setGameState(null);
                      setRoomCode(null);
                      setQuestionsSolved(1);
                      setIndex(0);
                    }
                  }}
                  className="hover:bg-gray-300 mt-16 md:mt-24 bg-white w-fit text-2xl md:text-4xl font-extrabold text-orange-300 text-left ml-3 md:ml-8 rounded-3xl p-2 px-4"
                >
                  {"<"}
                </button>
                <div className="   w-screen text-center text-white font-extrabold text-5xl md:text-7xl">
                  {formatTime(elapsedTime)}
                </div>
                <div
                  className={`font-semibold ${
                    trick === "26" ||
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
                      <MathComponent
                        math={gameState.questions ? gameState.questions[questionsSolved].body : ""}
                      />
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
              </div>
            ) : gameState && gameState.state === "ended" ? (
              <div>
                <button
                  onClick={() => {
                    setIndex(0);
                    if (roomCode && user) {
                      remove(ref(database, `rooms/${roomCode}/players/${user.uid}`));
                      setGameState(null);
                      setRoomCode(null);
                      setQuestionsSolved(1);
                      setIndex(0);
                    }
                  }}
                  className="hover:bg-gray-300 mt-16 md:mt-24 bg-white w-fit text-2xl md:text-4xl font-extrabold text-orange-300 text-left ml-3 md:ml-8 rounded-3xl p-2 px-4"
                >
                  {"<"}
                </button>
                <div className="gap-y-4 font-mono text-white text-5xl md:text-8xl font-extrabold gap-x-4 items-center  justify-center flex flex-row fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-screen">
                  <FaCrown />
                  Winner: {winner}
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIndex(0);
                    if (roomCode && user) {
                      remove(ref(database, `rooms/${roomCode}/players/${user.uid}`));
                      setGameState(null);
                      setRoomCode(null);
                      setQuestionsSolved(1);
                      setIndex(0);
                    }
                  }}
                  className="hover:bg-gray-300 mt-16 md:mt-24 bg-white w-fit text-2xl md:text-4xl font-extrabold text-orange-300 text-left ml-3 md:ml-8 rounded-3xl p-2 px-4"
                >
                  {"<"}
                </button>
                <div className=" mt-0 md:-mt-20 w-screen text-center text-white font-extrabold text-4xl md:text-7xl">
                  LOBBY {roomCode}
                  <div className="mx-auto h-[60vh] overflow-y-auto overflow-x-hidden w-3/4 md:w-1/2 mt-2 md:mt-0 rounded-2xl shadow-xl border-8 border-orange-500  bg-white text-black text-2xl md:text-4xl p-4">
                    <p className="text-left underline">Players:</p>
                    <div className="text-left mr-auto mt-3">
                      {gameState
                        ? Object.keys(gameState.players).map((uid) => (
                            <div key={uid} className="text-left ml-4">
                              <p>{playerLabel(uid)}</p>
                            </div>
                          ))
                        : "Empty"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-x-4 flex-row justify-center items-center w-screen">
                  <button
                    className="hover:bg-gray-300 mt-4  block font-extrabold px-6 py-3 bg-white text-orange-300  transition-all duration-300 text-2xl rounded"
                    onClick={() => {
                      handleStartGame();
                      setStopTimer(false);
                      setStartTime(Date.now()); // Reset the startTime to the current timestamp
                      setElapsedTime(0);
                    }} // Reset the elapsedTime to 0 }}
                  >
                    Start Game
                  </button>
                  <button
                    className="hover:bg-gray-300 mt-4  block font-extrabold px-6 py-3 bg-white text-orange-300  transition-all duration-300 text-2xl rounded"
                    onClick={() => {
                      if (!roomCode) return;
                      const roomRef = ref(database, `rooms/${roomCode}`);
                      update(roomRef, { state: "end_clicked" });
                      remove(roomRef);
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
                    style={{
                      maxHeight: "10rem",
                      width: "100%",
                      maxWidth: "20rem",
                    }}
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
              </>
            )}
          </div>
        )}
      </div>
    </ChakraProvider>
  );
}
