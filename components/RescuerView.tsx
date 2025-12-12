import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentStatus, Message, Incident } from '../types';
import { analyzeMediaForAbuse, performIdentityLookup } from '../services/geminiService';
import { MapPin, AlertCircle, MessageSquare, X, Navigation, Send, SlidersHorizontal, Filter, Camera, Trash2, ShieldAlert, Fingerprint, Loader2, UserX, Tag, Video, Image as ImageIcon, Shield, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const RescuerView: React.FC = () => {
  const { incidents, updateIncidentStatus, addMessage, currentLocation, addIncident } = useApp();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isAnalyzingAbuse, setIsAnalyzingAbuse] = useState(false);
  const [isFetchingIdentity, setIsFetchingIdentity] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'ALL'>('ALL');
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [showFilters, setShowFilters] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
        if (statusFilter !== 'ALL' && incident.status !== statusFilter) return false;
        if (currentLocation) {
            const dist = calculateDistance(currentLocation.latitude, currentLocation.longitude, incident.location.latitude, incident.location.longitude);
            if (dist > maxDistance) return false;
        }
        return true;
    }).sort((a, b) => {
         if (currentLocation) {
             return calculateDistance(currentLocation.latitude, currentLocation.longitude, a.location.latitude, a.location.longitude) - calculateDistance(currentLocation.latitude, currentLocation.longitude, b.location.latitude, b.location.longitude);
         }
         return b.timestamp - a.timestamp;
    });
  }, [incidents, statusFilter, maxDistance, currentLocation]);

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || null;

  useEffect(() => {
    if (!selectedIncident || !mapRef.current) return;
    if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current).setView([selectedIncident.location.latitude, selectedIncident.location.longitude], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
        mapInstanceRef.current = map;
    } else {
        mapInstanceRef.current.setView([selectedIncident.location.latitude, selectedIncident.location.longitude], 15);
        mapInstanceRef.current.invalidateSize();
    }
    const map = mapInstanceRef.current;
    map.eachLayer((layer) => { if (layer instanceof L.CircleMarker) map.removeLayer(layer); });
    L.circleMarker([selectedIncident.location.latitude, selectedIncident.location.longitude], { radius: 12, fillColor: '#991b1b', color: '#fff', weight: 3, opacity: 1, fillOpacity: 0.9 }).addTo(map).bindPopup("Incident Location");
  }, [selectedIncident?.id, selectedIncident?.location]);

  useEffect(() => { return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } }; }, []);
  useEffect(() => { if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [selectedIncident?.messages]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAttachment(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = () => {
    if (!selectedIncident || (!replyText.trim() && !attachment)) return;
    const isVideo = attachment?.startsWith('data:video');
    const msg: Message = { id: Date.now().toString(), sender: 'RESCUER', text: replyText, image: (!isVideo && attachment) ? attachment : undefined, video: (isVideo && attachment) ? attachment : undefined, timestamp: Date.now() };
    addMessage(selectedIncident.id, msg);
    setReplyText('');
    setAttachment(null);
  };

  const handlePoliceContact = (type: 'report' | 'share') => {
      if (!selectedIncident?.abuseAnalysis?.suspectDetails) return;
      const details = selectedIncident.abuseAnalysis.suspectDetails;
      const message = type === 'report' ? `URGENT REPORT: Abuse Detected.\nSuspect: ${details.name}\nLoc: ${selectedIncident.location.latitude}, ${selectedIncident.location.longitude}` : `Suspect Details: ${details.name}, ID: ${details.idNumber}`;
      try { window.open(`sms:100?body=${encodeURIComponent(message)}`, '_parent'); } catch (e) { console.log(e); }
      alert(`[SIMULATION] Sending SMS to Police (100):\n\n${message}`);
  };

  const handleAbuseScan = async () => {
      if (!selectedIncident) return;
      setIsAnalyzingAbuse(true);
      try {
          const media = selectedIncident.video || selectedIncident.image;
          if (!media) return;
          const result = await analyzeMediaForAbuse(media, !!selectedIncident.video);
          selectedIncident.abuseAnalysis = result;
          if (result.hasAbuse && result.humanDetected) {
               setIsFetchingIdentity(true);
               const details = await performIdentityLookup();
               selectedIncident.abuseAnalysis.suspectDetails = details;
               setIsFetchingIdentity(false);
          }
      } catch (e) { console.error(e); } finally { setIsAnalyzingAbuse(false); }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
        case IncidentStatus.REPORTED: return 'text-red-800 bg-red-50 border-red-200';
        case IncidentStatus.ACKNOWLEDGED: return 'text-amber-700 bg-amber-50 border-amber-200';
        case IncidentStatus.RESOLVED: return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    }
  };

  const getTagColor = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes('abuse')) return 'bg-red-100 text-red-800 border-red-200';
    if (t.includes('injury') || t.includes('wound')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getDistanceDisplay = (targetLat: number, targetLon: number) => {
      if (!currentLocation) return 'Unknown';
      return `${calculateDistance(currentLocation.latitude, currentLocation.longitude, targetLat, targetLon).toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      <div className={`${selectedIncident ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 bg-white border-r border-slate-200 h-screen overflow-y-auto`}>
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 space-y-3 shadow-sm border-t-4 border-amber-500">
             <div className="flex items-center gap-2 mb-2">
                 <div className="w-8 h-8 bg-blue-950 rounded flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-600 fill-red-600" />
                 </div>
                 <h2 className="text-xl font-black text-blue-950 tracking-tight uppercase">PAL <span className="text-amber-600">RESCUE</span></h2>
             </div>
             
            <div className="flex items-center justify-between">
                <div><h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Cases</h2></div>
                <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded transition-colors border ${showFilters ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-white text-slate-600 border-slate-200'}`}><SlidersHorizontal className="w-4 h-4" /></button>
            </div>

            {showFilters && (
                <div className="space-y-4 pt-2 text-sm border-t border-slate-100 mt-2">
                    <div className="flex flex-wrap gap-2">
                        {['ALL', IncidentStatus.REPORTED, IncidentStatus.ACKNOWLEDGED, IncidentStatus.RESOLVED].map((status) => (
                            <button key={status} onClick={() => setStatusFilter(status as any)} className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase transition-colors ${statusFilter === status ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-slate-600 border-slate-200'}`}>{status === 'ALL' ? 'All' : status}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 w-20">Max {maxDistance}km</span>
                        <input type="range" min="1" max="100" value={maxDistance} onChange={(e) => setMaxDistance(parseInt(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-950" />
                    </div>
                </div>
            )}
        </div>
        
        <div className="divide-y divide-slate-100">
            {filteredIncidents.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                    <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm">No incidents match.</p>
                </div>
            ) : (
                filteredIncidents.map(incident => (
                    <div key={incident.id} onClick={() => setSelectedIncidentId(incident.id)} className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedIncident?.id === incident.id ? 'bg-blue-50 border-l-4 border-blue-950' : 'border-l-4 border-transparent'}`}>
                        <div className="flex gap-3">
                            <div className="w-16 h-16 rounded bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                                {incident.image ? <img src={incident.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-slate-300 m-auto mt-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-black uppercase ${getStatusColor(incident.status)}`}>{incident.status}</span>
                                    <span className="text-xs text-slate-400 font-mono">{new Date(incident.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <h3 className="font-bold text-slate-900 truncate text-sm">{incident.description || "No description"}</h3>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{getDistanceDisplay(incident.location.latitude, incident.location.longitude)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col h-screen bg-slate-50 ${!selectedIncident ? 'hidden md:flex' : 'flex'}`}>
        {selectedIncident ? (
            <>
                <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
                    <button onClick={() => setSelectedIncidentId(null)} className="md:hidden p-2 -ml-2 text-slate-600"><X className="w-6 h-6" /></button>
                    <div className="flex gap-2 ml-auto">
                        {selectedIncident.status === IncidentStatus.REPORTED && (
                            <button onClick={() => updateIncidentStatus(selectedIncident.id, IncidentStatus.ACKNOWLEDGED)} className="px-4 py-2 bg-amber-500 text-white text-xs font-bold uppercase rounded hover:bg-amber-600 transition-colors shadow-sm flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Acknowledge
                            </button>
                        )}
                        {selectedIncident.status !== IncidentStatus.RESOLVED && (
                            <button onClick={() => updateIncidentStatus(selectedIncident.id, IncidentStatus.RESOLVED)} className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold uppercase rounded hover:bg-emerald-800 transition-colors shadow-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Resolve
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-white rounded shadow-sm overflow-hidden border border-slate-200">
                                {selectedIncident.image ? <img src={selectedIncident.image} className="w-full h-64 object-cover" /> : <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-400"><ImageIcon className="w-12 h-12" /></div>}
                            </div>
                            
                            {(selectedIncident.video || selectedIncident.image) && (
                                <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-black text-blue-950 flex items-center gap-2 mb-4 uppercase"><ShieldAlert className="w-5 h-5 text-red-600" /> Law Enforcement Check</h3>
                                    {!selectedIncident.abuseAnalysis ? (
                                        <div className="text-center">
                                            <button onClick={handleAbuseScan} disabled={isAnalyzingAbuse} className="bg-red-800 text-white px-6 py-2 rounded font-bold uppercase hover:bg-red-900 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 mx-auto shadow">{isAnalyzingAbuse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />} Scan for Abuse</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className={`p-4 rounded border ${selectedIncident.abuseAnalysis.hasAbuse ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                                <p className={`font-black uppercase ${selectedIncident.abuseAnalysis.hasAbuse ? 'text-red-800' : 'text-emerald-800'}`}>{selectedIncident.abuseAnalysis.hasAbuse ? 'Abuse Detected' : 'No Abuse Detected'}</p>
                                                <p className="text-xs mt-1 text-slate-700">{selectedIncident.abuseAnalysis.description}</p>
                                            </div>
                                            {selectedIncident.abuseAnalysis.suspectDetails && (
                                                <div className="bg-blue-950 text-slate-200 p-4 rounded text-xs font-mono">
                                                     <p><span className="text-slate-500">Name:</span> <span className="text-white font-bold">{selectedIncident.abuseAnalysis.suspectDetails.name}</span></p>
                                                     <button onClick={() => handlePoliceContact('report')} className="mt-3 w-full bg-red-600 text-white py-2 rounded font-bold uppercase hover:bg-red-700">File Police Report</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
                                <h3 className="text-lg font-black text-blue-950 mb-4 uppercase">AI Analysis</h3>
                                {selectedIncident.aiAnalysis ? (
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold border border-slate-200">Severity: <span className="text-red-600">{selectedIncident.aiAnalysis.severityLabel}</span></span>
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold border border-slate-200">{selectedIncident.aiAnalysis.isDog ? 'Dog' : 'Other Animal'}</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-200">
                                            <strong className="text-blue-950 block mb-1 text-xs uppercase">Action</strong> {selectedIncident.aiAnalysis.suggestedAction}
                                        </div>
                                    </div>
                                ) : <p className="text-slate-400 italic">No analysis.</p>}
                            </div>

                             <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
                                <h3 className="text-lg font-black text-blue-950 mb-4 uppercase">Location</h3>
                                <div className="h-64 w-full rounded relative overflow-hidden z-0 border border-slate-200">
                                     <div ref={mapRef} className="w-full h-full bg-slate-100" />
                                     <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedIncident.location.latitude},${selectedIncident.location.longitude}`, '_blank')} className="absolute bottom-4 right-4 bg-white text-blue-950 border border-blue-950 px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-slate-50 flex items-center gap-2 z-[400] uppercase"><Navigation className="w-3 h-3" /> Open Maps</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col h-[600px] bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-black text-blue-950 flex items-center gap-2 uppercase"><MessageSquare className="w-4 h-4 text-amber-500" /> Comms</h3></div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {selectedIncident.messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'RESCUER' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded text-sm ${msg.sender === 'RESCUER' ? 'bg-blue-950 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                                            {msg.image && <img src={msg.image} className="w-full h-auto rounded mb-2" />}
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-white">
                                {attachment && <div className="relative mb-3 w-fit"><img src={attachment} className="h-20 w-auto rounded border shadow-sm" /><button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-white text-slate-500 rounded-full p-1 shadow hover:text-red-500"><Trash2 className="w-3 h-3" /></button></div>}
                                <div className="flex gap-2 items-center">
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleMediaUpload} />
                                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-950 bg-slate-50 rounded transition-colors"><Camera className="w-5 h-5" /></button>
                                    <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type message..." className="flex-1 border border-slate-300 rounded px-4 py-2 text-sm focus:outline-none focus:border-blue-950" onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                                    <button onClick={handleSendMessage} disabled={!replyText.trim() && !attachment} className="bg-blue-950 text-white p-2 rounded hover:bg-blue-900 transition-colors disabled:opacity-50"><Send className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        ) : <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><Shield className="w-12 h-12 text-slate-200 mb-2" /><p className="uppercase font-bold text-xs tracking-wide">Select incident</p></div>}
      </div>
    </div>
  );
};