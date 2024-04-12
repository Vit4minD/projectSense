'use client'
import { auth } from "@/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from 'next/image';

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        router.push('/home'); // Redirect to home page if user is signed in
      }
    });

    // Clean up function
    return () => unsubscribe();
  }, [router]);
  
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

  return (
    <main className="min-h-screen flex items-center justify-center bg-orange-300">
      <div className="flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-2xl md:w-1/3 sm:w-5/6">
      <Image src="/projectSenseLogo.png" width={95} height={95} alt="yeah" />
        <form className="p-5 text-center" onSubmit={onSubmit}>
          <div className="p-5">
            <input
              className="w-full md:w-5/6 h-16 text-2xl md:text-3xl border-b border-black focus:outline-none"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            ></input>
          </div>
          <div className="p-5">
            <input
              className="w-full md:w-5/6 h-16 text-2xl md:text-3xl border-b border-black focus:outline-none"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            ></input>
          </div>
          <a href='/register' className="text-blue-700 underline">{"Don't have an account?"}</a>
          <div className="p-3 text-center">
            <input
              className="hover:cursor-pointer hover:bg-orange-800 bg-orange-600 p-3 rounded-2xl text-white text-2xl md:text-3xl w-full"
              type="submit"
              value="Login"
              placeholder=""
            ></input>
          </div>
        </form>
      </div>
    </main>
  );
  
};

export default Home;
