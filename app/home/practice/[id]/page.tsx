"use client";
import Trick from "@/app/components/trick";
import { auth, db } from "@/firebase/config";
import { User } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect, SetStateAction } from "react";
import { FaInfinity } from "react-icons/fa";

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
  const [questions, setQuestions] = useState(1);
  useEffect(() => {
    const timerId = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 10);

    return () => {
      clearInterval(timerId);
    };
  }, [startTime]);

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
          onClick={() => router.push("/home")}
          className="absolute left-3 text-white hover:bg-orange-500 hover:text-gray-300 text-4xl px-3 rounded-2xl pb-1 bg-orange-300"
        >
          {"⌂"}
        </button>
        <p>Project Sense: n*11</p>
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
      />
    </main>
  );
};
export default Home;
