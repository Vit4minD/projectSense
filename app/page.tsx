'use client'
import { auth } from "@/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react"

const Home = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    signInWithEmailAndPassword(auth, email, password).then(() => {
      router.push('/home');
    })
      .catch((error) => {
        alert('Incorrect Email or Password')
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
            <input className="w-5/6 h-16 text-2xl border-b border-black focus:outline-none" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}></input>
          </div>
          <a href='/register' className="text-blue-700 underline">{"Don't have an account?"}</a>
          <div className="p-3 text-center">
            <input className="hover:cursor-pointer hover:bg-orange-800 bg-orange-600 p-3 rounded-2xl text-white text-2xl" type="submit" value="Login" placeholder=""></input>
          </div>
        </form>
      </div>
    </main>
  )
}
export default Home;
