import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Shield, ShieldAlert, HeartHandshake, PawPrint } from 'lucide-react';

export const RoleSelector: React.FC = () => {
  const { setRole } = useApp();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-3 bg-blue-950 z-10"></div>
      <div className="absolute top-3 left-0 w-full h-1 bg-amber-500 z-10"></div>
      
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-100 rounded-full opacity-50 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-100 rounded-full opacity-50 blur-3xl"></div>

      <div className="text-center mb-12 max-w-2xl relative z-10 flex flex-col items-center">
        {/* Logo Construction */}
        <div className="relative mb-6">
          {/* Shield Shape */}
          <div className="relative z-10 drop-shadow-xl">
             <Shield className="w-32 h-32 text-red-800 fill-red-800" strokeWidth={1} />
             <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-white">
                <div className="bg-blue-950 p-2 rounded-full mb-1">
                   <PawPrint className="w-8 h-8 text-white" fill="white" />
                </div>
                <span className="font-black text-2xl tracking-tighter leading-none text-white drop-shadow-md">PAL</span>
                <span className="text-[8px] font-bold mt-1 opacity-90">SINCE 2011</span>
             </div>
          </div>
          {/* Gold Ribbon Effect */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 bg-amber-500 text-blue-950 text-[10px] font-black py-1 px-4 rounded-sm shadow-md border-b-2 border-amber-600 text-center uppercase tracking-wide whitespace-nowrap z-20">
             Pure Animal Lovers
          </div>
        </div>
        
        <div className="mt-6 space-y-0">
            <h1 className="text-3xl md:text-4xl font-black text-blue-950 tracking-tight uppercase leading-none">
            Pure Animal Lovers
            </h1>
            <h2 className="text-2xl md:text-3xl font-black text-blue-950 tracking-tight uppercase leading-none">
            PAL Welfare Foundation
            </h2>
        </div>
        
        <div className="w-24 h-1 bg-red-800 mt-6 mb-2 rounded-full"></div>
        <p className="text-slate-600 font-medium tracking-wide text-sm uppercase">
          Protection • Awareness • Love
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl relative z-10">
        <button
          onClick={() => setRole(UserRole.REPORTER)}
          className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 border-red-800 group relative overflow-hidden"
        >
          <div className="bg-red-50 p-5 rounded-full mb-5 group-hover:bg-red-100 transition-colors border border-red-100">
            <ShieldAlert className="w-10 h-10 text-red-800" />
          </div>
          <h2 className="text-xl font-black text-blue-950 uppercase">Report Incident</h2>
          <p className="text-sm text-slate-500 text-center mt-2 px-4 mb-4">
            I found an injured dog and need to alert PAL rescuers immediately.
          </p>
          <span className="mt-auto px-6 py-2 bg-red-800 text-white text-xs font-bold uppercase rounded-full group-hover:bg-red-900 transition-colors">
            Start Report
          </span>
        </button>

        <button
          onClick={() => setRole(UserRole.RESCUER)}
          className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 border-blue-950 group relative overflow-hidden"
        >
          <div className="bg-blue-50 p-5 rounded-full mb-5 group-hover:bg-blue-100 transition-colors border border-blue-100">
            <HeartHandshake className="w-10 h-10 text-blue-950" />
          </div>
          <h2 className="text-xl font-black text-blue-950 uppercase">Rescue Partner</h2>
          <p className="text-sm text-slate-500 text-center mt-2 px-4 mb-4">
            Authorized dashboard for PAL Vets and Rescue Volunteers.
          </p>
          <span className="mt-auto px-6 py-2 bg-blue-950 text-white text-xs font-bold uppercase rounded-full group-hover:bg-blue-900 transition-colors">
            Access Dashboard
          </span>
        </button>
      </div>

      <div className="mt-12 flex flex-col items-center gap-2 opacity-80">
         <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
            <img src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" alt="India" className="h-4 rounded-sm shadow-sm border border-slate-200" />
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Serving India Since 2011</span>
         </div>
      </div>
    </div>
  );
};