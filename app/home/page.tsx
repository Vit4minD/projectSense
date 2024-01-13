'use client'
import Image from 'next/image';
import projectSenseLogo from '../../images/projectSenseLogo.png';
import { useRouter } from "next/navigation";
import { User, getAuth, onAuthStateChanged } from 'firebase/auth';
import Firebase, { auth } from '@/firebase/config';
import firebase from 'firebase/compat/app';
import { useState, useEffect } from 'react';

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
    // Add more animation classes based on your preference
];

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState<null | User>(null);

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
        <main className="h-screen overflow-auto w-screen bg-orange-300 flex flex-col items-center">
            <div className="bg-white text-4xl p-4 text-orange-300 font-bold flex justify-center items-center w-full">
                <div className="text-center mx-auto">Number Sense</div>
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
                        {`${topic[value]} ${value}`}
                    </button>
                ))}
            </div>
            <div className="mt-auto mb-4 text-3xl font-semibold text-white">{user ? user.email : 'Not logged in'}</div>
        </main>
    );
}
