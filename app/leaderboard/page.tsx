'use client'
import { useEffect, useState } from 'react';
import { FaTrophy } from 'react-icons/fa';
import { useRouter } from "next/navigation";
import { auth, db } from '@/firebase/config';
import { collection, doc, documentId, getDoc, getDocs, updateDoc } from 'firebase/firestore';

const Home = () => {
    const router = useRouter();
    const [topicNum, setTopicNum] = useState(1);
    const [sortedTimes, setSortedTimes] = useState<string[]>([]);

    function sortByFastestTime(array: string[]): string[] {
        // Sorting function to compare times
        const compareTimes = (a: string, b: string): number => {
            const timeA = a.split(' ')[0];
            const timeB = b.split(' ')[0];
            return timeA.localeCompare(timeB, undefined, { numeric: true });
        };

        // Sort the array based on time
        return array.slice().sort(compareTimes);
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const docRef = doc(db, "leaderboard", topicNum + '');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSortedTimes(sortByFastestTime(docSnap.data()['scores']));
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [topicNum]); // Add topicNum as a dependency

    return (
        <main className="h-screen overflow-y-hidden overflow-x-auto w-screen bg-orange-300">
            <div className="bg-white text-5xl p-12 text-orange-300 flex font-bold justify-center items-center">
                <button onClick={() => router.push('/home')} className="absolute left-1 ml-2 pb-3 pl-4 pr-4 bg-orange-300 hover:cursor-pointer hover:bg-orange-500 text-white rounded-2xl flex items-center">{'⌂'}</button>
                <div className="absolute text-5xl">PROJECT SENSE Leaderboards</div>
            </div>
            <main className=" flex flex-row h-screen">
                <div className="   shadow-2xl w-1/5 h-full max-h-screen overflow-y-auto flex flex-col flex-grow bg-purple-50">
                    <div className="bg-orange-400 text-center text-white font-bold text-5xl p-4">Trick:</div>
                    <div className='overflow-y-auto'>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(1)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>n * 11</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(2)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>n * 25</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(3)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>n / 101</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(4)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>n / 111</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(5)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>REMAINDER</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(6)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>n - x</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(7)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>n + x</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(8)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>Foil</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(9)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>Squares 10-35</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(10)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>Squares 41-59</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(11)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>Tens Trick</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(12)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>Σ:n(n+1)/2</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(13)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>Estimation</button>
                        </div>
                        <div className=' my-2 text-center text-orange-200 font-bold text-4xl p-4'>
                            <button onClick={(e) => setTopicNum(14)} className='bg-gray-200 hover:bg-gray-400 hover:p-5 hover:text-5xl shadow-xl rounded-2xl w-3/4 p-4 duration-100 ease-in-out'>* 90-110</button>
                        </div>
                    </div>
                </div>
                <div className='w-4/5 text-center overflow-y-auto'>
                    
                    <div className='bg-orange-300  my-6 p-4 font-bold text-9xl rounded-3xl text-white'>
                        <FaTrophy className='mx-auto' />
                    </div>
                    {sortedTimes.map((item, index) => (
                        <div className="flex justify-between text-orange-300 mx-auto w-4/5 my-6  font-bold">
                            <div className='bg-white p-4 text-5xl rounded-3xl'>{index+1}</div>
                            <div className='bg-white p-4 text-5xl rounded-3xl w-3/5'>{item.substring(9,item.indexOf("@"))}</div>
                            <div key={index} className='bg-white p-4 text-5xl rounded-3xl'>
                                {item.substring(0, 8)}
                            </div>
                        </div>
                    ))}
                    <div className='bg-orange-300 mx-auto w-3/5 my-6 p-4 font-bold text-9xl rounded-3xl text-white'>
                        <hr className=' mt-14'></hr>
                    </div>
                </div>
            </main>
        </main>
    );
};

export default Home;
