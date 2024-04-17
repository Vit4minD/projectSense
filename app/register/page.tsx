'use client'
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "../../firebase/config";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db } from "../../firebase/config";
import { collection, doc, setDoc } from "firebase/firestore";
import Image from 'next/image';
import GoogleButton from "react-google-button";

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const colRef = collection(db, 'users');
  const provider = new GoogleAuthProvider();
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
  const handleGoogleSignIn = () => {
    signInWithPopup(auth, provider)
      .then(() => {
        router.push('/home');
      })
      .catch(() => {
        alert('Failed to sign in with Google');
      });
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
          <div className="p-3 text-center">
            <input
              className="hover:cursor-pointer hover:bg-orange-800 bg-orange-600 p-3 rounded-2xl text-white text-2xl md:text-3xl w-full"
              type="submit"
              value="Register"
              placeholder=""
            ></input>
          </div>
          <GoogleButton className='mx-auto' onClick={handleGoogleSignIn}/>
        </form>
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
