import './App.css';

function App() {

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-blue-600">LinkedIn AI Chatbot</h1>
          <p className="text-lg text-gray-700 mt-2">Enhance your LinkedIn experience with AI assistance and voice commands</p>
        </header>
        <footer className="mt-10">
          <p className="text-gray-500 text-center">For more details, visit the extension <a href="https://github.com/mudittiwari/AILinkedInExtension">Github Repository</a></p>
        </footer>
      </div>
    </>
  );
}

export default App;
