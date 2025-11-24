import React, { useState, useRef } from 'react';
import { Camera, Send, X, AlertCircle, FileText, Upload } from 'lucide-react';

export default function SymptomInput({ onAnalyze, isLoading }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    onAnalyze(text, image);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-medical-500" />
          Describe Symptoms
        </h2>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Powered</span>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-4">
          <label htmlFor="symptoms" className="block text-sm font-medium text-slate-700 mb-2">What are you feeling?</label>
          <textarea
            id="symptoms"
            className="w-full h-32 p-4 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all resize-none placeholder:text-slate-400"
            placeholder="E.g., I have a sharp pain in my lower right abdomen, mild fever, and nausea..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {preview && (
          <div className="mb-4 relative w-full sm:w-48 h-48 bg-slate-100 rounded-lg overflow-hidden group">
            <img src={preview} alt="Symptom preview" className="w-full h-full object-cover" />
            <button type="button" onClick={clearImage} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageChange} />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-medical-600 hover:border-medical-200 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-500">
              <Camera className="w-4 h-4 mr-2" />
              {preview ? 'Change Photo' : 'Add Photo (Optional)'}
            </button>
            <p className="mt-2 text-xs text-slate-400 flex items-center"><Upload className="w-3 h-3 mr-1" /> Upload a photo of a visible sign (e.g., rash, swelling)</p>
          </div>

          <button type="submit" disabled={isLoading || (!text.trim() && !image)} className={`flex items-center justify-center px-8 py-3 rounded-lg text-white font-medium shadow-lg shadow-medical-500/25 transition-all w-full sm:w-auto ${isLoading || (!text.trim() && !image) ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-medical-600 hover:bg-medical-500 hover:translate-y-[-1px] active:translate-y-[1px]'}`}>
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                Analyze Condition <Send className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 flex items-start"><AlertCircle className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0 text-amber-500" />For demonstration purposes only. Always consult a real doctor for medical advice.</p>
      </div>
    </div>
  );
}
