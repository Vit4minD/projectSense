"use client";
import { db } from "@/firebase/config";
import { collection, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { problemSet } from "@/app/utils/problemGenerator";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  ChakraProvider,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FaTrophy } from "react-icons/fa";
import { BlockMath } from "react-katex";
import MathComponent from "../components/MathComponent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard"
}

const Home = () => {
  const [currentBoard, setCurrentBoard] = useState(1);
  const keys = useMemo(() => Object.keys(problemSet).map(Number), []);
  const router = useRouter();
  const [sortedScores, setSortedScores] = useState<string[]>([]);
  // Helper function to compare time strings ("MM:SS.mm")
  const compareTimes = (time1: string, time2: string): number => {
    const [min1, secMs1] = time1.split(":");
    const [sec1, ms1] = secMs1.split(".").map(parseFloat);
    const [min2, secMs2] = time2.split(":");
    const [sec2, ms2] = secMs2.split(".").map(parseFloat);

    const totalMs1 = parseFloat(min1) * 60000 + sec1 * 1000 + ms1;
    const totalMs2 = parseFloat(min2) * 60000 + sec2 * 1000 + ms2;

    return totalMs1 - totalMs2; // Negative if time1 is smaller, positive if time2 is smaller
  };
  useEffect(() => {
    const sortScoresByTime = (scores: string[]): string[] => {
      // Convert the array of strings into an array of ScoreEntry objects
      const scoreEntries: ScoreEntry[] = scores.map((score) => {
        const [time, email] = score.split(" ");
        return { time, email };
      });

      // Sort the array based on the time values
      scoreEntries.sort((a, b) => compareTimes(a.time, b.time));

      // Convert back to an array of strings
      const sortedScores = scoreEntries.map(
        (entry) => `${entry.time} ${entry.email}`
      );

      return sortedScores;
    };
    const fetchData = async () => {
      try {
        const docRef = doc(collection(db, "leaderboard"), String(currentBoard));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const map = data["scores"];
          const resultArray = Object.entries(map).map(
            ([key, value]) => `${value} ${key}`
          );
          const performSort = sortScoresByTime(resultArray);
          setSortedScores(performSort);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };
    fetchData();
  }, [currentBoard]);

  interface ScoreEntry {
    time: string;
    email: string;
  }
  const disableScroll = () => {
    document.body.style.overflow = 'hidden';
  };

  const enableScroll = () => {
    document.body.style.overflow = 'auto';
  };
  return (
    <ChakraProvider>
      <main className="w-full min-h-screen overflow-y-hidden flex-col flex bg-orange-300 overflow-x-hidden">
        <div className="bg-white text-3xl p-4 font-bold text-orange-300 w-full flex flex-row justify-center relative">
          <button
            onClick={async () => {
              await Promise.all([router.push("/home")]);
            }}
            className="absolute left-3 text-white hover:bg-orange-500 hover:text-gray-300 text-4xl px-3 rounded-2xl pb-1 bg-orange-300"
          >
            {"⌂"}
          </button>
          <p className="text-center w-full">Leaderboards</p>
        </div>

        <Menu onOpen={disableScroll} onClose={enableScroll}>
          <MenuButton
            color="rgb(253, 186, 116)"
            backgroundColor="white"
            className="w-fit ml-4 mt-3 md:mt-4 py-2 px-2 md:py-4 md:px-6 text-sm md:text-base"
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
                <MathComponent math=  {problemSet[value]} />
                </MenuItem>
              ) : (
                <></>
              )
            )}
          </MenuList>
        </Menu>

        <FaTrophy className="mx-auto text-[8rem] md:text-[12rem] text-white" />
        <hr className="w-5/6 mx-auto mt-2 mb-3" />
        <div className="w-full flex flex-col items-center">
          {sortedScores.map((score, index) => {
            const [time, email] = score.split(" ");
            return (
              <div
                key={index}
                className="my-3 gap-x-2 md:gap-x-4 w-[90%] md:w-[80%] mx-auto text-lg md:text-2xl flex flex-row items-center justify-between "
              >
                <p className="bg-white px-4 text-orange-300 py-2 md:py-3 rounded-2xl font-bold text-center md:w-[4rem]">
                  {index + 1}
                </p>
                <p className="bg-white text-orange-300 py-2 md:py-3 rounded-2xl font-bold text-center flex-grow">
                  {email.substring(0, email.indexOf("@"))}
                </p>
                <p className="bg-white px-2 md:px-4 text-orange-300 py-2 md:py-3 rounded-2xl font-bold text-center w-fit">
                  {time}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </ChakraProvider>
  );
};
export default Home;
