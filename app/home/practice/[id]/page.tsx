"use client";
import React, { useState, useEffect } from "react";
import { FaInfinity } from "react-icons/fa";
import { VscDebugRestart } from "react-icons/vsc";
import Trick from "@/app/components/trick";
import { auth, db } from "@/firebase/config";
import { User } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { problemSet } from "@/app/utils/problemGenerator";
import updateLeaderboard from "@/app/components/updateLeadeboard";

const Home = ({ params }: { params: { id: string } }) => {
  const MAX_QUESTION_COUNT = 5;
  const router = useRouter();
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [rightLeft, setRightLeft] = useState(false);
  const [questionLimited, setQuestionLimited] = useState(true);
  const [autoEnter, setAutoEnter] = useState(true);
  const colRef = collection(db, "users");
  const [questions, setQuestions] = useState(0);
  const [stopTimer, setStopTimer] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const email = authUser.email;
        if (email) {
          const docRef = doc(colRef, email);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setQuestionLimited(data?.questionLimited ?? true);
            setRightLeft(data?.rightLeft ?? false);
            setAutoEnter(data?.autoEnter ?? true);
          }
        } else {
          console.error("Email is null or undefined");
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [colRef]);

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
    if (questions === 5 && questionLimited) {
      setStopTimer(true);
      if (user) {
        const email: string = user.email ? user.email : "";
        updateLeaderboard(
          email,
          db,
          Number(params.id),
          formatTime(elapsedTime)
        );
      }
    }
  }, [questions, questionLimited, user?.email, params.id, elapsedTime, user]);

  const formatTime = (time: number) => {
    const milliseconds = Math.floor((time % 1000) / 10);
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  return (
    <main className="w-screen min-h-screen flex-col flex bg-orange-300">
      <div className="bg-white text-3xl p-4 font-bold text-orange-300 w-full flex flex-row justify-center">
        <button
          onClick={async () => {
            await Promise.all([router.prefetch("/home"), router.push("/home")]);
          }}
          className="absolute left-3 text-white hover:bg-orange-500 hover:text-gray-300 text-xl md:text-4xl px-3 rounded-2xl pb-1 bg-orange-300"
        >
          {"⌂"}
        </button>
        <p className="w-[90%] md:w-auto ml-[-7.5px] md:ml-[-10px] text-center text-xl md:text-3xl">
          {problemSet[Number(params.id)]}{" "}
        </p>
      </div>
      <div className="mt-3 justify-center flex gap-x-4 items-center">
        {!questionLimited ? (
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
      />
      {questions >= 5 ? (
        <div className="font-semibold text-6xl w-screen flex text-white flex-col justify-center items-center gap-x-4 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {formatTime(elapsedTime)}
          <button
            onClick={() => {
              setQuestions(0);
              setStartTime(Date.now()); // Reset the startTime to the current timestamp
              setElapsedTime(0); // Reset the elapsedTime to 0
              setStopTimer(false); // Ensure timer resumes after reset
            }}
            className="hover:bg-gray-200 bg-white mt-8 text-orange-300 p-3 rounded-3xl"
          >
            <VscDebugRestart />
          </button>
        </div>
      ) : null}
    </main>
  );
};

export default Home;
