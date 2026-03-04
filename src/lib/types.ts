export interface Admin {
  id: number;
  email: string;
  password_hash: string;
  email_verified: number;
  verification_token: string | null;
  token_expires_at: string | null;
  created_at: string;
}

export interface Event {
  id: number;
  admin_id: number | null;
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  location: string;
  max_participants: number;
  registration_open: number; // 0 or 1
  starter_time: string; // HH:MM
  main_time: string;
  dessert_time: string;
  created_at: string;
}

export interface Household {
  id: number;
  event_id: number;
  members: string; // JSON: ["Name1", "Name2"]
  address: string;
  email: string;
  phone: string;
  capacity: number;
  dietary: string;
  created_at: string;
}

export interface Assignment {
  id: number;
  event_id: number;
  household_id: number;
  course: 'starter' | 'main' | 'dessert';
  visits_starter: number | null;
  visits_main: number | null;
  visits_dessert: number | null;
  sms_advance_sent: number;
  sms_starter_sent: number;
  sms_main_sent: number;
  sms_dessert_sent: number;
}

export interface AssignmentDraft {
  householdId: number;
  course: 'starter' | 'main' | 'dessert';
  visitsStarter: number | null;
  visitsMain: number | null;
  visitsDessert: number | null;
}

export interface LotteryResult {
  assignments: AssignmentDraft[];
  warnings: string[];
}

export interface HouseholdWithMembers extends Household {
  membersList: string[];
}
