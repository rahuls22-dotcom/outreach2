// Outreach mock data, voice agent CSV calling campaigns

export type OutreachStatus = "in_progress" | "completed" | "paused" | "scheduled";
export type ContactOutcome =
  | "qualified"
  | "not_qualified"
  | "callback"
  | "no_answer"
  | "not_called"
  | "busy"
  | "wrong_number";

export interface OutreachListItem {
  id: string;
  name: string;
  voiceAgent: string;
  totalContacts: number;
  called: number;
  connected: number;
  qualified: number;
  notQualified: number;
  callback: number;
  noAnswer: number;
  status: OutreachStatus;
  progress: number;
  createdAt: string;
}

export const outreachList: OutreachListItem[] = [
  {
    id: "out-1",
    name: "Godrej Reflections, Lead Qualification",
    voiceAgent: "Priya (Qualification Agent)",
    totalContacts: 487,
    called: 342,
    connected: 268,
    qualified: 89,
    notQualified: 142,
    callback: 37,
    noAnswer: 74,
    status: "in_progress",
    progress: 70.2,
    createdAt: "2026-03-18",
  },
  {
    id: "out-2",
    name: "Godrej Eternity, Re-engagement",
    voiceAgent: "Arjun (Follow-up Agent)",
    totalContacts: 215,
    called: 215,
    connected: 178,
    qualified: 52,
    notQualified: 98,
    callback: 28,
    noAnswer: 37,
    status: "completed",
    progress: 100,
    createdAt: "2026-03-10",
  },
  {
    id: "out-3",
    name: "Godrej Air, Site Visit Follow-up",
    voiceAgent: "Priya (Qualification Agent)",
    totalContacts: 64,
    called: 0,
    connected: 0,
    qualified: 0,
    notQualified: 0,
    callback: 0,
    noAnswer: 0,
    status: "scheduled",
    progress: 0,
    createdAt: "2026-03-22",
  },
];

export const voiceAgents = [
  { id: "va-1", name: "Priya (Qualification Agent)" },
  { id: "va-2", name: "Arjun (Follow-up Agent)" },
  { id: "va-3", name: "Neha (Survey Agent)" },
];

export const outreachPurposes = [
  "Lead Qualification",
  "Follow-up",
  "Survey",
  "Re-engagement",
];

// Detail page data for "out-1"
export const outreachDetail = {
  id: "out-1",
  name: "Godrej Reflections, Lead Qualification",
  voiceAgent: "Priya (Qualification Agent)",
  purpose: "Lead Qualification",
  status: "in_progress" as OutreachStatus,
  totalContacts: 487,
  called: 342,
  connected: 268,
  qualified: 89,
  notQualified: 142,
  callback: 37,
  noAnswer: 74,
  busy: 12,
  wrongNumber: 8,
  remaining: 145,
  avgDuration: 2.8,
  createdAt: "2026-03-18",
  schedule: {
    dailyLimit: 200,
    callingHours: "10:00 AM – 7:00 PM",
    days: "Mon–Sat",
    retryEnabled: true,
    maxRetries: 2,
    retryInterval: "4 hours",
  },
};

export const disqualReasons = [
  { reason: "Budget below ₹1Cr", percentage: 38 },
  { reason: "Timeline > 12 months", percentage: 26 },
  { reason: "Not decision maker", percentage: 18 },
  { reason: "Already purchased", percentage: 11 },
  { reason: "Not interested", percentage: 7 },
];

export interface OutreachContact {
  id: string;
  name: string;
  phone: string;
  outcome: ContactOutcome;
  duration: number | null;
  qualification: "qualified" | "not_qualified" | null;
  verified: boolean;
  keyNotes: string;
  calledAt: string | null;
}

export const outreachContacts: OutreachContact[] = [
  {
    id: "oc-1",
    name: "Ramesh K*****",
    phone: "98XXX XX123",
    outcome: "qualified",
    duration: 4.2,
    qualification: "qualified",
    verified: true,
    keyNotes: "Budget ₹1.8Cr, wants 3BHK, can visit this weekend",
    calledAt: "2026-03-21T14:32:00",
  },
  {
    id: "oc-2",
    name: "Sunita P*****",
    phone: "90XXX XX456",
    outcome: "qualified",
    duration: 3.5,
    qualification: "qualified",
    verified: true,
    keyNotes: "NRI investor, budget ₹2Cr+, interested in rental yield",
    calledAt: "2026-03-21T14:18:00",
  },
  {
    id: "oc-3",
    name: "Vikram S*****",
    phone: "87XXX XX789",
    outcome: "not_qualified",
    duration: 2.1,
    qualification: "not_qualified",
    verified: false,
    keyNotes: "Budget below ₹80L, looking for 1BHK",
    calledAt: "2026-03-21T13:55:00",
  },
  {
    id: "oc-4",
    name: "Ananya R*****",
    phone: "91XXX XX234",
    outcome: "callback",
    duration: 0.8,
    qualification: null,
    verified: false,
    keyNotes: "Asked to call back after 5 PM",
    calledAt: "2026-03-21T13:40:00",
  },
  {
    id: "oc-5",
    name: "Deepak M*****",
    phone: "80XXX XX567",
    outcome: "no_answer",
    duration: null,
    qualification: null,
    verified: false,
    keyNotes: "",
    calledAt: "2026-03-21T13:22:00",
  },
  {
    id: "oc-6",
    name: "Kavitha L*****",
    phone: "99XXX XX890",
    outcome: "qualified",
    duration: 5.1,
    qualification: "qualified",
    verified: true,
    keyNotes: "Family of 4, upgrading from 2BHK, timeline 3 months",
    calledAt: "2026-03-21T12:50:00",
  },
  {
    id: "oc-7",
    name: "Prashant G*****",
    phone: "96XXX XX345",
    outcome: "not_qualified",
    duration: 1.8,
    qualification: "not_qualified",
    verified: false,
    keyNotes: "Timeline > 2 years, just browsing",
    calledAt: "2026-03-21T12:35:00",
  },
  {
    id: "oc-8",
    name: "Meera T*****",
    phone: "88XXX XX678",
    outcome: "not_qualified",
    duration: 2.4,
    qualification: "not_qualified",
    verified: false,
    keyNotes: "Not decision maker, will check with spouse",
    calledAt: "2026-03-21T12:10:00",
  },
  {
    id: "oc-9",
    name: "Arun V*****",
    phone: "70XXX XX901",
    outcome: "wrong_number",
    duration: 0.3,
    qualification: null,
    verified: false,
    keyNotes: "Wrong number",
    calledAt: "2026-03-21T11:55:00",
  },
  {
    id: "oc-10",
    name: "Lakshmi N*****",
    phone: "85XXX XX012",
    outcome: "not_called",
    duration: null,
    qualification: null,
    verified: false,
    keyNotes: "",
    calledAt: null,
  },
];

// CSV preview mock
export const csvPreviewHeaders = ["Name", "Phone", "Email", "Source", "Budget"];
export const csvPreviewRows = [
  ["Ramesh Kumar", "9876543210", "ramesh@gmail.com", "Meta Lead", "₹1.5Cr"],
  ["Sunita Patel", "9012345678", "sunita@yahoo.com", "Website", "₹2Cr"],
  ["Vikram Singh", "8765432109", "vikram@outlook.com", "Meta Lead", "₹80L"],
  ["Ananya Rao", "9123456780", "ananya@gmail.com", "Referral", "₹1.8Cr"],
  ["Deepak Menon", "8012345679", "deepak@gmail.com", "Meta Lead", "₹1.2Cr"],
];
