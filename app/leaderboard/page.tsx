"use client";
import { auth, db } from "@/firebase/config";
import { User } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { problemSet } from "@/app/utils/problemGenerator";

const Home = () => {
  const router = useRouter();
  const colRef = collection(db, "users");

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
        <p>Project Sense Leaderboards</p>
      </div>
    </main>
  );
};
export default Home;
