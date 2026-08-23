export type Language = 'en' | 'ta' | 'hi';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  role?: 'admin' | 'seller' | 'buyer';
  fcmToken?: string | null;
  fcmTokenLastUpdated?: any;
  platform?: string;
  createdAt?: number | any;
  rating?: number;
  reviewsCount?: number;
  isVerified?: boolean;
}

export interface SparePart {
  id?: string;
  title: string;
  carBrand: string;
  carModel: string;
  category: string;
  condition: string;
  price: number;
  location: string;
  contactName?: string;
  contactPhone?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  sellerId: string;
  sellerEmail?: string;
  createdAt: number | any;
  updatedAt?: number | any;
  approved?: boolean;
  verified?: boolean;
  oemNumber?: string;
  compatibleYears?: string;
  latitude?: number;
  longitude?: number;
  views?: number;
  isSold?: boolean;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export interface ChatConversation {
  id: string;
  partId?: string;
  partTitle: string;
  partImageUrl?: string;
  partPrice?: number;
  lastMessageText: string;
  lastMessageAt: number;
  lastSenderId: string;
  participants: string[];
  buyerId?: string;
  buyerName?: string;
  sellerId?: string;
  sellerName?: string;
}

export interface AppBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  actionText: string;
  active: boolean;
}

export interface AppVersionConfig {
  latestVersion: string;
  minimumSupportedVersion: string;
  forceUpdate: boolean;
  releaseNotes?: string;
  apkDownloadUrl?: string;
  playStoreUrl?: string;
  releaseDate?: string;
}

export interface TaxonomyBrand {
  name: string;
  models: string[];
  logo?: string;
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  icon?: string;
  subcategories?: string[];
  color?: string;
}

export interface TaxonomyData {
  brands: TaxonomyBrand[];
  categories: TaxonomyCategory[];
  updatedAt?: number;
}
