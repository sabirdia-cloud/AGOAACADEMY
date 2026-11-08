export type UserRole = 'admin' | 'coach' | 'parent' | 'staff_storekeeper' | 'staff_doctor' | 'staff_assistant';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  full_name?: string; // e.g. "المدير العام"
  title?: string; // e.g. "رئيس الأكاديمية"
  coach_id?: number; // If role is coach
  category?: string; // COACH: assigned category (e.g. "U13")
  team_id?: number;   // COACH: assigned group/team ID
  parent_id?: number; // If role is parent
  parent_username?: string; // For username-based login
  staff_id?: number; // If role is staff
}

export interface Player {
  player_id: number;
  name: string; // لقب وإسم اللاعب
  birth_date: string; // تاريخ الازدياد
  birth_state: string; // ولاية الميلاد
  birth_city: string; // بلدية الميلاد
  join_date: string; // تاريخ الانضمام
  category: string; // الفئة
  weight?: number; // الوزن
  height?: number; // الطول
  blood_type?: string; // زمرة الدم
  uniform_size?: string; // مقياس البدلة
  photo_url?: string; // صورة اللاعب

  // Parent Info (Merged)
  father_name: string; // إسم الأب
  id_card_number?: string; // رقم بطاقة التعريف
  id_card_issue_date?: string; // تاريخ صدور بطاقة التعريف
  address?: string; // العنوان
  phone?: string; // رقم الهاتف
  status?: string; // الحالة
  level_score?: number; // التقييم
  qr_code?: string; // رمز الاستجابة السريعة
}

export interface Coach {
  coach_id: number;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  username?: string; // Added for login
}

export interface Team {
  team_id: number;
  name: string;
  category: string;
  coach_id: number;
}

export interface Training {
  training_id: number;
  team_id: number;
  coach_id: number;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes?: string;
  team_name?: string;
  coach_name?: string;
}

export interface Notification {
  id: number;
  player_id?: number;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  created_at: string;
}

export interface Message {
  id: number;
  player_id: number;
  message: string;
  is_read: boolean;
  type: string;
  created_at: string;
  sender_name?: string;
}

export interface FormattedNotification {
  id: string;
  original_id: number;
  title: string;
  body: string;
  type: string;
  date: string;
  timestamp: number;
  is_read: boolean;
}

export interface AcademySettings {
  id?: number;
  name: string;
  logo_url: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  public_url: string;
  description: string;
  current_season: string;
  theme: string;
  baridi_rip: string;
  baridi_name: string;
  notify_whatsapp?: boolean;
  admin_notification_phone?: string;
  notify_email?: boolean;
  admin_notification_email?: string;
  emailjs_service_id?: string;
  emailjs_template_id?: string;
  emailjs_public_key?: string;
  print_logo?: boolean;
  print_qr?: boolean;
  print_color?: string;
  print_size?: string;
  language?: string;
  currency?: string;
  date_format?: string;
  notifications_enabled?: boolean;
}
