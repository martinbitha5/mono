// ─── Shared domain types for ATS Handling RDC ───────────────────────────────

// ── Auth & Users ──────────────────────────────────────────────────────────────
export type Role = 'admin' | 'supervisor' | 'it_agent' | 'tech_agent';
export type UserStatus = 'active' | 'inactive';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  photo_url: string | null;
  role: Role;
  site: string;
  fonction: string;
  start_date: string;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

// ── Attendance ────────────────────────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface Attendance {
  id: string;
  user_id: string;
  site: string;
  check_in_time: string;
  status: AttendanceStatus;
  notes: string | null;
  created_at: string;
  profiles?: Profile;
}

// ── Installations ─────────────────────────────────────────────────────────────
export type InstallationStatus = 'validated' | 'not_validated' | 'issue_detected';

export interface Installation {
  id: string;
  user_id: string;
  site: string;
  airline: string;
  network_ok: boolean;
  machines_ok: boolean;
  software_ok: boolean;
  status: InstallationStatus;
  comment: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

// ── Incidents ─────────────────────────────────────────────────────────────────
export type IncidentPriority = 'low' | 'medium' | 'critical';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description: string;
  site: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  reported_by: string;
  assigned_to: string | null;
  photo_url: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
  assignee?: Profile;
}

// ── Schedule ──────────────────────────────────────────────────────────────────
export type ShiftType = 'day' | 'night';

export interface Schedule {
  id: string;
  user_id: string;
  site: string;
  start_time: string;
  end_time: string;
  shift_type: ShiftType;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

// ── Equipment (IT) ────────────────────────────────────────────────────────────
export type EquipmentType = 'communication' | 'IT' | 'network' | 'other';
export type EquipmentStatus = 'functional' | 'faulty' | 'out_of_service';
export type EquipmentAvailability = 'available' | 'assigned';
export type EquipmentLogAction = 'assigned' | 'returned' | 'faulty' | 'repaired' | 'created';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  serial_number: string | null;
  site: string;
  status: EquipmentStatus;
  availability: EquipmentAvailability;
  assigned_to: string | null;
  notes: string | null;
  marque: string | null;
  designation: string | null;
  description: string | null;
  adresse_mac: string | null;
  affectation: string | null;
  proprietaire: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

export interface EquipmentLog {
  id: string;
  equipment_id: string;
  user_id: string | null;
  action: EquipmentLogAction;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  equipment?: Equipment;
  user?: Profile;
  performer?: Profile;
}

// ── GSE Equipment (Technical) ─────────────────────────────────────────────────
export type GseCategory = 'vehicule' | 'engin' | 'outillage' | 'autre';
export type GseStatus = 'operational' | 'en_panne' | 'maintenance' | 'hors_service';

export interface GseEquipment {
  id: string;
  name: string;
  category: GseCategory;
  registration: string | null;
  serial_number: string | null;
  site: string;
  status: GseStatus;
  assigned_to: string | null;
  last_maintenance_at: string | null;
  next_maintenance_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

// ── Forum ─────────────────────────────────────────────────────────────────────
export type ForumCategory = 'general' | 'technical' | 'help' | 'announcement' | 'off_topic';

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category: ForumCategory;
  is_pinned: boolean;
  is_locked: boolean;
  views_count: number;
  replies_count: number;
  last_reply_at: string | null;
  last_reply_by: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  last_replier?: Profile;
}

export interface ForumReply {
  id: string;
  topic_id: string;
  author_id: string;
  content: string;
  parent_reply_id: string | null;
  is_solution: boolean;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

// ── Reference data ────────────────────────────────────────────────────────────
export const SITES = [
  'Kinshasa',
  'Lubumbashi',
  'Goma',
  'Bukavu',
  'Kisangani',
  'Mbuji-Mayi',
  'Kananga',
  'Kolwezi',
] as const;

export type Site = (typeof SITES)[number];

export const AIRLINES = [
  'Air Congo',
  'Ethiopian Airlines',
  'Kenya Airways',
  'South African Airways',
  'Air France',
  'KLM',
  'Turkish Airlines',
  'RwandAir',
  'Uganda Airlines',
  'Air Côte d\'Ivoire',
  'Brussels Airlines',
  'Royal Air Maroc',
  'EgyptAir',
  'Qatar Airways',
  'Emirates',
  'Autre',
] as const;

export type Airline = (typeof AIRLINES)[number];

export const FORUM_CATEGORIES = [
  { value: 'general', label: 'Général', color: 'bg-blue-100 text-blue-700' },
  { value: 'technical', label: 'Technique', color: 'bg-purple-100 text-purple-700' },
  { value: 'help', label: 'Aide', color: 'bg-green-100 text-green-700' },
  { value: 'announcement', label: 'Annonce', color: 'bg-amber-100 text-amber-700' },
  { value: 'off_topic', label: 'Hors-sujet', color: 'bg-gray-100 text-gray-700' },
] as const;
