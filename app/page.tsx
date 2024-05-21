'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { FcGoogle } from "react-icons/fc";
import { auth } from "@/firebase/config";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const provider = new GoogleAuthProvider();

  useEffect(() => {
    router.prefetch('/home');
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1550);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        router.push('/home');
      })
      .catch(() => {
        alert('Incorrect Email or Password');
      });
  };

  const handleGoogleSignIn = () => {
    signInWithPopup(auth, provider)
      .then(() => {
        router.push('/home');
      })
      .catch(() => {
        alert('Failed to sign in with Google');
      });
  };

  return (
    <main className="flex-col w-screen h-screen flex items-center justify-center bg-orange-300">
      <div className='absolute w-[14rem] h-[14rem] sm:w-[16rem] sm:h-[16rem] md:w-[18rem] md:h-[18rem] lg:w-[20rem] lg:h-[20rem] animate-fadeIn'>
        <Image
          src="/projectSenseLogo.png"
          alt="Project Sense Logo"
          layout="responsive"
          width={512}
          height={512}
        />
      </div>
      {visible ?
        <>
          <h1 className="animate-slideUp absolute top-12 font-serif text-orange-300 p-4 rounded-xl bg-white italic text-4xl">Project Sense</h1>
          <div className="shadow-2xl bg-white w-72 h-[21.7rem] font-sans rounded-2xl text-center animate-slideUp">
            <div className="text-center w-full font-semibold pt-8 pb-4 text-2xl">Login</div>
            <form onSubmit={onSubmit}>
              <input type='text' onChange={(e) => setEmail(e.target.value)} placeholder={'Email'} className="shadow-lg rounded-lg focus:outline-none border-gray-300 p-3 border-b-2 mx-auto w-10/12 h-fit text-xl" />
              <input type='password' onChange={(e) => setPassword(e.target.value)} placeholder='Password' className="shadow-lg rounded-lg mt-2 focus:outline-none border-gray-300 p-3 border-b-2 w-10/12 h-fit text-xl" />
              <div className="text-sm italic mx-auto my-1 underline text-center w-10/12 "><a href='/register'>Don't have an account?</a></div>
              <div className="mt-1 hover:bg-slate-800 bg-black text-white w-fit mx-auto px-3 py-2 rounded-2xl">
                <button type='submit'>Login</button>
              </div>
            </form>
            <hr className="my-2 mx-auto w-10/12" />
            <button
              onClick={handleGoogleSignIn}
              className="hover:bg-gray-200 bg-white mt-4 items-center w-10/12 mx-auto text-xl flex py-2 rounded-2xl gap-x-2 justify-center font-serif border-[1px] border-black"
            >
              <FcGoogle className="" />
              <span>Sign up with Google</span>
            </button>
          </div>
        </> : <></>}
    </main>
  );
};

export default Home;
