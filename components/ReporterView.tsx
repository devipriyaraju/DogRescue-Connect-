import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentStatus, Incident, Message } from '../types';
import { analyzeIncidentMedia } from '../services/geminiService';
import { Camera, MapPin, Send, Loader2, AlertTriangle, CheckCircle2, ChevronLeft, MessageSquare, Video, Trash2, Tag, Paperclip, Image as ImageIcon, Shield } from 'lucide-react';

export const ReporterView: React.FC = () => {
  const { addIncident, currentLocation, setRole, incidents, addMessage } = useApp();
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'details' | 'success' | 'status' | 'view-report'>('upload');
  const [viewingIncidentId, setViewingIncidentId] = useState<string | null>(null);
  
  // Chat state
  const [replyText, setReplyText] = useState('');
  const [chatAttachment, setChatAttachment] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const viewingIncident = incidents.find(i => i.id === viewingIncidentId);

  useEffect(() => {
    if (step === 'view-report' && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [step, viewingIncident?.messages]);

  const runAnalysis = async (mediaData: string, mimeType: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeIncidentMedia(mediaData, mimeType);
      setAnalysisResult(result);
      if (result.description) {
          setDescription(prev => prev ? prev : result.description);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImage(base64);
      setStep('details');
      if (!analysisResult) runAnalysis(base64, 'image/jpeg');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setVideo(base64);
      setStep('details');
      if (!analysisResult) runAnalysis(base64, 'video/mp4');
    };
    reader.readAsDataURL(file);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleChatMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setChatAttachment(reader.result as string);
    reader.readAsDataURL(file);
    if (chatFileInputRef.current) chatFileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if ((!image && !video) || !currentLocation) return;
    const newIncident: Incident = {
      id: Date.now().toString(),
      image: image || undefined,
      video: video || undefined,
      location: currentLocation,
      description,
      aiAnalysis: analysisResult,
      status: IncidentStatus.REPORTED,
      timestamp: Date.now(),
      messages: []
    };
    addIncident(newIncident);
    setStep('success');
  };

  const handleSendMessage = () => {
    if (!viewingIncidentId || (!replyText.trim() && !chatAttachment)) return;
    const isVideo = chatAttachment?.startsWith('data:video');
    const msg: Message = {
      id: Date.now().toString(),
      sender: 'REPORTER',
      text: replyText,
      image: (!isVideo && chatAttachment) ? chatAttachment : undefined,
      video: (isVideo && chatAttachment) ? chatAttachment : undefined,
      timestamp: Date.now()
    };
    addMessage(viewingIncidentId, msg);
    setReplyText('');
    setChatAttachment(null);
  };

  const reset = () => {
    setImage(null);
    setVideo(null);
    setDescription('');
    setAnalysisResult(null);
    setChatAttachment(null);
    setReplyText('');
    setStep('upload');
  };

  const getTagColor = (tag: string) => {
      const t = tag.toLowerCase();
      if (t.includes('abuse')) return 'bg-red-100 text-red-800 border-red-200';
      if (t.includes('injury') || t.includes('wound') || t.includes('blood') || t.includes('critical')) return 'bg-amber-100 text-amber-800 border-amber-200';
      if (t.includes('sick') || t.includes('disease') || t.includes('infection')) return 'bg-blue-100 text-blue-800 border-blue-200';
      return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-950 z-10"></div>
        <div className="absolute top-2 left-0 w-full h-1 bg-amber-500 z-10"></div>
        
        <div className="bg-white p-6 rounded-full mb-6 animate-bounce shadow-xl border-4 border-emerald-100">
            <CheckCircle2 className="w-16 h-16 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-blue-950 mb-2 tracking-tight uppercase">Report Filed</h2>
        <p className="text-slate-600 mb-8 max-w-xs font-medium">
          PAL Welfare Foundation has received your request. Rescuers will be notified.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
                onClick={reset}
                className="w-full py-4 bg-red-800 text-white rounded-lg font-bold hover:bg-red-900 transition-colors shadow-lg shadow-red-100 uppercase tracking-wide"
            >
                Report Another
            </button>
            <button 
                onClick={() => setStep('status')}
                className="w-full py-4 bg-white text-blue-950 border-2 border-blue-950 rounded-lg font-bold hover:bg-blue-50 transition-colors uppercase tracking-wide"
            >
                Track My Reports
            </button>
        </div>
      </div>
    );
  }

  if (step === 'status') {
      return (
        <div className="min-h-screen bg-slate-50 pb-20">
             <div className="bg-blue-950 text-white shadow-lg p-4 sticky top-0 z-10 flex items-center gap-3 border-b-4 border-amber-500">
                <button onClick={() => setStep('upload')} className="p-1 rounded-full hover:bg-blue-900 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <div className="flex-1 text-center">
                    <h1 className="text-lg font-black uppercase tracking-wide">My Reports</h1>
                    <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">PAL History</p>
                </div>
                <div className="w-8"></div>
            </div>
            <div className="max-w-md mx-auto p-4 space-y-4">
                 {incidents.length === 0 ? (
                     <div className="text-center text-slate-400 mt-20">
                        <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No reports filed yet.</p>
                        <button onClick={() => setStep('upload')} className="mt-4 text-red-800 font-bold hover:underline uppercase text-sm">File a New Report</button>
                     </div>
                 ) : (
                     incidents.map(inc => (
                         <div 
                            key={inc.id} 
                            onClick={() => { setViewingIncidentId(inc.id); setStep('view-report'); }}
                            className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 flex gap-4 cursor-pointer hover:border-amber-500 hover:shadow-md transition-all active:scale-95 transform"
                         >
                             <div className="w-24 h-24 rounded bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                                {inc.image ? (
                                    <img src={inc.image} className="w-full h-full object-cover" alt="Report" />
                                ) : inc.video ? (
                                    <Video className="w-8 h-8 text-slate-400" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                )}
                             </div>
                             
                             <div className="flex-1 min-w-0">
                                 <div className="flex justify-between items-start mb-2">
                                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                                         inc.status === IncidentStatus.REPORTED ? 'bg-red-50 text-red-800 border-red-100' :
                                         inc.status === IncidentStatus.ACKNOWLEDGED ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                         'bg-emerald-50 text-emerald-700 border-emerald-100'
                                     }`}>
                                         {inc.status}
                                     </span>
                                     <span className="text-xs text-slate-400 font-medium">{new Date(inc.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                 </div>
                                 <p className="text-sm text-slate-800 line-clamp-2 mb-2 font-medium">{inc.description || "No description provided."}</p>
                                 
                                 {inc.aiAnalysis?.tags && inc.aiAnalysis.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {inc.aiAnalysis.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${getTagColor(tag)}`}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                 )}

                                 {inc.messages.length > 0 ? (
                                     <div className="text-xs text-blue-950 flex items-center gap-1 font-bold bg-blue-50 px-2 py-1 rounded w-fit border border-blue-100">
                                         <MessageSquare className="w-3 h-3" />
                                         {inc.messages.length} update{inc.messages.length !== 1 ? 's' : ''}
                                     </div>
                                 ) : (
                                     <p className="text-xs text-slate-400 italic">No updates yet</p>
                                 )}
                             </div>
                         </div>
                     ))
                 )}
            </div>
        </div>
      );
  }

  if (step === 'view-report' && viewingIncident) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-blue-950 text-white shadow-lg p-4 sticky top-0 z-10 flex items-center gap-3 border-b-4 border-amber-500">
                <button onClick={() => setStep('status')} className="p-1 rounded-full hover:bg-blue-900 transition-colors">
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <div className="flex-1">
                    <h1 className="text-base font-black uppercase leading-tight">Report Details</h1>
                    <p className="text-xs text-amber-400 opacity-90 font-mono">{new Date(viewingIncident.timestamp).toLocaleString()}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                     viewingIncident.status === IncidentStatus.REPORTED ? 'bg-red-800 text-white' :
                     viewingIncident.status === IncidentStatus.ACKNOWLEDGED ? 'bg-amber-500 text-white' :
                     'bg-emerald-600 text-white'
                 }`}>
                     {viewingIncident.status}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
                    <div className={`grid ${viewingIncident.image && viewingIncident.video ? 'grid-cols-2' : 'grid-cols-1'} gap-1 bg-slate-100`}>
                         {viewingIncident.image && (
                             <img src={viewingIncident.image} alt="Evidence" className="w-full h-48 object-cover" />
                         )}
                         {viewingIncident.video && (
                             <video src={viewingIncident.video} controls className="w-full h-48 object-cover bg-black" />
                         )}
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-blue-950 mb-1 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">Description</h3>
                        <p className="text-sm text-slate-700 my-4 leading-relaxed font-medium">{viewingIncident.description}</p>
                        
                        {viewingIncident.aiAnalysis && (
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                                {viewingIncident.aiAnalysis.tags && (
                                    <div className="flex flex-wrap gap-2">
                                        {viewingIncident.aiAnalysis.tags.map(tag => (
                                            <span key={tag} className={`text-xs px-2 py-1 rounded font-bold border ${getTagColor(tag)}`}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200 font-bold text-slate-600">Severity: {viewingIncident.aiAnalysis.severityLabel}</span>
                                    <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200 font-bold text-slate-600">Action: {viewingIncident.aiAnalysis.suggestedAction}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                    <MessageSquare className="w-4 h-4 text-amber-500" /> Communication Log
                </h3>
                
                <div className="space-y-4">
                    {viewingIncident.messages.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                            <p className="text-sm">No messages yet.</p>
                            <p className="text-xs mt-1">PAL Rescuers will contact you here once assigned.</p>
                        </div>
                    ) : (
                        viewingIncident.messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'REPORTER' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm shadow-sm border ${
                                    msg.sender === 'REPORTER' 
                                        ? 'bg-blue-50 border-blue-100 text-blue-900 rounded-tr-none' 
                                        : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
                                }`}>
                                    {msg.image && (
                                        <img 
                                            src={msg.image} 
                                            alt="Attachment" 
                                            className="w-full h-auto rounded mb-2 border border-black/10"
                                        />
                                    )}
                                    {msg.video && (
                                        <video 
                                            src={msg.video} 
                                            controls
                                            className="w-full h-auto rounded mb-2 border border-black/10"
                                        />
                                    )}
                                    {msg.text && <p className="leading-snug">{msg.text}</p>}
                                    <p className={`text-[10px] mt-1 text-right font-medium ${msg.sender === 'REPORTER' ? 'text-blue-400' : 'text-slate-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="bg-white border-t border-slate-200 p-3 fixed bottom-0 left-0 right-0 max-w-md mx-auto mb-12 sm:mb-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {chatAttachment && (
                    <div className="relative mb-3 w-fit">
                        {chatAttachment.startsWith('data:video') ? (
                             <video src={chatAttachment} className="h-20 w-auto rounded border border-slate-200 shadow-sm" muted />
                        ) : (
                            <img src={chatAttachment} className="h-20 w-auto rounded border border-slate-200 shadow-sm" alt="Preview" />
                        )}
                        <button 
                            onClick={() => setChatAttachment(null)} 
                            className="absolute -top-2 -right-2 bg-white text-slate-500 rounded-full p-1 shadow border border-slate-200 hover:text-red-500"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                )}
                <div className="flex gap-2 items-center">
                    <input type="file" ref={chatFileInputRef} className="hidden" accept="image/*,video/*" onChange={handleChatMediaUpload} />
                     <button 
                        onClick={() => chatFileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-blue-950 hover:bg-slate-100 rounded-full transition-colors"
                        title="Attach photo or video"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input 
                        type="text" 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply to rescuer..."
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-950 focus:ring-1 focus:ring-blue-950"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!replyText.trim() && !chatAttachment}
                        className="bg-blue-950 text-white p-2 rounded-full hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-blue-950 text-white shadow-xl p-4 sticky top-0 z-10 flex items-center gap-3 border-b-4 border-amber-500">
        {step === 'details' && (
            <button onClick={reset} className="p-1 rounded-full hover:bg-blue-900 transition-colors">
                <ChevronLeft className="w-6 h-6 text-white" />
            </button>
        )}
        <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-red-600 fill-red-600" />
                <h1 className="text-lg font-black tracking-tighter uppercase">PAL FOUNDATION</h1>
            </div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Reporting Portal</p>
        </div>
        <div className="w-8"></div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
             <div className="grid grid-cols-2 gap-4 w-full">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-white border-2 border-dashed border-red-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-red-600 hover:bg-red-50 transition-all group shadow-sm hover:shadow-md"
                >
                    <div className="bg-red-50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-red-800" />
                    </div>
                    <p className="text-blue-950 font-bold uppercase text-sm">Take Photo</p>
                </div>

                <div 
                    onClick={() => videoInputRef.current?.click()}
                    className="aspect-square bg-white border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-950 hover:bg-blue-50 transition-all group shadow-sm hover:shadow-md"
                >
                    <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Video className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-blue-950 font-bold uppercase text-sm">Record Video</p>
                </div>
             </div>

             <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-sm text-amber-900 w-full mt-2">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                <p><strong>Safety First:</strong> Maintain distance. Do not approach aggressive animals directly.</p>
            </div>
             
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" capture="environment" onChange={handleVideoUpload} />

             <button onClick={() => setStep('status')} className="text-sm text-slate-500 hover:text-blue-950 font-bold uppercase underline mt-8 tracking-wide">
                View previous reports
            </button>
          </div>
        )}

        {step === 'details' && (image || video) && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200">
              <div className="relative">
                  {image ? <img src={image} alt="Preview" className="w-full h-56 object-cover" /> : <video src={video!} controls className="w-full h-56 object-cover bg-black" />}
                  <button onClick={reset} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 backdrop-blur-sm"><Trash2 className="w-4 h-4" /></button>
              </div>
              
              <div className="p-4 border-b border-slate-100">
                {isAnalyzing ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-950" />
                    <span className="animate-pulse font-medium">Analyzing evidence with AI...</span>
                  </div>
                ) : analysisResult ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${analysisResult.isDog ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {analysisResult.isDog ? 'Dog Detected' : 'Animal Unsure'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${analysisResult.severityScore > 7 ? 'bg-red-50 text-red-800 border-red-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
                            Severity: {analysisResult.severityLabel}
                        </span>
                    </div>
                    {analysisResult.tags && (
                        <div className="flex flex-wrap gap-2">
                            {analysisResult.tags.map((tag: string) => (
                                <span key={tag} className={`text-xs px-2 py-1 rounded font-bold border ${getTagColor(tag)}`}>#{tag}</span>
                            ))}
                        </div>
                    )}
                    {analysisResult.suggestedAction && (
                        <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-200">
                            <strong className="text-blue-950 block mb-1 text-xs uppercase tracking-wide">First Aid</strong> 
                            {analysisResult.suggestedAction}
                        </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-3">
                      {image ? <Video className="w-4 h-4 text-slate-500" /> : <Camera className="w-4 h-4 text-slate-500" />}
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Additional Evidence</h4>
                  </div>
                  {(image && video) || (video && image) ? (
                      <div className="relative rounded overflow-hidden border border-slate-200 bg-black">
                          {image && video ? <video src={video} controls className="w-full h-32 object-contain" /> : <img src={image!} className="w-full h-32 object-cover" alt="Secondary" />}
                          <button onClick={() => image && video ? setVideo(null) : setImage(null)} className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full shadow hover:bg-white"><Trash2 className="w-4 h-4" /></button>
                      </div>
                  ) : (
                    <div onClick={() => image ? videoInputRef.current?.click() : fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded p-4 flex items-center justify-center gap-2 text-slate-500 cursor-pointer hover:border-blue-950 hover:text-blue-950 transition-colors bg-white">
                         {image ? <Video className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                        <span className="text-sm font-bold uppercase">Add {image ? 'video' : 'photo'}</span>
                    </div>
                  )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center gap-3">
                <div className="bg-red-50 p-2 rounded-full text-red-800">
                    <MapPin className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-blue-950 uppercase">Incident Location</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{currentLocation ? `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}` : "Fetching GPS..."}</p>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-blue-950 focus:border-blue-950 focus:outline-none min-h-[100px] text-slate-800 bg-white"
                    placeholder="Describe the injury, visible symptoms, or specific location markers..."
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={!currentLocation}
                className="w-full bg-red-800 text-white py-4 rounded-lg font-black text-lg shadow-lg hover:bg-red-900 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
                <Send className="w-5 h-5" />
                SUBMIT REPORT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};