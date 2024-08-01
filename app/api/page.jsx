"use client"
import { useState } from 'react'
import { SpinnerDotted } from 'spinners-react';
import { FaPaperPlane } from "react-icons/fa";
import { test1, test2 } from './data';
import { useResetProjection } from 'framer-motion';
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

function Gemini() {
    const [text, setText] = useState(null);
    const [generating, setGenerating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [results, setResults] = useState(null);
    const [answers, setAnswers] = useState(new Array(40).fill(""));
    const [answerKey, setAnswerKey] = useState(null)
    const [lastQuestion, setLastQuestion] = useState(0)

    const handleInputChange = (index) => (event) => {
        const newAnswers = [...answers];
        newAnswers[index] = event.target.value;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });
            const prompt1 = `You are tasked with generating an answer key for a set of math problems. For each problem in the JSON object provided, compute the correct answer and return the answer key as a JSON object with the same keys but with the computed answers.
                Here is the list of math problems: ${JSON.stringify(text)}`
            const result = await model.generateContent([prompt1]);
            const accumulatedText = result.response.text();
            console.log(accumulatedText)
            const json = JSON.parse(accumulatedText)
            setAnswerKey(json)
            const userJson = answers.reduce((obj, item, index) => {
                obj[index + 1] = item;
                if (item != "") setLastQuestion(index + 1)
                return obj;
            }, {});
            console.log(JSON.stringify(userJson))
            const prompt2 = `I have a set of test questions with the correct answers and a set of user answers. I need you to compare the user answers to the correct answers and return a JSON object with number_correct, the amount of questions the user answered correctly.
                Answer key: ${JSON.stringify(answerKey)}
                User's Answers: ${JSON.stringify(userJson)}`
            setAnswers(userJson)
            const grade = await model.generateContent([prompt2]);
            const accumulatedText2 = grade.response.text();
            const json2 = JSON.parse(accumulatedText2)
            console.log(accumulatedText2)
            setResults(json2)
        } catch (error) {
            console.error('Error generating content:', error);
        }
    }

    async function run() {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });
            const prompt = `Create a math test with 40 questions. Each question should be a mathematical problem or equation, formatted as a string with a placeholder for the answer. The test should be output as a JSON object where the keys are question numbers and the values are the questions. Replace the numbers from the following examples with different numbers: ${JSON.stringify(test2)}`
            const result = await model.generateContent([prompt]);
            const accumulatedText = result.response.text();
            console.log(accumulatedText)
            const json = JSON.parse(accumulatedText)
            setText(json)
        } catch (error) {
            console.error('Error generating content:', error);
        }
    }

    return (
        text === null ?
            <main className='w-full h-screen bg-orange-300 items-center flex justify-center'>
                {generating ? <SpinnerDotted color="white" size={150} thickness={150} enabled={generating} /> : (
                    <button onClick={() => {
                        setGenerating(true)
                        run()
                    }} className='bg-white rounded-2xl p-3 md:p-6 shadow-lg text-3xl md:text-5xl font-bold text-orange-400 flex flex-row items-center gap-x-4 hover:scale-105 ease-in-out hover:bg-gray-200 duration-200'>Generate Test with AI<FaPaperPlane /></button>
                )}
            </main> :
            submitting ? !(results === null) ?
                <main className='font-bold font-mono overflow-y-clip w-full h-screen bg-orange-300 text-white'>
                    <h1 className=' text-center p-6 text-4xl md:text-6xl border-b-2 border-white'>Answer Key</h1>
                    <div className='w-full h-full flex flex-row justify-center'>
                        <div className='w-[70%] text-2xl md:text-4xl h-full flex flex-row justify-between items-center'>
                            <div className='w-[50%] flex flex-col h-full border-r-2 border-white overflow-y-auto'>
                                <h1 className='p-4 text-center'>Your Answers</h1>
                                {answers && Object.entries(answers).map(([key, item], index) => (
                                    <p key={index} className='p-2 text-center'>{index + 1}. {item}</p>
                                ))}
                                <hr className='mt-36'></hr>
                            </div>
                            <div className='w-[50%] flex flex-col h-full overflow-y-auto'>
                                <h1 className='p-4 text-center'>AI Answers</h1>
                                {answerKey && Object.entries(answerKey).map(([key, item], index) => (
                                    <p key={index} className='p-2 text-center'>{index + 1}. {item}</p>
                                ))}
                                <hr className='mt-36'></hr>
                            </div>
                        </div>
                        <div className='border-l-2 border-white w-[30%] text-2xl md:text-4xl font-bold h-full flex flex-col items-center justify-center'>
                            <label className='-mt-64 md:mt-0 underline mb-4'>AI Graded Score</label>
                            <label className='text-4xl md:text-6xl'>{lastQuestion * 5 - 9 * (lastQuestion - results["number_correct"])}</label>
                            <label className='text-xl md:text-2xl text-center'>Make sure to check yourself! AI could be wrong.</label>
                        </div>
                    </div>
                    {/* <p className='bg-white w-2/3 text-orange-300 rounded-2xl font-semibold p-4 text-5xl'>{JSON.stringify(results)}</p> */}
                </main> : <main className='w-full h-screen bg-orange-300 items-center flex justify-center'>
                    <SpinnerDotted color="white" size={150} thickness={150} enabled={generating} />
                </main> : (<main className='text-white text-2xl font-mono w-full overflow-y-scroll h-screen bg-orange-300 '>
                    <button className='flex mx-auto p-4 text-4xl md:text-6xl font-semibold' onClick={run}>Project Sense</button>
                    <label className='flex ml-4 md:ml-0 mx-0 md:mx-auto text-lg md:text-xl font-semibold md:justify-center' onClick={run}>Press Tab to Go to Next Question Faster</label>
                    <div className='flex w-[90%] md:w-[80%] flex-col mx-auto items-start font-bold text-lg md:text-3xl'>
                        {text && Object.entries(text).map(([key, item], index) => (
                            <div className='w-full flex flex-row items-center' key={index}>
                                {item ? <>
                                    <p className="my-4 mr-4 shadow-xl p-2 md:p-4 w-[15%] md:w-[10%] text-center items-center  bg-white rounded-2xl text-orange-300" >{"(" + (index + 1) + ")\t"}</p>
                                    <p className="my-2 md:my-4 shadow-xl p-1 md:p-4 mr-2 md:mr-4 w-[80%] bg-white rounded-2xl text-orange-300" >
                                        {item}
                                    </p>
                                    <input type='string' value={answers[index] || ''}
                                        onChange={handleInputChange(index)} className='w-[15%] md:w-[10%] focus:outline-none rounded-2xl text-black p-2 md:p-4 h-10 md:max-h-full'></input>
                                </> : null}
                            </div>
                        ))}
                    </div>
                    <button onClick={handleSubmit} className='mx-auto flex font-bold font-mono underline text-4xl md:text-6xl p-8 hover:decoration-4'>Submit</button>
                </main>)
    );
}

export default Gemini;
