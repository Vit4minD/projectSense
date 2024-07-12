"use client";
import { useEffect, useState } from "react";
import MathComponent from "../components/MathComponent";
import { MdOutlineRestartAlt } from "react-icons/md";
import { combs } from "./dict";
import { evaluate } from "mathjs";
import TimerComponent from "./TimerComponent";
import { useRouter } from "next/navigation";

export default function Home() {
  const [selectedNums, setSelectedNums] = useState<number[]>([]);
  const [currentComb, setCurrentComb] = useState<string[]>([]);
  const [symbol, setSymbol] = useState<string>("");
  const [save, setSave] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [score, setScore] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Initialize currentComb with a random combination from combs
    const temp = combs[Math.floor(Math.random() * combs.length)].split(" ");
    setCurrentComb(temp);
    setSave(temp);
  }, []);

  useEffect(() => {
    if (currentComb.length == 1 && currentComb[0] === "24") {
      const temp = combs[Math.floor(Math.random() * combs.length)].split(" ");
      setCurrentComb(temp);
      setSave(temp);
      setSecondsLeft(secondsLeft + 5);
      setScore(score + 5);
    }
  }, [currentComb]);

  useEffect(() => {
    if (selectedNums.length === 2 && symbol != "") {
      try {
        // Evaluate the expression in ans
        console.log(selectedNums)
        const evalResult = evaluate(currentComb[selectedNums[0]] + symbol + currentComb[selectedNums[1]]);
        console.log(evalResult);

        // Update currentComb by filtering out selected indices
        const newComb = currentComb.filter(
          (_, index) => !selectedNums.includes(index)
        );
        setCurrentComb([...newComb, String(evalResult)]);

        // Clear selectedNums and ans after evaluation
        setSelectedNums([]);
        setSymbol(""); // Reset ans to an empty string after evaluation
      } catch (error) {
        console.log(error);
      }
    }
  }, [selectedNums, symbol])

  return (
    <main className="w-screen h-screen bg-orange-300">
      <button
        onClick={async () => {
          await Promise.all([router.prefetch("/home"), router.push("/home")]);
        }}
        className="absolute left-3 text-orange-300 mt-4 hover:bg-orange-500 hover:text-gray-300 text-xl md:text-4xl px-3 rounded-2xl pb-1 bg-white "
      >
        {"⌂"}
      </button>
      <div className="w-full text-center  pt-16 md:pt-8 text-white text-5xl md:text-6xl font-extrabold underline">
        24
      </div>
      {/* <TimerComponent secondsLeft={secondsLeft} score={score} setScore={setScore} setSecondsLeft={setSecondsLeft} /> */}
      <div className="animate-popUp ease-in-out duration-75 grid grid-cols-2 gap-x-12 gap-y-10 fixed top-1/2 left-[47%] md:left-[50%] transform -translate-x-1/2 md:-translate-y-[60%] -translate-y-[80%] items-center justify-center">
        {currentComb.map((value: string, index: number) => (
          <button
            key={index}
            onClick={() => {
              if (selectedNums.includes(index)) {
                // Remove the value from the array if it is included
                const newSelectedNums = selectedNums.filter(num => num !== index);
                setSelectedNums(newSelectedNums);
              } else if (selectedNums.length < 2) {
                setSelectedNums([...selectedNums, index]);
              }
            }}
            className={` overflow-clip w-28 h-28 md:h-36 rounded-2xl md:w-40 shadow-lg text-4xl md:text-7xl font-extrabold ${selectedNums.includes(index)
              ? "bg-gray-700 text-white"
              : "hover:bg-gray-200 bg-white text-black"
              }`}
          >
            <MathComponent math={value} />
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          setCurrentComb(save);
          setSelectedNums([]);
          setSymbol(""); // Reset ans to an empty string after evaluation
        }}
        className="items-center text-center bg-white w-12 h-12 md:w-24 md:h-24 rounded-3xl md:text-5xl font-extrabold text-black hover:bg-gray-200 border-black border-4 fixed top-1/2 left-[10%] md:left-[20%] transform -translate-x-1/2 -translate-y-[60%]"
      >
        <MdOutlineRestartAlt className="mx-auto text-xl md:text-7xl" />
      </button>
      <div className="flex flex-col gap-y-8 fixed top-1/2 left-[90%] transform -translate-x-1/2 -translate-y-[60%]">
        <button
          onClick={() => {
            const temp =
              combs[Math.floor(Math.random() * combs.length)].split(" ");
            setCurrentComb(temp);
            setSave(temp);
            setSelectedNums([]);
            setSymbol(""); // Reset ans to an empty string after evaluation
          }}
          className="items-center text-center bg-white w-12 h-12 md:w-24 md:h-24 rounded-3xl text-md md:text-3xl font-extrabold text-black hover:bg-gray-200 border-black border-4"
        >
          Skip
        </button>
      </div>
      <div className="flex-row flex absolute justify-center bottom-48 md:bottom-12 w-full text-center mx-auto gap-x-6 md:gap-x-12">
        {["+", "-", "x", "÷"].map((value: string, index: number) => (
          <button
            key={index}
            onClick={() => {
              setSymbol(value === "x" ? "*" : value === "÷" ? "/" : value)
            }}
            className={` w-20 h-20 md:w-28 md:h-28 rounded-3xl text-2xl md:text-5xl font-extrabold  border-black border-4 ${value === symbol || value === "x" && symbol === "*" || value === "÷" && symbol === "/" ? "bg-gray-700 text-white" : "bg-white hover:bg-gray-200 text-black"}`}
          >
            <MathComponent math={value} />
          </button>
        ))}
      </div>
    </main>
  );
}
