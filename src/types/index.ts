export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  plan_type: 'free' | 'silver' | 'gold';
  plan_start_date?: string;
  plan_end_date?: string;
  plan_status: 'active' | 'inactive' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  duration_days: number;
  photo_limit: number;
  direct_contact: boolean;
  featured: boolean;
  active: boolean;
  created_at: string;
}

export interface Ad {
  id: string;
  user_id: string;
  category_id: string;
  type: 'grid' | 'header' | 'footer';
  ad_type?: 'sale' | 'rent';
  title: string;
  description: string;
  price: number;
  photos: string[];
  location: string;
  contact_info: Record<string, any>;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'pending' | 'expired' | 'rejected';
  views: number;
  exposures: number;
  max_exposures: number;
  admin_approved: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  category?: Category;
  plan?: Plan;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  ad_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
  ad?: Ad;
}

export interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  ad_id?: string;
  amount: number;
  payment_method: string;
  asaas_payment_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  payment_date?: string;
  created_at: string;
}

export interface Request {
  id: string;
  user_id: string;
  ad_type: string;
  duration_days: number;
  materials: string;
  observations: string;
  proposed_value: number;
  admin_response?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Favorite {
  id: string;
  user_id: string;
  ad_id: string;
  created_at: string;
  ad?: Ad;
}

export interface FooterAdContract {
  exposures: number;
  price: number;
}

export const FOOTER_AD_CONTRACTS: FooterAdContract[] = [
  { exposures: 720, price: 129.00 },
  { exposures: 1440, price: 249.00 },
  { exposures: 2160, price: 359.00 },
  { exposures: 2880, price: 469.00 }
];