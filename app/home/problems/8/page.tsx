// Import necessary modules and styles
'use client'
import Image from 'next/image';
import projectSenseLogo from '../../images/projectSenseLogo.png';
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/config';
import { doc, documentId, getDoc, updateDoc } from 'firebase/firestore';

function timeCompare(time1, time2) {
    if (time1 === "00:00:00") return true;
    const [minutes1, seconds1, milliseconds1] = time1.split(':').map(Number);
    const [minutes2, seconds2, milliseconds2] = time2.split(':').map(Number);

    const totalMilliseconds1 = minutes1 * 60 * 1000 + seconds1 * 1000 + milliseconds1;
    const totalMilliseconds2 = minutes2 * 60 * 1000 + seconds2 * 1000 + milliseconds2;

    return totalMilliseconds1 > totalMilliseconds2;
};

const Home = () => {
    const router = useRouter();
    const [milliseconds, setMilliseconds] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [user, setUser] = useState(null);
    const [num, setNum] = useState(0);
    const [ans, setAns] = useState(0);
    const [userAns, setUserAns] = useState('');
    const [problems, setProblems] = useState(0);
    const [isCorrect, setIsCorrect] = useState(false); // New state for tracking correctness
    const [submit, setSubmit] = useState(0);
    const audioRef = React.createRef();
    const [bestTime, setBestTime] = useState('');
    const [remainder, setRemainder] = useState(0);
    useEffect(() => {
        generateRandomNumbers();
    }, []);
    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const userDocumentRef = doc(db, 'users', user.email);
                const docSnapshot = await getDoc(userDocumentRef);

                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    const oldtime = data[8] || ''; // replace 'oldtime' with the actual key
                    setBestTime(oldtime);
                }
            }
        };

        fetchUserData();
    }, [db, user]);

    const generateRandomNumbers = () => {
        const num1 = Math.floor(Math.random() *90+10);
        setNum(num1)
        const rem= Math.floor(Math.random() *90+10);
        setRemainder(rem)
        setAns(num1 * rem)
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmit(submit + 1);
        if (userAns === ("" + ans)) {
            audioRef.current.play();
            setSubmit(0);
            generateRandomNumbers();
            setUserAns('');
            setProblems(problems + 1);
            setIsCorrect(true); // Set correctness indicator to true
            if (problems == 4) {
                const userDocumentRef = doc(db, 'users', user?.email);
                const docSnapshot = await getDoc(userDocumentRef);
                const data = docSnapshot.data();
                const oldtime = data[8] + "";
                const newData = {
                    8: String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0') + ":" + String(milliseconds+1).substring(0, 2).padStart(2, '0')
                };
                if (timeCompare(oldtime, time)) {
                    updateDoc(userDocumentRef, newData)
                }
                console.log(oldtime);
            }
        } else {
            setIsCorrect(false); // Reset correctness indicator
        }
    }

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

    useEffect(() => {
        let intervalId: string | number | NodeJS.Timeout | undefined;

        intervalId = setInterval(() => {
            if (problems <= 4) {
                setMilliseconds((prevMilliseconds) => (prevMilliseconds + 10) % 1000);

                if (milliseconds === 990) {
                    setSeconds((prevSeconds) => (prevSeconds + 1) % 60);

                    if (seconds === 59) {
                        setMinutes((prevMinutes) => prevMinutes + 1);
                    }
                }
            }
        }, 10);
        

        return () => clearInterval(intervalId);
    }, [milliseconds, seconds, minutes]);

    let time = String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0') + ":" + String(milliseconds+1).substring(0, 2).padStart(2, '0')
    if (problems < 5) {
        return (
            <main className="h-screen overflow-auto w-screen  bg-orange-300">
                <div className="bg-white text-5xl p-8 text-orange-300 flex font-bold justify-center items-center">
                    <button onClick={() => router.push('/home')} className="absolute left-1 ml-2 bg-orange-300 hover:cursor-pointer hover:bg-orange-500 text-white rounded-2xl">{'<-'}</button>
                    <div className="absolute ">Number Sense: FOIL</div>
                    <div className="text-xl absolute right-8">{user ? user.email : 'Not logged in'}</div>
                </div>
                <div className="text-white font-semibold">Personal Best: {bestTime}</div>
                <div className={`text-2xl rounded-2xl p-3 w-fit text-center mx-auto ${submit > 0 ? isCorrect ? 'bg-green-500' : 'bg-red-500' : 'bg-white'}`}>
                    {time + " " + problems + "/5"}
                </div>
                <audio ref={audioRef} src='/correctSound.mp3' />
                <form onSubmit={onSubmit}>
                    <div className="flex items-center text-9xl font-semibold text-white font-sans mt-64 w-full justify-center">
                        <div>
                            {remainder+ " * "+num} =
                            <input
                                autoFocus
                                className={`focus:cursor-auto ml-12 text-center text-9xl text-white bg-orange-300 border-b border-white focus:outline-none overflow-auto w-96`}
                                type="text"
                                value={userAns} onChange={(e) => setUserAns(e.target.value)}
                            />
                        </div>
                    </div>
                </form>
            </main>
        );
    }  else {
        return (
            <main className="h-screen overflow-auto w-screen  bg-orange-300">
                <div className="bg-white text-5xl p-8 text-orange-300 flex font-bold justify-center items-center">
                    <button onClick={() => router.push('/home')} className="absolute left-1 ml-2 bg-orange-300 hover:cursor-pointer hover:bg-orange-500 text-white rounded-2xl">{'<-'}</button>
                    <div className="absolute ">Number Sense: FOIL</div>
                    <div className="text-xl absolute right-8">{user ? user.email : 'Not logged in'}</div>
                </div>
                <div className="text-white font-semibold">Personal Best: {timeCompare(bestTime, time) ? time : bestTime}</div>
                <audio ref={audioRef} src='/correctSound.mp3' />
                <div className="flex items-center text-9xl font-semibold text-white font-sans mt-72 w-full justify-center">
                    <div>
                        {time}
                    </div>
                </div>

            </main>
        );
    }

};
export default Home;
