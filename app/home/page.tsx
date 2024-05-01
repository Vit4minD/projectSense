'use client'
import { ChakraProvider } from '@chakra-ui/react';
import { useRouter } from "next/navigation";
import { User, signOut } from 'firebase/auth';
import Firebase, { auth } from '@/firebase/config';
import firebase from 'firebase/compat/app';
import { useState, useEffect } from 'react';
import { TbLogout2 } from "react-icons/tb";
import { FaTrophy } from "react-icons/fa";
import { BsMailbox2Flag } from "react-icons/bs";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
} from '@chakra-ui/react';
import { IoIosStar } from "react-icons/io";

const topic: { [key: number]: string } = {
  1: "n * 11",
  2: "n * 25",
  3: "n / 101",
  4: "n / 111",
  5: "n % x",
  6: "n - x",
  7: "n + x",
  8: "Nn * Xx",
  9: "SQUARES 10-35",
  10: "SQUARES (41-59)",
  11: "Tens Trick",
  12: "Σ : n(n+1)/2",
  13: "Estimation",
  14: "90-110 x n",
};
const animations = [
  'animate-slide-left',
  'animate-slide-right',
  'animate-slide-up',
  'animate-slide-down',
];

export default function Home() {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [user, setUser] = useState<null | User>(null);
  const logout = async () => {
    try {
      await signOut(auth);
      router.push(`/`)
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        // User is signed in
        setUser(authUser);
      } else {
        // User is signed out
        setUser(null);
      }
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  return (

    <main className="absolute bg-orange-300 h-screen overflow-auto w-screen flex flex-col items-center">
      <div className="bg-white text-orange-300 font-bold p-4 text-4xl   w-full">
        <div className="bg-white text-5xl p-7 text-orange-300 flex font-bold justify-center items-center">
          <button onClick={() => router.push(`/leaderboard`)} className=" hover:text-6xl hover:p-3 duration-300 ease-in-out absolute left-1 m-3 bg-orange-300 hover:cursor-pointer
           hover:bg-orange-500 p-2 rounded-3xl text-white text-4xl flex items-center"><FaTrophy /></button>
          <div className="absolute text-2xl md:text-3xl">Number Sense</div>
          <div className='absolute right-1 mr-3'>
            <span className="relative flex h-3 w-3 pt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <Button onClick={onOpen} className="hover:text-orange-400 "><BsMailbox2Flag /></Button>
            <ChakraProvider >
              <Modal size={'4xl'} isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader fontSize='5xl' className='underline text-orange-400 text-center' ><IoIosStar />Changelog</ModalHeader>
                  <ModalCloseButton fontSize='xl' className='text-orange-400' />
                  <ModalBody fontSize='3xl'>
                  <div className='p-2'>
                      Patch 2.2: Home Page Layout Redesign
                    </div>
                    <hr className=' h-1 bg-slate-300'></hr>
                    <div className='p-2'>
                      Patch 2.1: Auto-Enter on Questions added
                    </div>
                    <hr className=' h-1 bg-slate-300'></hr>
                    <div className='p-2'>Update 2.0: LEADERBOARDS + Google Auth</div>
                    <hr className=' h-1 bg-slate-300'></hr>
                    <div className='p-2'>Version 1.0: Project Sense Release!
                      <div className='pl-16'>- Practice TMSCA/UIL Number Sense Questions using Project Sense </div>
                      <div className='pl-16'>- Solve 5 Questions as Fast as Possible</div>
                      <div className='pl-16'>- 14 Different Numbersense Styled Problems with Tricks and more to come</div>
                    </div>
                  </ModalBody>
                </ModalContent>
              </Modal>
            </ChakraProvider>
          </div>
        </div>
      </div>

      <div className="font-bold p-2 mb-4 text-white text-center">Note: Timer starts once a bubble is pressed. Solve 5 questions as fast as you can.</div>

      <div className="text-center grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-3 gap-y-16">
        {/* className={`bg-white font-bold text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4 ${animations[Math.floor(Math.random() * animations.length)]} duration-300 ease-in-out`} */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((value) => (
          <button
            key={value}
            value={value}
            onClick={() => router.push(`/home/problems/${value}`)}
            className='h-24'
          >
            <div className={`${animations[Math.floor(Math.random() * animations.length)]} my-auto h-full duration-200 ease-in-out mx-8 text-center items-center flex rounded-2xl justify-center text-5xl font-semibold shadow-xl hover:shadow-2xl hover:scale-105 hover:bg-gray-200 transition`}>
              <div className='flex w-full justify-center text-center items-center h-full duration-200 ease-in-out overflow-y-auto overflow-x-hidden rounded-l-2xl bg-white p-4'>
                {`${topic[value]}`}
              </div>
              <div className='mt-auto h-full duration-200 ease-in-out inline-block align-baseline text-white w-full rounded-r-2xl font-thin bg-orange-400 p-4'>
                _______
              </div>
            </div>
          </button>

        ))}
      </div>
      <div className="flex justify-between w-full mt-auto">
        <button onClick={logout} className="duration-200 ease-in-out hover:text-5xl hover:bg-red-900 hover:animate- font-extrabold ml-4 mb-4 pr-4 text-4xl p-3 rounded-2xl text-white bg-red-500"><TbLogout2 /></button>
        <div className="animate-bounce mb-4 mr-4 text-3xl p-2 rounded-2xl font-semibold text-orange-300 bg-white">{user ? user.email : 'Not logged in'}</div>
      </div>

    </main>
  );

}
