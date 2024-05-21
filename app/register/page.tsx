'use client'
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "../../firebase/config";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db } from "../../firebase/config";
import { collection, doc, setDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const colRef = collection(db, 'users');
  const provider = new GoogleAuthProvider();

  const handleGoogleSignIn = () => {
    signInWithPopup(auth, provider)
      .then((user) => {
        const docRef = doc(colRef, email);
        setDoc(docRef, {
          1: '00:00:00',
          2: '00:00:00',
          3: '00:00:00',
          4: '00:00:00',
          5: '00:00:00',
          6: '00:00:00',
          7: '00:00:00',
          8: '00:00:00',
          9: '00:00:00',
          10: '00:00:00',
          11: '00:00:00',
          12: '00:00:00',
          13: '00:00:00',
          14: '00:00:00',
        })
          .then(() => {
            console.log('Document successfully written!');
          })
          .catch((error) => {
            console.error('Error writing document: ', error);
          });
        router.push('/home');
      })
      .catch((error) => {
        alert(error)
      })
  };
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, email, password).then((user) => {
      const docRef = doc(colRef, email);
      setDoc(docRef, {
        1: '00:00:00',
        2: '00:00:00',
        3: '00:00:00',
        4: '00:00:00',
        5: '00:00:00',
        6: '00:00:00',
        7: '00:00:00',
        8: '00:00:00',
        9: '00:00:00',
        10: '00:00:00',
        11: '00:00:00',
        12: '00:00:00',
        13: '00:00:00',
        14: '00:00:00',
      })
        .then(() => {
          console.log('Document successfully written!');
        })
        .catch((error) => {
          console.error('Error writing document: ', error);
        });
      router.push('/home');
    })
      .catch((error) => {
        alert('An account with this email has already been created.')
      })
  }

  return (
    <main className="flex-col w-screen h-screen flex items-center justify-center bg-orange-300">
      <h1 className="absolute top-12 font-serif text-orange-300 p-4 rounded-xl bg-white italic text-4xl">Project Sense</h1>
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
          <span>Sign up with Google</span>
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
