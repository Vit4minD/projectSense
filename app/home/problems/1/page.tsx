"use client";
import { useRouter } from "next/navigation";

const Home = () => {
  const router = useRouter();
  const testcommit = 1;
  return (
    <main className="w-screen min-h-screen flex-col flex bg-orange-300">
      <div className="bg-white text-3xl p-4 font-bold text-orange-300 w-full flex flex-row justify-center">
        <button
          onClick={() => router.push("/home")}
          className="absolute left-5 text-white hover:bg-orange-500 hover:text-gray-300 text-4xl px-3 rounded-2xl pb-1 bg-orange-300"
        >
          {"⌂"}
        </button>
        <p>Project Sense:</p>
        <p className="absolute right-5">username</p>
      </div>
    </main>
  );
};
export default Home;
