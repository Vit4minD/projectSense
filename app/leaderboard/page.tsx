// Import necessary modules and styles
'use client'
import Image from 'next/image';
import projectSenseLogo from '../../images/projectSenseLogo.png';
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/firebase/config';
import { doc, documentId, getDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { FaHome } from "react-icons/fa";

const Home = () => {
    const router = useRouter();
    return (
        <main className="h-screen overflow-auto w-screen  bg-orange-300">
            <div className="bg-white text-5xl p-12 text-orange-300 flex font-bold justify-center items-center">
                <button onClick={() => router.push('/home')} className="absolute left-1 ml-2 pb-3 pl-4 pr-4 bg-orange-300 hover:cursor-pointer hover:bg-orange-500 text-white rounded-2xl flex items-center">{'⌂'}</button>
                <div className="absolute text-5xl">PROJECT SENSE Leaderboards</div>
            </div>
            <div className=" mt-80 font-bold text-white text-5xl text-center"> coming soon!!!</div>
        </main>
    );

};
export default Home;
