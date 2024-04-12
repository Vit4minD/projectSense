'use client'
import Image from 'next/image';
import projectSenseLogo from '../../images/projectSenseLogo.png';
import { useRouter } from "next/navigation";
import { User, signOut } from 'firebase/auth';
import Firebase, { auth } from '@/firebase/config';
import firebase from 'firebase/compat/app';
import { useState, useEffect } from 'react';
import { TbLogout2 } from "react-icons/tb";
import { FaTrophy } from "react-icons/fa";

const topic: { [key: number]: string } = {
  1: "n * 11",
  2: "n * 25",
  3: "n / 101",
  4: "n / 111",
  5: "REMAINDER",
  6: "n - x",
  7: "n + x",
  8: "FOIL",
  9: "SQUARES (10-35)",
  10: "SQUARES (41-59)",
  11: "Tens Trick",
  12: "Σ : n(n+1)/2",
  13: "Estimation",
  14: "Multiplying 90-110 Trick",
};
const animations = [
  'animate-slide-left',
  'animate-slide-right',
  'animate-slide-up',
  'animate-slide-down',
];

export default function Home() {
  const router = useRouter();
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
        </div>
      </div>

      <div className="font-bold p-2 text-white text-center">Note: Timer starts once a bubble is pressed. Solve 5 questions as fast as you can.</div>

      {/* Your image component goes here */}

      <div className="text-center grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((value) => (
          <button
            key={value}
            value={value}
            onClick={() => router.push(`/home/problems/${value}`)}
            className={`bg-white font-bold text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4 ${animations[Math.floor(Math.random() * animations.length)]} duration-300 ease-in-out`}>
            {`${topic[value]}`}
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
