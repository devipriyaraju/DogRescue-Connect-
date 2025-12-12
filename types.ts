export enum UserRole {
  REPORTER = 'REPORTER',
  RESCUER = 'RESCUER',
  NONE = 'NONE'
}

export enum IncidentStatus {
  REPORTED = 'REPORTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED'
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Message {
  id: string;
  sender: 'REPORTER' | 'RESCUER';
  text: string;
  image?: string;
  video?: string;
  timestamp: number;
}

export interface SuspectDetails {
  name: string;
  idNumber: string; // e.g. Adhar
  address: string;
  confidenceScore: number;
}

export interface AbuseAnalysis {
  hasAbuse: boolean;
  humanDetected: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  suspectDetails?: SuspectDetails; // Populated if identity check is run
}

export interface Incident {
  id: string;
  image?: string; // Base64, now optional
  video?: string; // Base64
  location: Coordinates;
  address?: string; // Reverse geocoded mock
  description: string;
  aiAnalysis?: {
    isDog: boolean;
    severityScore: number; // 1-10
    severityLabel: string;
    suggestedAction: string;
    tags: string[];
  };
  abuseAnalysis?: AbuseAnalysis;
  status: IncidentStatus;
  timestamp: number;
  messages: Message[];
}