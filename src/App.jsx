import PdfEditor from './components/PdfEditor';

function App() {
  return (
    <div className=" bg-gray-100 p-8 font-sans">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-indigo-700 mb-4">
          BoloForms Signature Engine
        </h1>
        <p className="text-gray-600">
          Drag, Drop, and Burn-in signatures perfectly.
        </p>
      </header>
      <PdfEditor />
    </div>
  );
}

export default App;
