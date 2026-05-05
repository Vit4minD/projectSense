"use client";
import { useState } from "react";
import { SpinnerDotted } from "spinners-react";
import { FaPaperPlane } from "react-icons/fa";
import { test2 } from "./data";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

import { updateGeneratedQuestions } from "../components/QuestionCount";
import { trackEvent } from "@/firebase/config";

interface TestQuestion {
  [key: string]: string;
}

interface FeedbackItem {
  question: number;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface GradeResult {
  number_correct: number;
  score: number;
  feedback: FeedbackItem[];
}

function Gemini() {
  const [text, setText] = useState<Record<string, string> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<GradeResult | null>(null);
  const [answers, setAnswers] = useState<string[]>(new Array(40).fill(""));
  const [answerKey, setAnswerKey] = useState<Record<string, string> | null>(null);
  const [lastQuestion, setLastQuestion] = useState(0);

  const handleInputChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswers = [...answers];
    newAnswers[index] = event.target.value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt1 = `You are tasked with generating an answer key for a UIL Number Sense test. For each problem in the JSON object provided, compute the correct answer and return the answer key as a JSON object with the same keys but with the computed answers. Make sure to:
      1. Format fractions as "a/b" or "a b/c" for mixed numbers
      2. Round decimal answers to 2 decimal places
      3. Include units where specified
      4. For base conversions, write the answer in the target base
      5. For word problems, provide the exact numerical answer

      Here is the list of math problems: ${JSON.stringify(text)}`;
      const result = await model.generateContent([prompt1]);
      const accumulatedText = result.response.text();
      const json = JSON.parse(accumulatedText);
      setAnswerKey(json);

      // Convert user answers to a more comparable format
      const userJson: Record<string, string> = answers.reduce(
        (obj: Record<string, string>, item: string, index: number) => {
          if (item.trim() !== "") {
            obj[index + 1] = item.trim();
            setLastQuestion(index + 1);
          }
          return obj;
        },
        {}
      );

      // Use AI to compare answers and calculate score
      const prompt2 = `You are grading a UIL Number Sense test. Compare the user's answers to the correct answers and return a JSON object with:
      1. number_correct: the number of questions answered correctly
      2. score: calculate using UIL rules (5 points per question up to last answered, -4 for each wrong answer)
      3. feedback: an array of objects with:
         - question: the question number
         - userAnswer: the user's answer
         - correctAnswer: the correct answer
         - isCorrect: boolean indicating if the answer is correct

      Consider answers correct if they match exactly or are equivalent (e.g., "1/2" and "0.5" are equivalent).

      Answer key: ${JSON.stringify(json)}
      User's Answers: ${JSON.stringify(userJson)}
      Last Question Answered: ${lastQuestion}`;

      const grade = await model.generateContent([prompt2]);
      const gradeText = grade.response.text();
      const gradeResult = JSON.parse(gradeText);
      setResults(gradeResult);
      trackEvent("ai_test_graded", {
        score: gradeResult.score,
        number_correct: gradeResult.number_correct,
        total: lastQuestion,
      });
    } catch (error) {
      setSubmitting(false);
    }
  };

  // Helper function to compare answers
  function compareAnswers(userAnswer: string, correctAnswer: string): boolean {
    // Remove spaces and convert to lowercase for comparison
    const user = userAnswer.trim().toLowerCase();
    const correct = correctAnswer.trim().toLowerCase();

    // Handle different formats of the same answer
    if (user === correct) return true;

    // Handle decimal/fraction equivalency
    const userNum = parseFloat(user);
    const correctNum = parseFloat(correct);
    if (!isNaN(userNum) && !isNaN(correctNum)) {
      return Math.abs(userNum - correctNum) < 0.001; // Allow for small floating point differences
    }

    // Handle mixed numbers vs fractions
    const userFraction = convertToFraction(user);
    const correctFraction = convertToFraction(correct);
    if (userFraction && correctFraction) {
      return userFraction === correctFraction;
    }

    return false;
  }

  // Helper function to convert mixed numbers and decimals to fractions
  function convertToFraction(str: string): string | null {
    // Handle mixed numbers (e.g., "1 1/2")
    const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1]);
      const num = parseInt(mixedMatch[2]);
      const den = parseInt(mixedMatch[3]);
      return `${whole * den + num}/${den}`;
    }

    // Handle fractions (e.g., "1/2")
    const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      return str;
    }

    // Handle decimals (e.g., "0.5")
    const decimalMatch = str.match(/^\d*\.\d+$/);
    if (decimalMatch) {
      const num = parseFloat(str);
      const den = Math.pow(10, str.split(".")[1].length);
      const gcd = findGCD(Math.round(num * den), den);
      return `${Math.round(num * den) / gcd}/${den / gcd}`;
    }

    return null;
  }

  // Helper function to find Greatest Common Divisor
  function findGCD(a: number, b: number): number {
    return b === 0 ? a : findGCD(b, a % b);
  }

  // Helper function to calculate score
  function calculateScore(lastQuestion: number, correctCount: number): number {
    if (lastQuestion === 0) return 0;
    return lastQuestion * 5 - 9 * (lastQuestion - correctCount);
  }

  async function run() {
    updateGeneratedQuestions(40);
    try {
      setGenerating(true);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" },
      });
      const prompt = `Create a UIL Number Sense test with 40 questions. Follow these guidelines:
      1. Questions should be solvable mentally without calculators
      2. Include a mix of:
         - Basic arithmetic (addition, subtraction, multiplication, division)
         - Fractions and mixed numbers
         - Percentages
         - Square roots and exponents
         - Base conversions
         - Word problems
         - Number theory (GCD, LCM, prime factors)
         - Algebra (simple equations, inequalities)
         - Geometry (area, perimeter, conversions)
         - Sequences and patterns
      3. Format each question with "_________" for the answer
      4. Specify answer format in parentheses when needed (e.g., "fraction", "mixed number", "base 8")
      5. Include units where appropriate
      6. Progress from easier to harder questions
      7. Use the following example format but with different numbers and variations:
      ${JSON.stringify(test2)}
      8. DO NOT COPY THE EXAMPLE NUMBERS, MAKE UP YOUR OWN QUESTIONS
      Return the test as a JSON object where keys are question numbers and values are the questions.`;
      const result = await model.generateContent([prompt]);
      const accumulatedText = result.response.text();
      const json = JSON.parse(accumulatedText);
      setText(json);
      trackEvent("ai_test_generated", {
        question_count: Object.keys(json).length,
      });
    } catch (error) {
      setGenerating(false);
    } finally {
      setGenerating(false);
    }
  }

  return text === null ? (
    <main className="w-full h-screen bg-orange-300 items-center flex justify-center">
      {generating ? (
        <div className="flex flex-col items-center gap-4">
          <SpinnerDotted color="white" size={150} thickness={150} enabled={generating} />
          <p className="text-white text-xl">Generating UIL Number Sense Test...</p>
        </div>
      ) : (
        <button
          onClick={() => {
            setGenerating(true);
            run();
          }}
          className="bg-white rounded-2xl p-3 md:p-6 shadow-lg text-3xl md:text-5xl font-bold text-orange-400 flex flex-row items-center gap-x-4 hover:scale-105 ease-in-out hover:bg-gray-200 duration-200"
        >
          Generate UIL Number Sense Test
          <FaPaperPlane />
        </button>
      )}
    </main>
  ) : submitting ? (
    !(results === null) ? (
      <main className="font-bold font-mono overflow-y-clip w-full h-screen bg-orange-300 text-white">
        <h1 className="text-center p-6 text-4xl md:text-6xl border-b-2 border-white">Answer Key</h1>
        <div className="w-full h-full flex flex-row justify-center">
          <div className="w-[70%] text-2xl md:text-4xl h-full flex flex-row justify-between items-center">
            <div className="w-[50%] flex flex-col h-full border-r-2 border-white overflow-y-auto">
              <h1 className="p-4 text-center">Your Answers</h1>
              {results?.feedback?.map((item: FeedbackItem, index: number) => (
                <div key={index} className="p-2 text-center">
                  <p className="text-lg">
                    {item.question}. {text[item.question]}
                  </p>
                  <p className={`${item.isCorrect ? "text-green-500" : "text-red-500"}`}>
                    Your answer: {item.userAnswer}
                  </p>
                </div>
              ))}
              <hr className="mt-36"></hr>
            </div>
            <div className="w-[50%] flex flex-col h-full overflow-y-auto">
              <h1 className="p-4 text-center">Correct Answers</h1>
              {answerKey &&
                Object.entries(answerKey).map(([key, item], index: number) => (
                  <div key={index} className="p-2 text-center">
                    <p className="text-lg">
                      {index + 1}. {text[index + 1]}
                    </p>
                    <p className="text-green-500">Answer: {item}</p>
                  </div>
                ))}
              <hr className="mt-36"></hr>
            </div>
          </div>
          <div className="border-l-2 border-white w-[30%] text-2xl md:text-4xl font-bold h-full flex flex-col items-center justify-center">
            <label className="-mt-64 md:mt-0 underline mb-4">Score</label>
            <label className="text-4xl md:text-6xl">{results?.score || 0}</label>
            <label className="text-xl md:text-2xl text-center">
              Questions Correct: {results?.number_correct || 0}
            </label>
            <label className="text-xl md:text-2xl text-center">
              Make sure to check yourself! AI could be wrong.
            </label>
          </div>
        </div>
      </main>
    ) : (
      <main className="w-full h-screen bg-orange-300 items-center flex justify-center">
        <div className="flex flex-col items-center gap-4">
          <SpinnerDotted color="white" size={150} thickness={150} enabled={generating} />
          <p className="text-white text-xl">Grading your test...</p>
        </div>
      </main>
    )
  ) : (
    <main className="text-white text-2xl font-mono w-full overflow-y-scroll h-screen bg-orange-300 ">
      <button className="flex mx-auto p-4 text-4xl md:text-6xl font-semibold" onClick={run}>
        UIL Number Sense Practice
      </button>
      <label
        className="flex ml-4 md:ml-0 mx-0 md:mx-auto text-lg md:text-xl font-semibold md:justify-center"
        onClick={run}
      >
        Press Tab to Go to Next Question Faster
      </label>
      <div className="flex w-[90%] md:w-[80%] flex-col mx-auto items-start font-bold text-lg md:text-3xl">
        {text &&
          Object.entries(text).map(([key, item], index: number) => (
            <div className="w-full flex flex-row items-center" key={index}>
              {item ? (
                <>
                  <p className="my-4 mr-4 shadow-xl p-2 md:p-4 w-[15%] md:w-[10%] text-center items-center bg-white rounded-2xl text-orange-300">
                    {"(" + (index + 1) + ")\t"}
                  </p>
                  <p className="my-2 md:my-4 shadow-xl p-1 md:p-4 mr-2 md:mr-4 w-[80%] bg-white rounded-2xl text-orange-300">
                    {item}
                  </p>
                  <input
                    type="string"
                    value={answers[index] || ""}
                    onChange={handleInputChange(index)}
                    className="w-[15%] md:w-[10%] focus:outline-none rounded-2xl text-black p-2 md:p-4 h-10 md:max-h-full"
                  ></input>
                </>
              ) : null}
            </div>
          ))}
      </div>
      <button
        onClick={handleSubmit}
        className="mx-auto flex font-bold font-mono underline text-4xl md:text-6xl p-8 hover:decoration-4"
      >
        Submit
      </button>
    </main>
  );
}

export default Gemini;
