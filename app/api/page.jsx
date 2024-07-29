"use client"
import { useState, useEffect } from 'react'

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY,);

function Gemini() {
    const [text, setText] = useState('');
    const [image1, setImage1] = useState(null);
    const [image2, setImage2] = useState(null);
    const [fileUrl, setFileUrl] = useState('');

    // Converts a File object to a base64-encoded string.
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove "data:<mimeType>;base64," prefix
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function run() {

        try {
            // Define the Gemini model
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = "Can you generate me a test like this with different numbers ";

            const imageParts = [
                {
                    inlineData: {
                        data: await fileToBase64(image1),
                        mimeType: image1.type
                    },
                },
                {
                    inlineData: {
                        data: await fileToBase64(image2),
                        mimeType: image2.type
                    },
                },
            ];

            const result = await model.generateContentStream([prompt, ...imageParts]);
            let accumulatedText = ''
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                console.log(chunkText);
                accumulatedText += chunkText
                setText(accumulatedText)
            }
        } catch (error) {
            console.error('Error generating content:', error);
        }
    }

    return (
        <div>
            <input type="file" onChange={(e) => setImage1(e.target.files[0])} accept="image/*" />
            <input type="file" onChange={(e) => setImage2(e.target.files[0])} accept="image/*" />
            <button onClick={run}>Generate</button>
            <div className='text-2xl grid-cols-4 w-1/2'>
                <h3>Output:</h3>
                <p>{text}</p>
            </div>
        </div>
    );
}

export default Gemini;