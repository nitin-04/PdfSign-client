import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import axios from 'axios';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { BASE_URL } from '../../constants';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const PdfEditor = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [signatureBox, setSignatureBox] = useState({
    x: 50,
    y: 50,
    width: 200,
    height: 100,
  });
  const [signatureImage, setSignatureImage] = useState(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState('');

  const [pdfPageWidth, setPdfPageWidth] = useState(null);

  const pdfContainerRef = useRef(null);
  const pdfWrapperRef = useRef(null);
  const prevWidthRef = useRef(null);

  useEffect(() => {
    const updateWidth = () => {
      if (pdfWrapperRef.current) {
        const currentWidth = pdfWrapperRef.current.offsetWidth;

        const newWidth = Math.min(currentWidth, 800);

        setPdfPageWidth(newWidth);

        if (prevWidthRef.current && prevWidthRef.current !== newWidth) {
          const ratio = newWidth / prevWidthRef.current;
          setSignatureBox((prev) => ({
            x: prev.x * ratio,
            y: prev.y * ratio,
            width: prev.width * ratio,
            height: prev.height * ratio,
          }));
        }

        prevWidthRef.current = newWidth;
      }
    };

    window.addEventListener('resize', updateWidth);
    updateWidth();

    return () => window.removeEventListener('resize', updateWidth);
  }, [pdfFile]);

  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  const onSignatureUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      setSignatureImage(file);
      const url = URL.createObjectURL(file);
      setSignatureUrl(url);
    } else {
      alert('Please upload a valid PNG or JPG image.');
    }
  };

  const handleSave = async () => {
    if (!pdfFile || !signatureImage || !pdfContainerRef.current) return;

    const { offsetWidth, offsetHeight } = pdfContainerRef.current;

    const xPercent = signatureBox.x / offsetWidth;
    const yPercent = signatureBox.y / offsetHeight;
    const wPercent = signatureBox.width / offsetWidth;
    const hPercent = signatureBox.height / offsetHeight;

    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('signature', signatureImage);
    formData.append('x', xPercent);
    formData.append('y', yPercent);
    formData.append('width', wPercent);
    formData.append('height', hPercent);
    formData.append('pageIndex', 0);

    try {
      const response = await axios.post(`${BASE_URL}sign-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSignedPdfUrl(response.data.url);
    } catch (error) {
      console.error(error);
      alert('Error signing PDF');
    }
  };

  const UploadZone = ({ label, accept, onChange, icon }) => (
    <div className="relative group w-full">
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <span className="text-3xl mb-2">{icon}</span>
          <p className="mb-2 text-sm text-gray-500 font-semibold group-hover:text-blue-600">
            {label}
          </p>
          <p className="text-xs text-gray-400">
            Click to upload or drag & drop
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={onChange}
        />
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans text-gray-800">
      <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-6 flex flex-col gap-6 shadow-sm z-20 md:h-screen md:sticky md:top-0 overflow-y-auto">
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
            1. Document
          </h2>
          {!pdfFile ? (
            <UploadZone
              label="Upload PDF"
              accept="application/pdf"
              onChange={onFileChange}
              icon="📄"
            />
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-800 truncate font-medium max-w-[150px]">
                {pdfFile.name}
              </span>
              <button
                onClick={() => setPdfFile(null)}
                className="text-red-500 hover:text-red-700 text-xs font-bold"
              >
                CHANGE
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
            2. Signature
          </h2>
          {!signatureImage ? (
            <UploadZone
              label="Upload Signature"
              accept="image/png, image/jpeg"
              onChange={onSignatureUpload}
              icon="✍️"
            />
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-800 truncate font-medium">
                  Signature Ready
                </span>
                <button
                  onClick={() => {
                    setSignatureImage(null);
                    setSignatureUrl(null);
                  }}
                  className="text-red-500 hover:text-red-700 text-xs font-bold"
                >
                  REMOVE
                </button>
              </div>
              <img
                src={signatureUrl}
                alt="Preview"
                className="h-12 object-contain opacity-80"
              />
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={!pdfFile || !signatureImage}
            className={`w-full py-3 rounded-lg font-bold text-sm shadow-md transition-all transform active:scale-95 ${
              !pdfFile || !signatureImage
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
            }`}
          >
            BURN SIGNATURE
          </button>

          {signedPdfUrl && (
            <a
              href={signedPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="block mt-4 w-full text-center py-3 border-2 border-green-500 text-green-600 font-bold rounded-lg hover:bg-green-50 transition-colors"
            >
              ⬇️ DOWNLOAD FINAL PDF
            </a>
          )}
        </div>
      </aside>

      <main className="flex-1 bg-gray-100 p-4 md:p-8  flex justify-center items-start relative min-h-screen">
        {!pdfFile ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-20">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg font-medium">
              Upload a PDF document to start editing
            </p>
          </div>
        ) : (
          <div ref={pdfWrapperRef} className="w-full flex justify-center">
            <div className="relative shadow-2xl border border-gray-300 bg-white inline-block">
              <div ref={pdfContainerRef} className="relative">
                <Document
                  file={pdfFile}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  className="flex flex-col items-center"
                >
                  <Page
                    pageNumber={1}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={pdfPageWidth || 300}
                    className="bg-white"
                  />
                </Document>

                <Rnd
                  size={{
                    width: signatureBox.width,
                    height: signatureBox.height,
                  }}
                  position={{ x: signatureBox.x, y: signatureBox.y }}
                  onDragStop={(e, d) => {
                    setSignatureBox((prev) => ({ ...prev, x: d.x, y: d.y }));
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    setSignatureBox({
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      ...position,
                    });
                  }}
                  bounds="parent"
                  className={`border-2 border-dashed border-indigo-500 bg-indigo-50 bg-opacity-20 flex items-center justify-center group ${
                    !signatureUrl ? 'hidden' : ''
                  }`}
                >
                  {signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="w-full h-full object-contain pointer-events-none select-none"
                      draggable="false"
                    />
                  ) : null}

                  <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Drag to move • Corner to resize
                  </div>
                </Rnd>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PdfEditor;
