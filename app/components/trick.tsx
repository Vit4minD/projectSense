import { useEffect, useState } from "react";
import { problemFunction } from "../utils/problemGenerator";

type TrickProps = {
  trick: string;
  question: number;
  setQuestion: (value: React.SetStateAction<number>) => void;
  questionLimited: boolean;
};

const Trick: React.FC<TrickProps> = ({
  trick,
  setQuestion,
  question,
  questionLimited,
}) => {
  const [userAns, setUserAns] = useState("");
  const [pair, setPair] = useState({ body: "", ans: "temp" });

  useEffect(() => {
    setPair(problemFunction[trick]());
  }, [trick]);

  useEffect(() => {
    if (userAns === pair["ans"]) {
      setPair(problemFunction[trick]());
      setUserAns(""); // Reset user answer
      if (questionLimited) setQuestion(question + 1);
    }
  }, [userAns, pair, trick, setQuestion, question, questionLimited]);

  return (
    <div className="font-semibold text-6xl w-screen flex text-white flex-row justify-center items-center gap-x-4 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      {question < 5 ? (
        <>
          <div>{pair["body"]}</div>
          <div>=</div>
          <input
            className="pb-2 w-1/5 focus:outline-none border-b-2 text-center bg-orange-300"
            type="text"
            value={userAns}
            onChange={(e) => setUserAns(e.target.value)}
          />
        </>
      ) : null}
    </div>
  );
};

export default Trick;
