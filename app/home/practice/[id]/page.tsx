"use client";
import React, { useState, useEffect } from "react";
import { FaInfinity } from "react-icons/fa";
import { VscDebugRestart } from "react-icons/vsc";
import Trick from "@/app/components/Trick";
import { auth, db, trackEvent } from "@/firebase/config";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { problemSet } from "@/app/utils/problemGenerator";
import updateLeaderboard from "@/app/components/updateLeaderboard";
import MathComponent from "@/app/components/MathComponent";

const Home = ({ params }: { params: { id: string } }) => {
  const MAX_QUESTION_COUNT = 5;
  const router = useRouter();
  const [randomizer, setRandomizer] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [rightLeft, setRightLeft] = useState(false);
  const [questionLimited, setQuestionLimited] = useState(true);
  const [autoEnter, setAutoEnter] = useState(true);
  const [questions, setQuestions] = useState(0);
  const [stopTimer, setStopTimer] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<string[]>([]);
  const [storedQuestions, setStoredQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (params.id === "randomizer") setRandomizer(true);
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const docSnap = await getDoc(doc(db, "users", authUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setQuestionLimited(data?.questionLimited ?? true);
          setRightLeft(data?.rightLeft ?? false);
          setAutoEnter(data?.autoEnter ?? true);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [params.id]);

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
    if (questions === 5 && questionLimited && !randomizer) {
      setStopTimer(true);
      if (user) {
        updateLeaderboard(user, db, Number(params.id), formatTime(elapsedTime));
        trackEvent("practice_session_completed", {
          trick_id: Number(params.id),
          duration_ms: elapsedTime,
          questions_answered: questions,
        });
      }
    }
  }, [questions, questionLimited, user?.uid, params.id, elapsedTime, user, randomizer]);

  const formatTime = (time: number) => {
    const milliseconds = Math.floor((time % 1000) / 10);
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  function getFirstNonZeroIndex(str: string) {
    for (let i = 0; i < str.length; i++) {
      if (str[i] !== "0" && str[i] !== ":") {
        return i;
      }
    }
    return -1; // Return -1 if no non-zero number is found
  }

  function averageTimeInSeconds(totalTime: string, numberOfItems: number) {
    // Helper function to convert time string (MM:ss.mm) to total seconds
    function timeStringToSeconds(timeString: string) {
      const [minutes, seconds] = timeString.split(":");
      const [wholeSeconds, milliseconds] = seconds.split(".");

      return (
        parseInt(minutes) * 60 + // Convert minutes to seconds
        parseInt(wholeSeconds) + // Add seconds
        parseInt(milliseconds || "0") / 100 // Add fractional seconds (milliseconds to seconds)
      );
    }

    // Convert total time to seconds
    const totalSeconds = timeStringToSeconds(totalTime);

    // Calculate the average time in seconds
    const averageSeconds = totalSeconds / numberOfItems;

    return Math.round(averageSeconds * 100) / 100;
  }

  return (
    <main className="w-screen min-h-screen flex-col flex bg-orange-300">
      <div className="bg-white text-3xl p-4 font-bold text-orange-300 w-full flex flex-row justify-center">
        <button
          onClick={() => {
            router.push("/home");
          }}
          className="absolute left-3 text-white hover:bg-orange-500 hover:text-gray-300 text-xl md:text-4xl px-3 rounded-2xl pb-1 bg-orange-300"
        >
          {"⌂"}
        </button>
        <p className="w-[90%] md:w-auto ml-[-7.5px] md:ml-[-10px] text-center text-xl md:text-3xl">
          <MathComponent math={randomizer ? "Randomizer" : problemSet[Number(params.id)]} />
        </p>
      </div>
      <div className="mt-3 justify-center flex gap-x-4 items-center">
        {randomizer ? (
          <></>
        ) : !questionLimited ? (
          <div className="text-orange-300 bg-white text-4xl font-semibold rounded-2xl py-1 px-3">
            <FaInfinity />
          </div>
        ) : (
          <>
            <div className="text-orange-300 bg-white text-2xl font-semibold rounded-2xl py-1 px-3 ml-[-8px] md:ml-[0px]">
              {questions}/{MAX_QUESTION_COUNT}
            </div>
            <div className="text-center bg-white w-[8.3rem] text-orange-300 rounded-2xl text-2xl py-1 px-3 font-semibold ml-[-5.5px] md:ml-[0px]">
              {formatTime(elapsedTime)}
            </div>
          </>
        )}
      </div>
      <Trick
        rightLeft={rightLeft}
        trick={params.id}
        question={questions}
        setQuestion={setQuestions}
        questionLimited={questionLimited}
        setQuestionTiming={setQuestionTimes}
        setStoredQuestion={setStoredQuestions}
      />
      {questions >= 5 ? (
        <div className="font-semibold text-6xl w-screen flex text-white flex-col justify-center items-center gap-x-4 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <h2 className="text-orange-300 md:text-4xl text-2xl bg-white rounded-2xl shadow-lg p-3 ">
            {formatTime(elapsedTime)}
          </h2>
          <div className="mt-6 flex flex-row items-center justify-center gap-x-8">
            <div>
              {questionTimes.map((item: string, index: number) => (
                <div className="mt-4 text-xl md:text-3xl flex flex-row justify-between" key={index}>
                  <p className="mr-8">
                    <MathComponent math={index + 1 + ")    " + storedQuestions[index]} />
                  </p>
                </div>
              ))}
            </div>
            <div className="border-l-white border-l-2">
              {questionTimes.map((item: string, index: number) => (
                <div
                  className="ml-8 mt-4 md:mt-3 text-xl md:text-3xl flex flex-row justify-between"
                  key={index}
                >
                  <MathComponent math={item.substring(getFirstNonZeroIndex(item)) + "s"} />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setQuestionTimes([]);
                setStoredQuestions([]);
                setQuestions(0);
                setStartTime(Date.now()); // Reset the startTime to the current timestamp
                setElapsedTime(0); // Reset the elapsedTime to 0
                setStopTimer(false); // Ensure timer resumes after reset
              }}
              className="ml-6 hover:bg-gray-200 bg-white mt-8 text-orange-300 p-0 md:p-3 rounded-xl md:rounded-3xl"
            >
              <VscDebugRestart />
            </button>
          </div>
          <p className="mt-8 md:mt-4 text-3xl md:text-4xl font-mono">
            <u>{averageTimeInSeconds(formatTime(elapsedTime), 5)}</u>s per question
          </p>
        </div>
      ) : null}
    </main>
  );
};

export default Home;
