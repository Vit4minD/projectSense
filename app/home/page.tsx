"use client";
import { ChakraProvider } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { User, signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import { FaTrophy } from "react-icons/fa";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { problemSet } from "../utils/problemGenerator";
import MathComponent from "../components/MathComponent";
import { loadMore } from "../components/loadMore";
import { useInView } from "react-intersection-observer";
import { SettingsModal } from "../components/SettingsModal";
import { VideoModal } from "../components/VideoModal";
import { GameModal } from "../components/GameModal";
import { FaRandom } from "react-icons/fa";
import { GiRetroController } from "react-icons/gi";
import { SiVitest } from "react-icons/si";
import { MdOutlineMail } from "react-icons/md";
import { MdOutlineHelpOutline } from "react-icons/md";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<null | User>(null);
  const [rightLeft, setRightLeft] = useState(false);
  const [questionLimited, setQuestionLimited] = useState(true);
  const [autoEnter, setAutoEnter] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { ref, inView } = useInView();
  const [keys, setKeys] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const newData = await loadMore(page);
      setKeys(newData);
    };
    loadData();
  }, [page]);

  useEffect(() => {
    if (inView) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [inView]);

  const updateUser = async (uid: string, newData: Record<string, boolean>) => {
    const userRef = doc(db, "users", uid);
    try {
      await updateDoc(userRef, newData);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push(`/`);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        const docSnap = await getDoc(doc(db, "users", authUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setQuestionLimited(data.questionLimited);
          setRightLeft(data.rightLeft);
          setAutoEnter(data.autoEnter);
        }
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    // <MathJaxContext>
    <ChakraProvider>
      <main className="absolute bg-orange-300  h-auto overflow-x-hidden overflow-y-auto w-full flex flex-col items-center">
        <div className="shadow-inner bg-white text-orange-300 font-bold p-4 text-4xl   w-full">
          <div className="bg-white text-5xl  text-orange-300 flex font-bold justify-center items-center">
            <button
              onClick={() => router.push(`/leaderboard`)}
              className=" hover:text-4xl hover:p-3 duration-300 ease-in-out absolute left-1 m-3 bg-orange-300 hover:cursor-pointer
           hover:bg-orange-500 p-2 rounded-3xl text-white text-2xl md:text-4xl flex items-center"
            >
              <FaTrophy />
            </button>
            <div className="ml-[-100px] md:ml-[0px] absolute text-xl md:text-3xl">
              Project Sense
            </div>
            <div className=" ml-auto">
              <GameModal />
              <SettingsModal
                loading={loading}
                rightLeft={rightLeft}
                updateUser={updateUser}
                user={user}
                setRightLeft={setRightLeft}
                questionLimited={questionLimited}
                logout={logout}
                setQuestionLimited={setQuestionLimited}
              />
            </div>
          </div>
        </div>
        <div className="text-white font-bold text-sm my-2 p-2 text-center md:text-base">
          Note: Timer starts once a bubble is pressed. Solve 5 questions as fast as you can.
        </div>
        <div className="flex flex-row justify-center gap-x-2 ">
          <button
            onClick={() => router.push(`/home/practice/randomizer`)}
            className="flex flex-row items-center  justify-center gap-x-2 text-orange-300 rounded-2xl bg-white font-semibold py-1 md:py-2 px-2 md:px-8 mb-2  md:mb-4 text-lg md:text-4xl font-serif shadow-sm md:shadow-md hover:bg-gray-200 hover:scale-105 "
          >
            <FaRandom /> Random
          </button>
          <button
            onClick={() => router.push(`/multiplayer`)}
            className="flex flex-row items-center  justify-center gap-x-2 text-orange-300 rounded-2xl bg-white font-semibold py-1 md:py-2 px-2 md:px-8 mb-2  md:mb-4 text-lg md:text-4xl font-serif shadow-sm md:shadow-md hover:bg-gray-200 hover:scale-105 "
          >
            <GiRetroController /> Multiplayer
          </button>
          <button
            onClick={() => router.push(`/testGen`)}
            className="flex flex-row items-center  justify-center gap-x-2 text-orange-300 rounded-2xl bg-white font-semibold py-1 md:py-2 px-2 md:px-8 mb-2  md:mb-4 text-lg md:text-4xl font-serif shadow-sm md:shadow-md hover:bg-gray-200 hover:scale-105 "
          >
            <SiVitest /> AI Test
          </button>
        </div>
        <div className=" md:mb-28 mb-4 text-center grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-3 gap-y-8 mt-4 md:gap-y-16">
          {keys.map((value) => (
            <div key={value} className=" animate-slideUp h-23 md:h-24 overflow-y-hidden">
              <div
                className={`my-auto h-full duration-200 ease-in-out mx-12 md:mx-8 text-center items-center flex rounded-2xl justify-center text-3xl font-semibold `}
              >
                <button
                  value={value}
                  onClick={() => router.push(`/home/practice/${value}`)}
                  className="p-2 md:p-4 px-[2.7rem] md:w-[26rem] w-full overflow-y-hidden hover:scale-105 hover:bg-gray-200  flex justify-center items-center h-full duration-200 ease-in-out rounded-l-2xl bg-white text-lg md:text-xl"
                >
                  <MathComponent math={problemSet[value]} />
                </button>
                <VideoModal trick={value} />
              </div>
            </div>
          ))}
        </div>
        <hr ref={ref} className="my-4"></hr>
        <div className=" overflow-x-hidden fixed bottom-0 shadow-inner mt-auto text-center flex font-semibold flex-row py-2 text-[.6rem] md:text-xl font-sans md:py-4 text-orange-300 w-full  bg-white items-center justify-center transition-all duration-500 ease-in-out">
          <p>
            Built for <b>UIL Number Sense</b> by <b>Townview TAG&apos;s UIL Team 2025</b>&apos;{" "}
          </p>
          <p className="md:pb-1 px-1 font-normal">|</p>
          <p>
            <a className="text-[1rem] md:text-2xl" href="https://forms.gle/yneT5vZaBSaLX1vf8">
              <MdOutlineHelpOutline className="hover:scale-105" />
            </a>
          </p>
          <p className="md:pb-1 px-1 font-normal">|</p>
          <p>
            <a href="mailto:projectsense.ns@gmail.com">
              <MdOutlineMail className="text-[1rem] md:text-2xl hover:scale-105" />
            </a>
          </p>
        </div>
      </main>
    </ChakraProvider>
  );
}
