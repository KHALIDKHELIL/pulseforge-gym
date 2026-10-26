export type UserRole = 'admin' | 'reception' | 'trainer' | 'member';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Trainer {
  id: string;
  full_name: string;
  specialty: string;
  phone: string;
  email: string;
  bio: string;
  experience_years: number;
  rating: number;
  active_clients_count: number;
  status: string;
}

export interface Member {
  id: string;
  user_id?: string | null;
  member_code: string;
  full_name: string;
  email: string;
  phone: string;
  plan_tier: 'Basic' | 'Pro' | 'VIP';
  status: 'Active' | 'Expiring Soon' | 'Expired';
  join_date: string;
  expiry_date: string;
  fitness_goal: string;
  assigned_trainer_id?: string | null;
  streak_days: number;
}

export interface ExerciseItem {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  completed?: boolean;
}

export interface WorkoutPlan {
  id: string;
  member_id: string;
  trainer_id: string | null;
  title: string;
  goal_focus: string;
  exercises: ExerciseItem[];
  created_at: string;
}

export interface GymClass {
  id: string;
  title: string;
  category: string;
  trainer_id: string | null;
  schedule_day: string;
  schedule_time: string;
  duration_min: number;
  room: string;
  capacity: number;
  enrolled_count: number;
}

export interface ClassBooking {
  id: string;
  class_id: string;
  member_id: string;
  booking_status: string;
  created_at: string;
}

export interface AttendanceLog {
  id: string;
  member_id: string;
  check_in_time: string;
  check_in_method: string;
  verified_by: string;
  members?: {
    full_name: string;
    member_code: string;
    plan_tier: string;
  };
}

export interface Payment {
  id: string;
  member_id: string | null;
  invoice_no: string;
  amount: number;
  plan_tier: string;
  payment_method: 'Telebirr' | 'CBE Birr' | 'Card' | 'Cash';
  payment_status: string;
  payment_date: string;
}

export interface MemberProgress {
  id: string;
  member_id: string;
  recorded_date: string;
  weight_kg: number;
  body_fat_pct: number;
  bench_press_kg: number;
  squat_kg: number;
  notes?: string;
}

export interface Equipment {
  id: string;
  name: string;
  zone: string;
  serial_code: string;
  health_score: number;
  status: 'Operational' | 'Maintenance Due' | 'Out of Order';
  last_serviced: string;
  next_service_due?: string;
  notes: string;
}

export interface AppNotification {
  id: string;
  target_role: string;
  title: string;
  message: string;
  type: 'expiry' | 'booking' | 'maintenance' | 'payment';
  is_read: boolean;
  created_at: string;
}