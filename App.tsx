import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleSelector } from './components/RoleSelector';
import { ReporterView } from './components/ReporterView';
import { RescuerView } from './components/RescuerView';
import { UserRole } from './types';
import { ArrowLeft } from 'lucide-react';

const AppContent: React.FC = () => {
  const { role, setRole } = useApp();

  if (role === UserRole.NONE) {
    return <RoleSelector />;
  }

  return (
    <div className="relative">
      {/* Global Back Button for Demo Purposes to switch roles easily */}
      <div className="fixed bottom-4 left-4 z-50">
        <button 
          onClick={() => setRole(UserRole.NONE)}
          className="bg-blue-950/90 backdrop-blur-sm shadow-lg text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-blue-800 text-amber-500 hover:bg-blue-900 flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-3 h-3" /> Switch Role
        </button>
      </div>

      {role === UserRole.REPORTER && <ReporterView />}
      {role === UserRole.RESCUER && <RescuerView />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}