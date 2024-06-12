"use client";
import { auth } from "../../firebase/config";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { db } from "../../firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export default function Home() {
  const numbersArray = Array.from({ length: 38 }, (_, index) => index + 15);
  async function updateAllDocuments() {
    const collectionRef = collection(db, "leaderboard"); // Replace 'your-collection-name' with your actual collection name

    try {
      const querySnapshot = await getDocs(collectionRef);

      querySnapshot.forEach(async (docSnap) => {
        const docRef = doc(collectionRef, docSnap.id); // Use doc function here, not docSnap
        await setDoc(
          docRef,
          {
            scores: [],
          },
          { merge: false }
        );
        console.log(`Document ${docSnap.id} updated successfully`);
      });

      console.log("All documents updated successfully");
    } catch (error) {
      console.error("Error updating documents: ", error);
    }
  }
  async function addDocumentWithCustomId() {
    const collectionRef = collection(db, "leaderboard"); // Replace 'leaderboard' with your actual collection name
    numbersArray.forEach(async (value) => {
      const docRef = doc(collectionRef, String(value)); // Create a reference with custom ID

      try {
        await setDoc(docRef, { scores: [] });
        console.log(`Document with ID ${value} added successfully`);
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    });
  }
  return (
    <>
      <div>hey</div>
      <button
        onClick={addDocumentWithCustomId}
        className="ml-48 bg-black text-white p-5 rounded-2xl"
      >
        CLICK
      </button>
    </>
  );
}
