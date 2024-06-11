"use client";
import { ChakraProvider, FormControl, FormLabel } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { User, signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import { TbLogout2 } from "react-icons/tb";
import { FaTrophy } from "react-icons/fa";
import { BsMailbox2Flag } from "react-icons/bs";
import { IoMdSettings } from "react-icons/io";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Switch,
} from "@chakra-ui/react";
import { IoIosStar } from "react-icons/io";
import { useState, useEffect } from "react";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

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
  13: "90-110 x n",
};
const keys = Object.keys(topic).map(Number);

export default function Home() {
  const router = useRouter();
  const colRef = collection(db, "users");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [user, setUser] = useState<null | User>(null);
  const [rightLeft, setRightLeft] = useState(false);
  const [questionLimited, setQuestionLimited] = useState(true);
  const [autoEnter, setAutoEnter] = useState(true);
  const [loading, setLoading] = useState(true);

  const updateUser = async (userId: string, newData: any) => {
    const userRef = doc(db, "users", userId);
    try {
      await updateDoc(userRef, newData);
      console.log("Document successfully updated!");
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
              setLoading(false);
            }
          } else {
            console.error("Email is null or undefined");
          }
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [colRef, router, user]);

  function SettingsModal() {
    const { isOpen, onOpen, onClose } = useDisclosure();
    return (
      <>
        <Button onClick={onOpen} className="ml-5 hover:text-orange-400">
          <IoMdSettings />
        </Button>
        <ChakraProvider>
          <Modal
            isCentered={true}
            size={"2xl"}
            isOpen={isOpen}
            onClose={onClose}
          >
            <ModalOverlay />
            <ModalContent>
              <ModalHeader
                fontSize="5xl"
                className=" mt-4 text-orange-400 text-center"
              >
                Settings
                <hr className="my-2"></hr>
              </ModalHeader>
              <ModalCloseButton fontSize="xl" className="text-orange-400" />
              <ModalBody fontSize="3xl">
                {loading ? (
                  <div>Loading...</div>
                ) : (
                  <>
                    <FormControl
                      display="flex"
                      alignItems="center"
                      textAlign="center"
                      className="mx-auto items-center justify-center"
                    >
                      <FormLabel fontSize="2rem" htmlFor="email-alerts" mb="0">
                        Answer Right to Left
                      </FormLabel>
                      <Switch
                        defaultChecked={rightLeft}
                        id="email-alerts"
                        size="lg"
                        onChange={() => {
                          updateUser(user?.email ?? "", {
                            rightLeft: !rightLeft,
                          });
                          setRightLeft(!rightLeft);
                        }}
                      />
                    </FormControl>
                    <FormControl
                      display="flex"
                      alignItems="center"
                      textAlign="center"
                      className="mx-auto items-center justify-center"
                    >
                      <FormLabel fontSize="2rem" htmlFor="email-alerts" mb="0">
                        No Question Limit
                      </FormLabel>
                      <Switch
                        defaultChecked={!questionLimited}
                        id="email-alerts"
                        size="lg"
                        onChange={() => {
                          updateUser(user?.email ?? "", {
                            questionLimited: !questionLimited,
                          });
                          setQuestionLimited(!questionLimited);
                        }}
                      />
                    </FormControl>
                    <FormControl
                      display="flex"
                      alignItems="center"
                      textAlign="center"
                      className="mx-auto items-center justify-center"
                    >
                      <FormLabel fontSize="2rem" htmlFor="email-alerts" mb="0">
                        Auto-Enter
                      </FormLabel>
                      <Switch
                        defaultChecked={autoEnter}
                        id="email-alerts"
                        size="lg"
                        onChange={() => {
                          updateUser(user?.email ?? "", {
                            autoEnter: !autoEnter,
                          });
                          setAutoEnter(!autoEnter);
                        }}
                      />
                    </FormControl>
                  </>
                )}
                <div className="text-center text-xl mt-4 ">
                  Currently Signed in as: {user ? user.email : ""}
                </div>
                <div className="flex justify-between w-full ">
                  <button
                    onClick={logout}
                    className="items-center flex justify-center text-center duration-200 mt-2 ease-in-out hover:text-3xl hover:bg-red-900 hover:animate- font-extrabold mx-auto  mb-4 pr-4 text-2xl p-3 rounded-2xl text-white bg-red-500"
                  >
                    <div className="pr-2">Sign out</div>
                    <TbLogout2 />
                  </button>
                </div>
              </ModalBody>
            </ModalContent>
          </Modal>
        </ChakraProvider>
      </>
    );
  }

  return (
    <main className="absolute bg-orange-300 h-screen overflow-auto w-screen flex flex-col items-center">
      <div className="bg-white text-orange-300 font-bold p-4 text-4xl   w-full">
        <div className="bg-white text-5xl p-7 text-orange-300 flex font-bold justify-center items-center">
          <button
            onClick={() => router.push(`/leaderboard`)}
            className=" hover:text-6xl hover:p-3 duration-300 ease-in-out absolute left-1 m-3 bg-orange-300 hover:cursor-pointer
           hover:bg-orange-500 p-2 rounded-3xl text-white text-4xl flex items-center"
          >
            <FaTrophy />
          </button>
          <div className="absolute text-2xl md:text-3xl">Project Sense</div>
          <div className="absolute right-1 mr-3">
            <span className="relative flex h-3 w-3 pt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <Button
              onClick={onOpen}
              className="hover:text-orange-400 text-5xl "
            >
              <BsMailbox2Flag />
            </Button>
            {SettingsModal()}
            <ChakraProvider>
              <Modal
                size={"3xl"}
                isOpen={isOpen}
                isCentered={true}
                onClose={onClose}
              >
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader
                    fontSize="5xl"
                    className="underline text-orange-400 text-center"
                  >
                    <IoIosStar />
                    Changelog
                  </ModalHeader>
                  <ModalCloseButton fontSize="xl" className="text-orange-400" />
                  <ModalBody fontSize="3xl">
                    <div className="p-2">
                      Patch 2.2: Home Page Layout Redesign
                    </div>
                    <hr className=" h-1 bg-slate-300"></hr>
                    <div className="p-2">
                      Patch 2.1: Auto-Enter on Questions added
                    </div>
                    <hr className=" h-1 bg-slate-300"></hr>
                    <div className="p-2">
                      Update 2.0: LEADERBOARDS + Google Auth
                    </div>
                    <hr className=" h-1 bg-slate-300"></hr>
                    <div className="p-2">
                      Version 1.0: Project Sense Release!
                      <div className="pl-16">
                        - Practice TMSCA/UIL Number Sense Questions using
                        Project Sense{" "}
                      </div>
                      <div className="pl-16">
                        - Solve 5 Questions as Fast as Possible
                      </div>
                      <div className="pl-16">
                        - 14 Different Numbersense Styled Problems with Tricks
                        and more to come
                      </div>
                    </div>
                  </ModalBody>
                </ModalContent>
              </Modal>
            </ChakraProvider>
          </div>
        </div>
      </div>
      <div className="text-white font-bold my-3">
        Note: Timer starts once a bubble is pressed. Solve 5 questions as fast
        as you can.
      </div>
      <div className=" text-center grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-3 gap-y-16">
        {keys.map((value) => (
          <div key={value} className="h-24 w-[26rem]">
            <div
              className={`my-auto h-full duration-200 ease-in-out mx-8 text-center items-center flex rounded-2xl justify-center text-3xl font-semibold shadow-xl`}
            >
              <button
                value={value}
                onClick={() => router.push(`/home/practice/${value}`)}
                className="hover:scale-105  hover:bg-gray-200  flex w-3/4 justify-center text-center items-center h-full duration-200 ease-in-out overflow-y-auto overflow-x-hidden rounded-l-2xl bg-white p-4"
              >
                {`${topic[value]}`}
              </button>
              <button className="hover:scale-105 hover:bg-orange-500 flex font-extrabold w-1/4 justify-center text-center items-center mt-auto h-full duration-200 ease-in-out  text-4xl align-baseline text-white rounded-r-2xl bg-orange-400 p-4">
                ?
              </button>
            </div>
          </div>
        ))}
      </div>
      <hr className="my-4"></hr>
    </main>
  );
}
