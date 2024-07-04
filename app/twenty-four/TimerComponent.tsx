import React, { useEffect } from 'react';

interface TimerProps {
    secondsLeft: number;
    setSecondsLeft: (value: React.SetStateAction<number>) => void; // Callback function when timer reaches 0
    score: number;
    setScore: (value: React.SetStateAction<number>) => void; // Callback function when timer reaches 0
}

const TimerComponent: React.FC<TimerProps> = ({ secondsLeft, setSecondsLeft, score, setScore }) => {
    useEffect(() => {
        const interval = setInterval(() => {
            if (secondsLeft > 0) {
                // Decrease secondsLeft by 1 every second
                setSecondsLeft(prevSeconds => prevSeconds - 1)
            } else {
                clearInterval(interval); // Stop the interval when secondsLeft reaches 0
            }
        }, 1000);

        // Clean up interval on unmount
        return () => clearInterval(interval);
    }, [secondsLeft, setSecondsLeft]); // Add secondsLeft and onTimeUp to dependency array to ensure effect runs when they change

    // Format seconds to display as SS
    const formatTime = (seconds: number): string => {
        return seconds.toString().padStart(2, '0');
    };

    return (
        <div className='flex-row flex'>
            <div className="text-3xl mt-6 font-extrabold text-white w-full text-center">Time: {formatTime(secondsLeft)}</div>
            <div className="text-3xl mt-6 font-extrabold text-white w-full text-center">Score: {score}</div>
        </div>
    );
};

export default TimerComponent;
