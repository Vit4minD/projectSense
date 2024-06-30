import { useEffect, useState } from "react";
import { problemFunction } from "../utils/problemGenerator";
import MathComponent from "./MathComponent";

type TrickProps = {
  trick: string;
  question: number;
  setQuestion: (value: React.SetStateAction<number>) => void;
  questionLimited: boolean;
  rightLeft: boolean;
};

const Trick: React.FC<TrickProps> = ({
  trick,
  setQuestion,
  question,
  questionLimited,
  rightLeft,
}) => {
  const [userAns, setUserAns] = useState("");
  const [pair, setPair] = useState({ body: "", ans: "temp" });
  const [type, setType] = useState("");
  useEffect(() => {
    setPair(problemFunction[trick].function());
    setType(problemFunction[trick].type);
  }, [trick]);

  useEffect(() => {
    if (trick === "13" || trick === "44") {
      if (
        Math.abs(Number(userAns) - Number(pair["ans"])) <=
        Number(pair["ans"]) * 0.05
      ) {
        setPair(problemFunction[trick].function());
        setUserAns(""); // Reset user answer
        if (questionLimited) setQuestion(question + 1);
      }
    } else if (userAns === pair["ans"]) {
      setPair(problemFunction[trick].function());
      setUserAns(""); // Reset user answer
      if (questionLimited) setQuestion(question + 1);
    }
  }, [userAns, pair, trick, setQuestion, question, questionLimited]);

  return (
    <div
      className={`font-semibold ${
        trick === "26" ||
        trick === "27" ||
        trick === "35" ||
        trick === "42" ||
        trick === "43"
          ? "text-[2.0rem] md:text-[2.3rem]"
          : "text-[3.0rem] md:text-6xl"
      } w-screen flex flex-col md:flex-row text-white justify-center items-center gap-x-4 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  overflow-wrap break-words whitespace-pre-wrap`}
    >
      {question < 5 ? (
        <>
          <div className={`text-center md:text-left ml-[0px] `}>
            <MathComponent math={pair["body"]} />
          </div>
          <div className="text-center md:text-left">=</div>
          <input
            autoFocus={true}
            className="pb-2 w-2/3 md:w-1/5 focus:outline-none border-b-2 text-center bg-orange-300"
            type="text"
            value={userAns}
            onChange={(e) => {
              if (rightLeft)
                if (e.target.value.length < userAns.length) {
                  setUserAns(userAns.substring(1));
                } else
                  setUserAns(
                    e.target.value.substring(e.target.value.length - 1) +
                      userAns
                  );
              else setUserAns(e.target.value);
            }}
          />
          <label className="text-[3.0rem] mt-2 md:mt-0">{type}</label>
        </>
      ) : null}
    </div>
  );
};

export default Trick;
