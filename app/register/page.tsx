'use client'
import { useRouter } from "next/navigation";
import { useState } from "react"
import { auth } from "../../firebase/config"
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db } from "../../firebase/config";
import { collection, doc, setDoc } from "firebase/firestore";

const Register = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter();
  const colRef = collection(db, 'users')
  
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
      router.push('/');
    })
      .catch((error) => {
        alert('An account with this email has already been created.')
      })
  }

  return (
    <main className="h-screen flex items-center justify-center align-center bg-orange-300">
      <div className="flex items-center justify-center p-5 bg-white rounded-2xl shadow-2xl h-1/2 w-1/3">
        <form className="p-5 text-center" onSubmit={onSubmit}>
          <div className="p-5">
            <input className="w-5/6 h-16 text-2xl border-b border-black focus:outline-none" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}></input>
          </div>
          <div className="p-5">
            <input className="w-5/6 h-16 text-2xl border-b border-black focus:outline-none" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password"></input>
          </div>
          <div className="p-3 text-center">
            <input className="hover:cursor-pointer hover:bg-orange-800 bg-orange-600 p-3 rounded-2xl text-white text-2xl" type="submit" value="Register" placeholder=""></input>
          </div>
        </form>
      </div>
    </main>
  )
}
export default function Home() {
  return (
    <>
      <Register />
    </>
  )
}
