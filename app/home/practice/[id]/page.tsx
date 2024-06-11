"use client";
import Trick from "@/app/components/trick";
import { auth, db } from "@/firebase/config";
import { User } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FaInfinity } from "react-icons/fa";
import { VscDebugRestart } from "react-icons/vsc";

const topic: { [key: number]: string } = {
  1: "n * 11",
  2: "n * 25",
  3: "n / 101",
  4: "n / 111",
  5: "n % x",
  6: "n - x",
  7: "n + x",
  8: "Nn * Xx",
  9: "SQUARES",
  10: "Tens Trick",
  11: "Σ : n(n+1)/2",
  12: "Estimation",
  13: "<100 Multiplication",
  14: ">100 Multiplication",
  15: ">/< 100 Multiplication",
  16: "Dec/Frac Conversion",
  17: "Dec Addition/Subtraction",
  18: "Roman Numerals",
  19: "Cubes",
  20: "GCD",
  30: "LCM",
  31: "Conversion into Base 10",
  32: "Conversion from Base 10",
  33: "Conversion of Base 2, 4, 8",
  34: "Sum of Integral Divisors",
  35: "Sum of Prime Divisors",
  36: "x/90, x/99, x/900, x/990",
  37: "Triangular Numbers",
  38: "Pentagonal Numbers",
  39: "Hexagonal Numbers",
  40: "x^2 + (2x)^2",
  41: "x^2 + (3x)^2",
  42: "Complex Number Multiplication",
  43: "Unit Conversions",
  44: "x^2 + (x+1)^2",
  45: "a/b + b/a",
  46: "# of distinct diagonals in a polygon",
  47: "Sum of n Squares",
  48: "Alternating Sum of n Squares",
  49: "Mean/Median",
  50: "Geometric Mean",
  51: "Harmonic Mean",
  52: "Estimating Square/Cube Roots",
  53: "x% of y",
  54: "a * b/c",
  55: "(a+b) * (a-b)",
  56: "Fibonacci Series",
  57: "Special Sum of Squares",
  58: "3-digit Squares",
  59: "3-digit Cubes",
  60: "(x^3-y^3) / (x-y)",
};

const Home = ({ params }: { params: { id: string } }) => {
  const MAX_QUESTION_COUNT = 5;
  const router = useRouter();
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [user, setUser] = useState<null | User>(null);
  const [rightLeft, setRightLeft] = useState(false);
  const [questionLimited, setQuestionLimited] = useState(true);
  const [autoEnter, setAutoEnter] = useState(true);
  const colRef = collection(db, "users");
  const [questions, setQuestions] = useState(0);
  const [stopTimer, setStopTimer] = useState(false);

  useEffect(() => {
    if (questionLimited) {
      let timerId: string | number | NodeJS.Timeout | undefined;
      if (!stopTimer) {
        timerId = setInterval(() => {
          setElapsedTime(Date.now() - startTime);
        }, 10);
      }
      return () => {
        clearInterval(timerId);
      };
    }
  }, [questionLimited, startTime, stopTimer]);

  useEffect(() => {
    if (questions == 5 && questionLimited) {
      setStopTimer(!stopTimer);
    }
  }, [questionLimited, questions, stopTimer]);

  const formatTime = (time: number) => {
    const milliseconds = Math.floor((time % 1000) / 10);
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        if (user) {
          const email = user.email;
          if (email) {
            const docRef = doc(colRef, email);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              await setQuestionLimited(data["questionLimited"]);
              await setRightLeft(data["rightLeft"]);
              await setAutoEnter(data["autoEnter"]);
            }
          } else {
            console.error("Email is null or undefined");
          }
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [colRef, router, user]);

  return (
    <main className="w-screen min-h-screen flex-col flex bg-orange-300">
      <div className="bg-white text-3xl p-4 font-bold text-orange-300 w-full flex flex-row justify-center">
        <button
          onClick={async () => {
            await Promise.all([router.prefetch("/home"), router.push("/home")]);
          }}
          className="absolute left-3 text-white hover:bg-orange-500 hover:text-gray-300 text-4xl px-3 rounded-2xl pb-1 bg-orange-300"
        >
          {"⌂"}
        </button>
        <p>Project Sense: {topic[Number(params.id)]} </p>
      </div>
      <div className="mt-3 justify-center flex gap-x-4 items-center">
        {!questionLimited ? (
          <div className="text-orange-300 bg-white text-2xl font-semibold rounded-2xl py-1 px-3">
            <FaInfinity />
          </div>
        ) : null}
        {questionLimited ? (
          <>
            <div className="text-orange-300 bg-white text-2xl font-semibold rounded-2xl py-1 px-3">
              {questions}/{MAX_QUESTION_COUNT}
            </div>
            <div className="text-center bg-white w-[8.3rem] text-orange-300 rounded-2xl text-2xl py-1 px-3 font-semibold">
              {formatTime(elapsedTime)}
            </div>
          </>
        ) : null}
      </div>
      <Trick
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
