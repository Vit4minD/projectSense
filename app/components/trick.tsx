import { useState } from "react";

type TrickProps = {
  trick: string;
  question: number;
  setQuestion: (value: React.SetStateAction<number>) => void;
};

const Trick: React.FC<TrickProps> = ({ trick, setQuestion, question }) => {
  const [userAns, setUserAns] = useState("");
  const [actualAns, setActualAns] = useState("");

  return (
    <div className="text-4xl w-screen flex text-white flex-row justify-center items-center gap-x-4 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
      <div>=</div>
      <input
        className="pb-2 w-1/6 focus:outline-none border-b-2 text-center bg-orange-300"
        type="text"
        onChange={(e) => setUserAns(e.target.value)}
      />
    </div>
  );
};

export default Trick;
