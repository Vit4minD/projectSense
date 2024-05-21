'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "../../firebase/config";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db } from "../../firebase/config";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const colRef = collection(db, 'users');
  const provider = new GoogleAuthProvider();

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await router.prefetch("/home");
      if (user) {
        const email = user.email;
        if (email) {
          const docRef = doc(colRef, email);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, {});
          }
          router.push("/home");
        } else {
          console.error("Email is null or undefined");
        }
      } else {
        console.error("User is null or undefined");
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      alert("An error occurred during sign-in. Please try again.");
    }
  };
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      await router.prefetch("/home");
      if (user) {
        const email = user.email;
        if (email) {
          const docRef = doc(colRef, email);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, {});
          }
          router.push("/home");
        } else {
          console.error("Email is null or undefined");
        }
      } else {
        console.error("User is null or undefined");
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      alert("An error occurred during sign-in. Please try again.");
    }
  }

  return (
    <main className="flex-col w-screen h-screen flex items-center justify-center bg-orange-300">
      <h1 className="absolute top-12 text-orange-300 p-4 rounded-xl bg-white font-sans font-bold text-4xl">Project Sense</h1>
      <div className="shadow-2xl bg-white w-72 h-[21.7rem] font-sans rounded-2xl text-center">
        <div className="text-center w-full font-semibold pt-8 pb-4 text-2xl">Register</div>
        <form onSubmit={onSubmit}>
          <input type='text' onChange={(e) => setEmail(e.target.value)} placeholder={'Email'} className="shadow-lg rounded-lg focus:outline-none border-gray-300 p-3 border-b-2 mx-auto w-10/12 h-fit text-xl" />
          <input type='password' onChange={(e) => setPassword(e.target.value)} placeholder='Password' className="shadow-lg rounded-lg mt-2 focus:outline-none border-gray-300 p-3 border-b-2 w-10/12 h-fit text-xl" />
          <div className="mt-3 hover:bg-slate-800 bg-black text-white w-fit mx-auto px-3 py-2 rounded-2xl">
            <button type='submit'>Register</button>
          </div>
        </form>
        <hr className="my-2 mx-auto w-10/12" />
        <button
          onClick={handleGoogleSignIn}
          className="hover:bg-gray-200 bg-white mt-4 items-center w-10/12 mx-auto text-xl flex py-2 rounded-2xl gap-x-2 justify-center font-serif border-[1px] border-black"
        >
          <FcGoogle className="" />
          <span className='font-sans'>Sign up with Google</span>
        </button>
      </div>

    </main>
  );
};

export default function Home() {
  return (
    <>
      <Register />
    </>
  );
}
