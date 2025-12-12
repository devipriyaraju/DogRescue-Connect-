import React, { createContext, useContext, useState, useEffect } from 'react';
import { Incident, UserRole, IncidentStatus, Message } from '../types';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  incidents: Incident[];
  addIncident: (incident: Incident) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus) => void;
  addMessage: (incidentId: string, message: Message) => void;
  currentLocation: { latitude: number; longitude: number } | null;
  refreshLocation: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const refreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location", error);
        }
      );
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  const addIncident = (incident: Incident) => {
    setIncidents((prev) => [incident, ...prev]);
  };

  const updateIncidentStatus = (id: string, status: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status } : inc))
    );
  };

  const addMessage = (incidentId: string, message: Message) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === incidentId
          ? { ...inc, messages: [...inc.messages, message] }
          : inc
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        incidents,
        addIncident,
        updateIncidentStatus,
        addMessage,
        currentLocation,
        refreshLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
