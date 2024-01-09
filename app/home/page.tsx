'use client'
import Image from 'next/image';
import projectSenseLogo from '../../images/projectSenseLogo.png';
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Firebase, { auth } from '@/firebase/config';
import firebase from 'firebase/compat/app';
import { useState, useEffect } from 'react';

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState(null);

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
        <main className="h-screen overflow-auto w-screen  bg-orange-300">
            <div className="bg-white text-5xl p-8 text-orange-300 flex font-bold justify-center items-center">
                <div className="absolute">Number Sense</div>
                <div className="text-xl absolute right-8">{user ? user.email : 'Not logged in'}</div> 
            </div>
            <div className="font-bold p-2 text-white">Note: Timer Starts Once a Bubble is Pressed* solve 5 questions as fast as you can</div>


            {/* <Image
        className="float-left text-left"
        alt="NS Logo"
        src={projectSenseLogo}
        width="52"
        height="52"
      /> */}
            <button value='1' onClick={() => router.push('/home/problems/1')} className='left-1/3 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                n * 11
            </button>
            <button value='2' onClick={() => router.push('/home/problems/2')} className='top-16 absolute right-1/4 bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                n * 25
            </button>
            <button value='3' onClick={() => router.push('/home/problems/3')} className='left-24 top-64 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                n / 101
            </button>
            <button value='4' onClick={() => router.push('/home/problems/4')} className='right-32 top-72 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                n / 111
            </button>
            <button value='5' onClick={() => router.push('/home/problems/5')} className='left-1/2 top-1/2 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                REMAINDER
            </button>
            <button value='6' onClick={() => router.push('/home/problems/6')} className='bottom-1/4 left-64 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                n - x
            </button>
            <button value='7' onClick={() => router.push('/home/problems/7')} className='bottom-24 left-96 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                n + x
            </button>
            <button value='8' onClick={() => router.push('/home/problems/8')} className='right-28 bottom-28 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                FOIL
            </button>
            <button value='9' onClick={() => router.push('/home/problems/9')} className='left-1/4 top-64 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                SQUARES (10-35)
            </button>
            <button value='10' onClick={() => router.push('/home/problems/10')} className='bottom-64 left-96 translate-x-1/2  absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                SQUARES (41-59)
            </button>
            <button value='11' onClick={() => router.push('/home/problems/11')} className='top-96 left-96 translate-x-1/2 translate-y-1/2 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
                Tens Trick
            </button>
            <button value='12' onClick={() => router.push('/home/problems/12')} className='top-96 right-96 translate-x-1/2 translate-y-1/2 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
            Σ : n(n+1)/2
            </button>
            <button value='13' onClick={() => router.push('/home/problems/13')} className='top-48 left-1/2 translate-x-1/2 translate-y-1/2 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
            Estimation
            </button>
            <button value='14' onClick={() => router.push('/home/problems/14')} className='bottom-48 left-1/2 translate-x-1/2 translate-y-1/2 absolute bg-white font-bold text-3xl text-orange-300 rounded-2xl p-3 m-2 hover:text-white hover:bg-orange-500 hover:p-4'>
            Multiplying 90-110 Trick
            </button>
        </main>
    );
}
