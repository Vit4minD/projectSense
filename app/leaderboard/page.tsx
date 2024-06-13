"use client";
import { auth, db } from "@/firebase/config";
import { User } from "firebase/auth";
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

const Home = () => {
  const [currentBoard, setCurrentBoard] = useState(1);
  const keys = useMemo(() => Object.keys(problemSet).map(Number), []);
  const router = useRouter();
  const colRef = collection(db, "leaderboard");
  // useEffect(() => {
  //   const docRef = doc(colRef, String(currentBoard));
  //   const docSnap = await getDoc(docRef)
  // }, [colRef, currentBoard]);
  return (
    <main className="w-screen min-h-screen flex-col flex bg-orange-300">
      <div className="bg-white text-3xl p-4 font-bold text-orange-300 w-full flex flex-row justify-center">
        <button
          onClick={async () => {
            await Promise.all([router.push("/home")]);
          }}
          className="absolute left-3 text-white hover:bg-orange-500 hover:text-gray-300 text-4xl px-3 rounded-2xl pb-1 bg-orange-300"
        >
          {"⌂"}
        </button>
        <p>Project Sense Leaderboards</p>
      </div>
      <ChakraProvider>
        <Menu>
          <MenuButton
            color="rgb(253, 186, 116)"
            backgroundColor="white"
            className="w-fit ml-4 mt-4 py-4"
            as={Button}
            rightIcon={<ChevronDownIcon />}
          >
            {problemSet[currentBoard]}
          </MenuButton>
          <MenuList maxWidth="5rem" maxHeight="10rem" overflowY="auto">
            {keys.map((value) =>
              currentBoard !== value ? (
                <MenuItem
                  onClick={() => {
                    setCurrentBoard(value);
                  }}
                  key={value}
                >
                  {problemSet[value]}
                </MenuItem>
              ) : null
            )}
          </MenuList>
        </Menu>
      </ChakraProvider>
      <FaTrophy className="mx-auto text-[12rem] text-white" />
      <div className="mt-6 gap-x-4 w-[80%] mx-auto text-2xl justify-center items-center flex flex-row">
        <p className="bg-white px-4 text-orange-300 py-3 rounded-2xl font-bold text-center w-fit">
          hey
        </p>
        <p className="bg-white text-orange-300 py-3 rounded-2xl font-bold text-center w-2/3">
          hi
        </p>
        <p className="bg-white px-4 text-orange-300 py-3 rounded-2xl font-bold text-center w-fit">
          hello
        </p>
      </div>
    </main>
  );
};
export default Home;
