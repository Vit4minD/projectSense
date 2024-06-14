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
import { useState, useEffect, useMemo } from "react"; // Import useMemo
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { problemSet } from "../utils/problemGenerator";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import MathComponent from "../components/MathComponent";

export default function Home() {
  const router = useRouter();
  const colRef = collection(db, "users");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [user, setUser] = useState<null | User>(null);
  const [rightLeft, setRightLeft] = useState(false);
  const [questionLimited, setQuestionLimited] = useState(true);
  const [autoEnter, setAutoEnter] = useState(true);
  const [loading, setLoading] = useState(true);
  const [mjloading, setmjLoading] = useState(false);

  // Memoize keys array using useMemo
  const keys = useMemo(() => Object.keys(problemSet).map(Number), []);

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
        <Button
          onClick={onOpen}
          className="ml-5 md:text-5xl text-4xl hover:text-orange-400"
        >
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
                        Infinite Questions
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
    // <MathJaxContext>
    <main className="absolute bg-orange-300 h-screen overflow-auto w-screen flex flex-col items-center">
      <div className="bg-white text-orange-300 font-bold p-4 text-4xl   w-full">
        <div className="bg-white text-5xl  text-orange-300 flex font-bold justify-center items-center">
          <button
            onClick={() => router.push(`/leaderboard`)}
            className=" hover:text-4xl hover:p-3 duration-300 ease-in-out absolute left-1 m-3 bg-orange-300 hover:cursor-pointer
           hover:bg-orange-500 p-2 rounded-3xl text-white text-2xl md:text-4xl flex items-center"
          >
            <FaTrophy />
          </button>
          <div className="absolute text-xl md:text-3xl">Project Sense</div>
          <div className=" ml-auto">
            <Button
              onClick={onOpen}
              className="hover:text-orange-400 text-4xl md:text-5xl"
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
      <div className="text-white font-bold text-sm my-2 p-2 text-center md:text-base">
        Note: Timer starts once a bubble is pressed. Solve 5 questions as fast
        as you can.
      </div>
      {mjloading ? (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          role="status"
        >
          <svg
            aria-hidden="true"
            className="w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-orange-400"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <div className=" text-center grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-3 gap-y-16">
          {keys.map((value) => (
            <div
              key={value}
              className=" animate-slideUp h-21 md:h-24 overflow-y-hidden mb-0.125 md:mb-4"
            >
              <div
                className={`my-auto h-full duration-200 ease-in-out mx-12 md:mx-8 text-center items-center flex rounded-2xl justify-center text-3xl font-semibold `}
              >
                <button
                  value={value}
                  onClick={() => router.push(`/home/practice/${value}`)}
                  className="p-2 md:p-4 px-[2.7rem] md:w-[26rem] w-full overflow-y-hidden hover:scale-105 hover:bg-gray-200  flex justify-center items-center h-full duration-200 ease-in-out rounded-l-2xl bg-white text-lg md:text-xl"
                >
                  <MathComponent math={problemSet[value]} />
                  {/* <MathJax className="w-full" suppressHydrationWarning={true}>

                    </MathJax> */}
                </button>
                <button className="hover:scale-105 hover:bg-orange-500 flex font-extrabold md:w-1/4 w-1/2 justify-center text-center items-center mt-auto h-full duration-200 ease-in-out  text-4xl align-baseline text-white rounded-r-2xl bg-orange-400 p-4">
                  ?
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <hr className="my-4"></hr>
    </main>
    // </MathJaxContext>
  );
}
