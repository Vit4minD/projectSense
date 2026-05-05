"use client";
import { db } from "@/firebase/config";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { problemSet } from "@/app/utils/problemGenerator";
import { Menu, MenuButton, MenuList, MenuItem, Button, ChakraProvider } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FaTrophy } from "react-icons/fa";
import MathComponent from "../components/MathComponent";

interface LeaderboardRow {
  email: string;
  time: string;
}

const Home = () => {
  const [currentBoard, setCurrentBoard] = useState(1);
  const keys = useMemo(() => Object.keys(problemSet).map(Number), []);
  const router = useRouter();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const entriesQ = query(
          collection(db, "leaderboards", String(currentBoard), "entries"),
          orderBy("time", "asc"),
          limit(50)
        );
        const snap = await getDocs(entriesQ);
        const next: LeaderboardRow[] = snap.docs.map((d) => {
          const data = d.data() as { email?: string | null; time?: string };
          return {
            email: data.email ?? "anonymous",
            time: data.time ?? "00:00.00",
          };
        });
        setRows(next);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        setRows([]);
      }
    };
    fetchData();
  }, [currentBoard]);

  const disableScroll = () => {
    document.body.style.overflow = "hidden";
  };

  const enableScroll = () => {
    document.body.style.overflow = "auto";
  };
  return (
    <ChakraProvider>
      <main className="w-full min-h-screen overflow-y-hidden flex-col flex bg-orange-300 overflow-x-hidden">
        <div className="bg-white text-3xl p-4 font-bold text-orange-300 w-full flex flex-row justify-center relative">
          <button
            onClick={() => {
              router.push("/home");
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
            marginX={"auto"}
            className="w-fit  ml-4 mt-3 md:mt-4 py-2 px-2 md:py-4 md:px-6 text-sm md:text-base"
            as={Button}
            rightIcon={<ChevronDownIcon />}
          >
            <MathComponent math={problemSet[currentBoard]} />
          </MenuButton>

          <MenuList
            maxH="10rem"
            marginX={"auto"}
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

        <FaTrophy className="mx-auto text-[8rem] md:text-[12rem] text-white" />
        <hr className="w-5/6 mx-auto mt-2 mb-3" />
        <div className="w-full flex flex-col items-center">
          {rows.map(({ email, time }, index) => {
            const atIdx = email.indexOf("@");
            const display = atIdx > 0 ? email.substring(0, atIdx) : email;
            return (
              <div
                key={`${email}-${index}`}
                className="my-3 gap-x-2 md:gap-x-4 w-[90%] md:w-[80%] mx-auto text-lg md:text-2xl flex flex-row items-center justify-between "
              >
                <p className="bg-white px-4 text-orange-300 py-2 md:py-3 rounded-2xl font-bold text-center md:w-[4.1rem]">
                  {index + 1}
                </p>
                <p className="bg-white text-orange-300 py-2 md:py-3 rounded-2xl font-bold text-center flex-grow">
                  {display}
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
