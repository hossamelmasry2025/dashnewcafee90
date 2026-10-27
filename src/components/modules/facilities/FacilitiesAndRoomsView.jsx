import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DoorOpen,
  Wifi,
  Tv,
  Users,
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  DollarSign,
  Upload,
  Image as ImageIcon,
  Star,
  Eye,
  Calendar,
  Phone,
  User,
  CreditCard,
  Check,
  X,
  FileText,
  Printer,
  Compass,
  Award,
  Maximize2,
  Save,
  Coffee,
  Hash,
  RefreshCw,
  Search,
  Smartphone,
  Hourglass,
  Receipt,
  MessageCircle,
  ExternalLink,
  Copy
} from 'lucide-react';
import { api } from '../../../services/api';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useToast } from '../../../context/ToastContext';
import { useLanguage } from '../../../context/LanguageContext';
import { optimizeImageForMobile } from '../../../utils/imageOptimizer';
import { useAdminRealtime } from '../../../useAdminRealtime';

// Comprehensive dictionary for Facilities bilingual support
const FACILITY_TRANSLATIONS = {
  'fac-1': {
    nameAr: 'إنترنت فايبر فائق السرعة Wi-Fi 6',
    nameEn: 'High-Speed Fiber Wi-Fi 6',
    categoryAr: 'اتصال وشبكات',
    categoryEn: 'Connectivity',
    descAr: 'اتصال أعمال فايبر مخصص بسرعة 1 جيجابت يغطي كامل المساحات الداخلية والحديقة الخارجية.',
    descEn: '1 Gbps redundant enterprise connection throughout all indoor & outdoor zones.'
  },
  'fac-2': {
    nameAr: 'مقابس كهرباء وشحن سريع بكل طاولة',
    nameEn: 'Power Outlets at Every Seat',
    categoryAr: 'راحة ومرافق',
    categoryEn: 'Convenience',
    descAr: 'أفياش 220V عالمية ومنافذ شحن فائق السرعة USB-C 65W متوفرة عند كل مقعد وطاولة.',
    descEn: 'Universal 220V plugs and 65W USB-C fast charging stations at all tables.'
  },
  'fac-3': {
    nameAr: 'خدمة صف السيارات (فاليه VIP)',
    nameEn: 'Valet Parking Service',
    categoryAr: 'خدمة الضيوف',
    categoryEn: 'Guest Experience',
    descAr: 'خدمة ركن وصف سيارات VIP مجانية لرواد وضيوف كافيه 90.',
    descEn: 'Complimentary VIP valet parking for Cafe 90 patrons.'
  },
  'fac-4': {
    nameAr: 'حديقة خارجية بتدفئة شتوية ورذاذ صيفي',
    nameEn: 'Outdoor Heated / Misted Garden',
    categoryAr: 'الأجواء',
    categoryEn: 'Ambience',
    descAr: 'تراس خارجي فاخر مجهز بدفايات شتوية ورذاذ تبريد منعش في الصيف.',
    descEn: 'Landscaped terrace with winter heaters and summer cooling mist.'
  },
  'fac-5': {
    nameAr: 'بار القهوة المقطرة والمختصة لايف',
    nameEn: 'Specialty Manual Brew Bar',
    categoryAr: 'صناعة القهوة',
    categoryEn: 'Coffee Craft',
    descAr: 'محطة تحضير يدوي مباشرة لطرق V60 و Chemex و Siphon و Aeropress أمام الضيوف.',
    descEn: 'Live siphon, V60, Chemex, and Aeropress brewing demonstrations.'
  },
  'fac-6': {
    nameAr: 'منطقة ترحيبية بالحيوانات الأليفة',
    nameEn: 'Pet Friendly Patio',
    categoryAr: 'خدمة الضيوف',
    categoryEn: 'Guest Experience',
    descAr: 'مساحة خارجية مخصصة ومجهزة بأوعية مياه نظيفة للحيوانات الأليفة.',
    descEn: 'Designated outdoor garden area equipped with water bowls for pets.'
  },
  'fac-7': {
    nameAr: 'مسارات مهيأة للكراسي المتحركة وعربات الأطفال',
    nameEn: 'Wheelchair & Stroller Accessible',
    categoryAr: 'سهولة الوصول',
    categoryEn: 'Accessibility',
    descAr: 'مداخل مستوية ومنحدرات مجهزة بالكامل وفق أعلى معايير سهولة الوصول.',
    descEn: 'Ramps and step-free entrance compliant with accessibility standards.'
  }
};

const AMENITY_MAP = {
  '75-inch 4K Screen': { ar: 'شاشة 75 بوصة 4K ذكية', en: '75-inch 4K Screen' },
  '55-inch Screen': { ar: 'شاشة 55 بوصة ذكية', en: '55-inch Smart Screen' },
  'Acoustic Soundproofing': { ar: 'عزل صوتي تام', en: 'Acoustic Soundproofing' },
  'Polycom Conference Call': { ar: 'نظام مؤتمرات وصوتيات Polycom', en: 'Polycom Conference Call' },
  'Dedicated Barista Butler': { ar: 'ضيافة باريستا خاصة', en: 'Dedicated Barista Butler' },
  'Fiber Wi-Fi 6 (1 Gbps)': { ar: 'إنترنت فايبر فائق السرعة Wi-Fi 6', en: 'Fiber Wi-Fi 6 (1 Gbps)' },
  'Fast Fiber Internet': { ar: 'إنترنت سريع', en: 'Fast Internet' },
  'Whiteboard & Marker Sets': { ar: 'سبورة بيضاء ومجموعة أقلام', en: 'Whiteboard & Marker Sets' },
  'Unlimited Filtered Espresso': { ar: 'إسبريسو ومشروبات غير محدودة', en: 'Unlimited Filtered Espresso' },
  'Smart Whiteboard': { ar: 'سبورة ذكية تفاعلية', en: 'Smart Whiteboard' },
  'Power Outlets with Fast USB-C PD': { ar: 'مقابس كهرباء وشحن سريع USB-C', en: 'Power Outlets with Fast USB-C PD' },
  'Sound Dampening Glass': { ar: 'زجاج عازل للصوت', en: 'Sound Dampening Glass' },
  'Specialty Drip Station': { ar: 'محطة قهوة مقطرة مختصة', en: 'Specialty Drip Station' },
  'Shure Podcast Microphones': { ar: 'ميكروفونات Shure احترافية للبودكاست', en: 'Shure Podcast Microphones' },
  'Warm Studio Lighting': { ar: 'إضاءة استوديو دافئة', en: 'Warm Studio Lighting' },
  'Bespoke Leather Seating': { ar: 'جلسات جلدية فاخرة ومريحة', en: 'Bespoke Leather Seating' },
  'High-speed Ethernet': { ar: 'اتصال إيثرنت فائق السرعة', en: 'High-speed Ethernet' },
  'Artisan Coffee Barista Cart': { ar: 'عربة باريستا قهوة مختصة', en: 'Artisan Coffee Barista Cart' },
  'Ergonomic Herman Miller Chairs': { ar: 'كراسي طبية ومريحة', en: 'Ergonomic Chairs' },
  'Noise-Cancelling Acoustic Panels': { ar: 'ألواح عزل وتشتيت الضوضاء', en: 'Noise-Cancelling Panels' },
  'Direct Power Hubs': { ar: 'منافذ طاقة وشحن مباشرة', en: 'Direct Power Hubs' },
  'Complimentary Water Station': { ar: 'محطة مياه ضيافة مجانية', en: 'Complimentary Water Station' },
  'Sound System': { ar: 'نظام صوتي', en: 'Sound System' },
  'Projector': { ar: 'جهاز عرض', en: 'Projector' },
  'Projector / 4K Screen': { ar: 'جهاز عرض / شاشة 4K', en: 'Projector / 4K Screen' },
  'Comfortable Seating': { ar: 'جلسات مريحة فاخرة', en: 'Comfortable Seating' },
  'Fast Internet': { ar: 'إنترنت سريع', en: 'Fast Internet' },
  'Central AC': { ar: 'تكييف مركزي', en: 'Central AC' },
  'Smart Board': { ar: 'سبورة ذكية', en: 'Smart Board' },
  'Private Barista Butler': { ar: 'ضيافة باريستا خاصة', en: 'Private Barista Butler' },
  'USB-C Fast Charging Hub': { ar: 'محطة شحن سريع USB-C', en: 'USB-C Fast Charging Hub' },
  'Podcast Microphones': { ar: 'ميكروفونات بودكاست احترافية', en: 'Podcast Microphones' },
  'نظام صوتي': { ar: 'نظام صوتي', en: 'Sound System' },
  'جهاز عرض': { ar: 'جهاز عرض', en: 'Projector' },
  'جهاز عرض / شاشة 4K': { ar: 'جهاز عرض / شاشة 4K', en: 'Projector / 4K Screen' },
  'جلسات مريحة فاخرة': { ar: 'جلسات مريحة فاخرة', en: 'Comfortable Seating' },
  'إنترنت سريع': { ar: 'إنترنت سريع', en: 'Fast Internet' },
  'تكييف مركزي': { ar: 'تكييف مركزي', en: 'Central AC' },
  'سبورة ذكية': { ar: 'سبورة ذكية', en: 'Smart Board' },
  'ضيافة باريستا خاصة': { ar: 'ضيافة باريستا خاصة', en: 'Private Barista Butler' },
  'عزل صوتي تام': { ar: 'عزل صوتي تام', en: 'Acoustic Soundproofing' },
  'محطة شحن سريع USB-C': { ar: 'محطة شحن سريع USB-C', en: 'USB-C Fast Charging Hub' },
  'ميكروفونات بودكاست احترافية': { ar: 'ميكروفونات بودكاست احترافية', en: 'Podcast Microphones' },
  'شاشة 4K ذكية': { ar: 'شاشة 4K ذكية', en: '4K Smart Screen' },
  '4K Smart Screen': { ar: 'شاشة 4K ذكية', en: '4K Smart Screen' },
  'ضيافة باريستا': { ar: 'ضيافة باريستا', en: 'Barista Butler' },
  'Barista Butler': { ar: 'ضيافة باريستا', en: 'Barista Butler' },
  'شواحن USB-C': { ar: 'شواحن USB-C', en: 'USB-C Charging' },
  'USB-C Charging': { ar: 'شواحن USB-C', en: 'USB-C Charging' }
};

// Popular FA and Semantic Icons for Room Amenities
const FA_ICONS_LIST = [
  { id: 'speaker', label: 'نظام صوتي / سماعات', faClass: 'fa-solid fa-volume-high' },
  { id: 'projector', label: 'جهاز عرض / بروجكتور', faClass: 'fa-solid fa-tv' },
  { id: 'wifi', label: 'إنترنت سريع / واي فاي', faClass: 'fa-solid fa-wifi' },
  { id: 'tv', label: 'شاشة ذكية 4K', faClass: 'fa-solid fa-display' },
  { id: 'coffee', label: 'باريستا / قهوة وضيافة', faClass: 'fa-solid fa-mug-hot' },
  { id: 'plug', label: 'مقابس وشواحن USB-C', faClass: 'fa-solid fa-plug' },
  { id: 'wind', label: 'تكييف مركزي', faClass: 'fa-solid fa-snowflake' },
  { id: 'couch', label: 'جلسات مريحة فاخرة', faClass: 'fa-solid fa-couch' },
  { id: 'shield', label: 'عزل صوتي تام', faClass: 'fa-solid fa-shield-halved' },
  { id: 'chalkboard', label: 'سبورة ذكية تفاعلية', faClass: 'fa-solid fa-chalkboard' },
  { id: 'microphone', label: 'ميكروفونات بودكاست', faClass: 'fa-solid fa-microphone' },
  { id: 'chair', label: 'كراسي طبية', faClass: 'fa-solid fa-chair' },
  { id: 'lightbulb', label: 'إضاءة دافئة', faClass: 'fa-solid fa-lightbulb' },
  { id: 'water', label: 'مياه ضيافة', faClass: 'fa-solid fa-bottle-water' },
  { id: 'star', label: 'خدمة VIP', faClass: 'fa-solid fa-star' }
];

const PRESET_AMENITIES = [
  { ar: 'شاشة 4K ذكية', en: '4K Smart Screen', icon: 'tv' },
  { ar: 'إنترنت سريع', en: 'Fast Internet', icon: 'wifi' },
  { ar: 'جهاز عرض', en: 'Projector', icon: 'projector' },
  { ar: 'نظام صوتي', en: 'Sound System', icon: 'speaker' },
  { ar: 'تكييف مركزي', en: 'Central AC', icon: 'wind' },
  { ar: 'عزل صوتي تام', en: 'Acoustic Soundproofing', icon: 'shield' },
  { ar: 'ضيافة باريستا', en: 'Barista Butler', icon: 'coffee' },
  { ar: 'شواحن USB-C', en: 'USB-C Charging', icon: 'plug' }
];

const DEFAULT_FACILITIES = [
  {
    id: 'fac-1',
    name_ar: 'إنترنت فايبر فائق السرعة Wi-Fi 6',
    name_en: 'High-Speed Fiber Wi-Fi 6',
    category_ar: 'اتصال وشبكات',
    category_en: 'Connectivity',
    description_ar: 'اتصال أعمال فايبر مخصص بسرعة 1 جيجابت يغطي كامل المساحات الداخلية والحديقة الخارجية.',
    description_en: '1 Gbps redundant enterprise connection throughout all indoor & outdoor zones.',
    is_active: 1
  },
  {
    id: 'fac-2',
    name_ar: 'مقابس كهرباء وشحن سريع بكل طاولة',
    name_en: 'Power Outlets at Every Seat',
    category_ar: 'راحة ومرافق',
    category_en: 'Convenience',
    description_ar: 'أفياش 220V عالمية ومنافذ شحن فائق السرعة USB-C 65W متوفرة عند كل مقعد وطاولة.',
    description_en: 'Universal 220V plugs and 65W USB-C fast charging stations at all tables.',
    is_active: 1
  },
  {
    id: 'fac-3',
    name_ar: 'خدمة صف السيارات (فاليه VIP)',
    name_en: 'Valet Parking Service',
    category_ar: 'خدمة الضيوف',
    category_en: 'Guest Experience',
    description_ar: 'خدمة ركن وصف سيارات VIP مجانية لرواد وضيوف كافيه 90.',
    description_en: 'Complimentary VIP valet parking for Cafe 90 patrons.',
    is_active: 1
  },
  {
    id: 'fac-4',
    name_ar: 'حديقة خارجية بتدفئة شتوية ورذاذ صيفي',
    name_en: 'Outdoor Heated / Misted Garden',
    category_ar: 'الأجواء',
    category_en: 'Ambience',
    description_ar: 'تراس خارجي فاخر مجهز بدفايات شتوية ورذاذ تبريد منعش في الصيف.',
    description_en: 'Landscaped terrace with winter heaters and summer cooling mist.',
    is_active: 1
  },
  {
    id: 'fac-5',
    name_ar: 'بار القهوة المقطرة والمختصة لايف',
    name_en: 'Specialty Manual Brew Bar',
    category_ar: 'صناعة القهوة',
    category_en: 'Coffee Craft',
    description_ar: 'محطة تحضير يدوي مباشرة لطرق V60 و Chemex و Siphon و Aeropress أمام الضيوف.',
    description_en: 'Live siphon, V60, Chemex, and Aeropress brewing demonstrations.',
    is_active: 1
  },
  {
    id: 'fac-6',
    name_ar: 'منطقة ترحيبية بالحيوانات الأليفة',
    name_en: 'Pet Friendly Patio',
    category_ar: 'خدمة الضيوف',
    category_en: 'Guest Experience',
    description_ar: 'مساحة خارجية مخصصة ومجهزة بأوعية مياه نظيفة للحيوانات الأليفة.',
    description_en: 'Designated outdoor garden area equipped with water bowls for pets.',
    is_active: 1
  },
  {
    id: 'fac-7',
    name_ar: 'مسارات مهيأة للكراسي المتحركة وعربات الأطفال',
    name_en: 'Wheelchair & Stroller Accessible',
    category_ar: 'سهولة الوصول',
    category_en: 'Accessibility',
    description_ar: 'مداخل مستوية ومنحدرات مجهزة بالكامل وفق أعلى معايير سهولة الوصول.',
    description_en: 'Ramps and step-free entrance compliant with accessibility standards.',
    is_active: 1
  }
];

// bookingsOnly: cashier mode - shows the bookings schedule only (no room/table/facility editing)
export const FacilitiesAndRoomsView = ({ initialTab = 'rooms', bookingsOnly = false }) => {
  const toast = useToast();
  const { isRtl, language, t } = useLanguage();
  const fileInputRef = useRef(null);
  const virtualTourInputRef = useRef(null);

  // Active Tab: 'rooms' | 'tables' | 'bookings' | 'facilities'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  const [rooms, setRooms] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Table Modals & Form state
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [deletingTable, setDeletingTable] = useState(null);
  const [tableSubmitting, setTableSubmitting] = useState(false);
  const [tableValidationErrors, setTableValidationErrors] = useState({});
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('all'); // 'all', 'couples', 'family', 'group'
  const [tableForm, setTableForm] = useState({
    number: '',
    capacity: '4'
  });

  // Room Modals state
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Facility Modals & Form State
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [deletingFacility, setDeletingFacility] = useState(null);
  const [facilitySubmitting, setFacilitySubmitting] = useState(false);
  const [facilityIconFile, setFacilityIconFile] = useState(null);
  const [facilityForm, setFacilityForm] = useState({
    nameAr: '',
    nameEn: '',
    order: '1',
    iconUrl: ''
  });

  // 360 Virtual Tour Modal State
  const [viewingVirtualTour, setViewingVirtualTour] = useState(null);

  // Booking Details / Verification Modal State
  const [viewingBooking, setViewingBooking] = useState(null);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states for Bookings
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingSearch, setBookingSearch] = useState('');

  // Real-time WebSocket connection state & newly arrived highlight
  const [realtimeState, setRealtimeState] = useState('disconnected');
  const [lastNewBookingId, setLastNewBookingId] = useState(null);

  // Synthesized chime audio for new real-time room bookings
  const playBookingChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.30); // C6
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  }, []);

  // Files
  const [roomImageFile, setRoomImageFile] = useState(null);
  const [virtualTourImageFile, setVirtualTourImageFile] = useState(null);
  const [optimizingRoomImage, setOptimizingRoomImage] = useState(false);

  // Custom Amenity Add Inputs State
  const [newAmenityAr, setNewAmenityAr] = useState('');
  const [newAmenityEn, setNewAmenityEn] = useState('');
  const [selectedNewIcon, setSelectedNewIcon] = useState('speaker');

  // Room Form State
  const [roomForm, setRoomForm] = useState({
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    capacityMin: '10',
    capacityMax: '12',
    hourlyRate: '100',
    pointsReward: '15',
    availableFrom: '09:00',
    availableTo: '23:00',
    amenitiesList: [],
    imageUrl: '',
    virtualTourUrl: ''
  });

  const getAmenityIcon = (text = '', fallback = 'star') => {
    const str = String(text || '').toLowerCase();
    if (str.includes('صوت') || str.includes('sound') || str.includes('speaker') || str.includes('polycom') || str.includes('audio')) return 'speaker';
    if (str.includes('عرض') || str.includes('بروجكتور') || str.includes('projector')) return 'projector';
    if (str.includes('نت') || str.includes('واي فاي') || str.includes('wifi') || str.includes('fiber') || str.includes('فايبر') || str.includes('internet')) return 'wifi';
    if (str.includes('شاشة') || str.includes('screen') || str.includes('tv') || str.includes('display')) return 'tv';
    if (str.includes('باريستا') || str.includes('قهوة') || str.includes('coffee') || str.includes('espresso') || str.includes('barista')) return 'coffee';
    if (str.includes('شحن') || str.includes('مقبس') || str.includes('أفياش') || str.includes('power') || str.includes('plug') || str.includes('usb')) return 'plug';
    if (str.includes('تكييف') || str.includes('ac') || str.includes('air') || str.includes('cooling') || str.includes('تبريد')) return 'wind';
    if (str.includes('عزل') || str.includes('soundproof') || str.includes('acoustic') || str.includes('dampening')) return 'shield';
    if (str.includes('سبورة') || str.includes('board') || str.includes('whiteboard') || str.includes('smart board')) return 'chalkboard';
    if (str.includes('جلسات') || str.includes('كراسي') || str.includes('chair') || str.includes('leather') || str.includes('seating') || str.includes('couch')) return 'couch';
    if (str.includes('مايك') || str.includes('ميكروفون') || str.includes('mic') || str.includes('shure') || str.includes('podcast')) return 'microphone';
    if (str.includes('إضاءة') || str.includes('light') || str.includes('lighting') || str.includes('studio')) return 'lightbulb';
    if (str.includes('ماء') || str.includes('مياه') || str.includes('water')) return 'water';
    return fallback;
  };

  const getFaClass = (iconName = '') => {
    const found = FA_ICONS_LIST.find(i => i.id === iconName);
    if (found) return found.faClass;
    if (iconName.startsWith('fa')) return iconName;
    return 'fa-solid fa-star';
  };

  const translateAmenity = (item, targetLangIsAr) => {
    if (!item) return '';
    if (typeof item === 'object') {
      if (typeof item.text === 'string' && item.text) {
        const str = item.text.trim();
        if (AMENITY_MAP[str]) {
          return targetLangIsAr ? AMENITY_MAP[str].ar : AMENITY_MAP[str].en;
        }
        return str;
      }
      if (targetLangIsAr && typeof item.ar === 'string' && item.ar) return item.ar;
      if (!targetLangIsAr && typeof item.en === 'string' && item.en) return item.en;
      if (typeof item.name === 'string' && item.name) return item.name;
      if (typeof item.name_ar === 'string' && targetLangIsAr && item.name_ar) return item.name_ar;
      if (typeof item.name_en === 'string' && !targetLangIsAr && item.name_en) return item.name_en;
      if (typeof item.title === 'string' && item.title) return item.title;
      return String(item.text || item.ar || item.en || item.name || item.name_ar || item.name_en || '');
    }
    const str = String(item).trim();
    if (AMENITY_MAP[str]) {
      return targetLangIsAr ? AMENITY_MAP[str].ar : AMENITY_MAP[str].en;
    }
    return str;
  };

  const normalizeAmenitiesList = (rawAr, rawEn, rawFallback) => {
    let listAr = [];
    if (Array.isArray(rawAr)) listAr = rawAr;
    else if (typeof rawAr === 'string') {
      try { listAr = JSON.parse(rawAr); } catch { listAr = rawAr.split(',').map(s => s.trim()).filter(Boolean); }
    }

    let listEn = [];
    if (Array.isArray(rawEn)) listEn = rawEn;
    else if (typeof rawEn === 'string') {
      try { listEn = JSON.parse(rawEn); } catch { listEn = rawEn.split(',').map(s => s.trim()).filter(Boolean); }
    }

    let listFb = [];
    if (Array.isArray(rawFallback)) listFb = rawFallback;

    const maxLen = Math.max(listAr.length, listEn.length, listFb.length);
    const result = [];

    for (let i = 0; i < maxLen; i++) {
      const itemAr = listAr[i] || listFb[i] || {};
      const itemEn = listEn[i] || listFb[i] || {};

      const arText = typeof itemAr === 'object' ? (itemAr.text || itemAr.ar || itemAr.name || '') : String(itemAr || '');
      const enText = typeof itemEn === 'object' ? (itemEn.text || itemEn.en || itemEn.name || '') : String(itemEn || '');
      const icon = (typeof itemAr === 'object' && itemAr.icon) || (typeof itemEn === 'object' && itemEn.icon) || getAmenityIcon(arText || enText) || 'star';

      const finalAr = arText || translateAmenity(enText, true) || enText;
      const finalEn = enText || translateAmenity(arText, false) || arText;

      if (finalAr || finalEn) {
        result.push({
          ar: finalAr,
          en: finalEn,
          icon: String(icon).trim()
        });
      }
    }
    return result;
  };

  const normalizeRoom = (r) => {
    if (!r || typeof r !== 'object') return null;

    const rNameAr = typeof r.name_ar === 'string' ? r.name_ar : (typeof r.nameAr === 'string' ? r.nameAr : (typeof r.name === 'object' && r.name?.ar ? r.name.ar : ''));
    const rNameEn = typeof r.name_en === 'string' ? r.name_en : (typeof r.nameEn === 'string' ? r.nameEn : (typeof r.name === 'object' && r.name?.en ? r.name.en : ''));
    const rawNameStr = typeof r.name === 'string' ? r.name : (rNameAr || rNameEn || '');

    const nameAr = rNameAr || 
      (typeof rawNameStr === 'string' && /[\u0600-\u06FF]/.test(rawNameStr) ? rawNameStr : '') || 
      rawNameStr || 
      'غرفة الاجتماعات VIP';

    const nameEn = rNameEn || 
      (typeof rawNameStr === 'string' && !/[\u0600-\u06FF]/.test(rawNameStr) ? rawNameStr : '') || 
      rawNameStr || 
      'VIP Meeting Room';

    const rDescAr = typeof r.description_ar === 'string' ? r.description_ar : (typeof r.descriptionAr === 'string' ? r.descriptionAr : (typeof r.description === 'object' && r.description?.ar ? r.description.ar : ''));
    const rDescEn = typeof r.description_en === 'string' ? r.description_en : (typeof r.descriptionEn === 'string' ? r.descriptionEn : (typeof r.description === 'object' && r.description?.en ? r.description.en : ''));
    const rawDescStr = typeof r.description === 'string' ? r.description : (rDescAr || rDescEn || '');

    const descAr = rDescAr || 
      (typeof rawDescStr === 'string' && /[\u0600-\u06FF]/.test(rawDescStr) ? rawDescStr : '') || 
      rawDescStr || 
      '';

    const descEn = rDescEn || 
      (typeof rawDescStr === 'string' && !/[\u0600-\u06FF]/.test(rawDescStr) ? rawDescStr : '') || 
      rawDescStr || 
      '';

    const amenitiesList = normalizeAmenitiesList(r.amenities_ar || r.amenitiesAr, r.amenities_en || r.amenitiesEn, r.amenities);

    let imageUrl = '';
    if (typeof r.image_url === 'string' && r.image_url.trim()) {
      imageUrl = r.image_url;
    } else if (typeof r.image === 'string' && r.image.trim()) {
      if (r.image.startsWith('http') || r.image.startsWith('data:')) {
        imageUrl = r.image;
      } else {
        const cleanPath = r.image.startsWith('/') ? r.image.slice(1) : r.image;
        imageUrl = `https://backend.ninety90degree.com/public/storage/${cleanPath}`;
      }
    } else if (typeof r.imageUrl === 'string' && r.imageUrl.trim()) {
      imageUrl = r.imageUrl;
    }

    let virtualTourUrl = '';
    if (typeof r.virtual_tour_image_url === 'string' && r.virtual_tour_image_url.trim()) {
      virtualTourUrl = r.virtual_tour_image_url;
    } else if (typeof r.virtual_tour_image === 'string' && r.virtual_tour_image.trim()) {
      if (r.virtual_tour_image.startsWith('http') || r.virtual_tour_image.startsWith('data:')) {
        virtualTourUrl = r.virtual_tour_image;
      } else {
        const cleanPath = r.virtual_tour_image.startsWith('/') ? r.virtual_tour_image.slice(1) : r.virtual_tour_image;
        virtualTourUrl = `https://backend.ninety90degree.com/public/storage/${cleanPath}`;
      }
    } else if (typeof r.virtualTourUrl === 'string' && r.virtualTourUrl.trim()) {
      virtualTourUrl = r.virtualTourUrl;
    }

    return {
      id: r.id,
      name: isRtl ? nameAr : nameEn,
      nameAr,
      nameEn,
      secondaryName: isRtl ? nameEn : nameAr,
      description: isRtl ? (descAr || descEn) : (descEn || descAr),
      descriptionAr: descAr,
      descriptionEn: descEn,
      capacityMin: Number(r.capacity_min || r.capacityMin || 10) || 10,
      capacityMax: Number(r.capacity_max || r.capacityMax || 12) || 12,
      hourlyRate: Number(r.price_per_hour || r.hourlyRate || r.price || 100) || 100,
      pointsReward: Number(r.points_reward || r.pointsReward || 0) || 0,
      availableFrom: r.available_from || r.availableFrom || '09:00',
      availableTo: r.available_to || r.availableTo || '23:00',
      amenitiesList,
      amenities: amenitiesList.map(a => isRtl ? (a.ar || a.en) : (a.en || a.ar)),
      amenitiesAr: amenitiesList.map(a => a.ar),
      amenitiesEn: amenitiesList.map(a => a.en),
      imageUrl,
      virtualTourUrl,
      rating: Number(r.rating || 0) || 0,
      reviewCount: Number(r.review_count || 0) || 0,
      status: String(r.status || 'available').toLowerCase()
    };
  };

  const normalizeFacility = (f) => {
    if (!f || typeof f !== 'object') return null;

    const fNameAr = typeof f.name_ar === 'string' ? f.name_ar : (typeof f.nameAr === 'string' ? f.nameAr : (typeof f.name === 'object' && f.name?.ar ? f.name.ar : ''));
    const fNameEn = typeof f.name_en === 'string' ? f.name_en : (typeof f.nameEn === 'string' ? f.nameEn : (typeof f.name === 'object' && f.name?.en ? f.name.en : ''));
    const rawNameStr = typeof f.name === 'string' ? f.name : (fNameAr || fNameEn || '');

    const nameAr = fNameAr || (typeof rawNameStr === 'string' && /[\u0600-\u06FF]/.test(rawNameStr) ? rawNameStr : '') || rawNameStr || '';
    const nameEn = fNameEn || (typeof rawNameStr === 'string' && !/[\u0600-\u06FF]/.test(rawNameStr) ? rawNameStr : '') || rawNameStr || '';

    let iconUrl = '';
    if (typeof f.icon_url === 'string' && f.icon_url.trim()) {
      iconUrl = f.icon_url;
    } else if (typeof f.icon === 'string' && f.icon.trim()) {
      if (f.icon.startsWith('http')) {
        iconUrl = f.icon;
      } else {
        const clean = f.icon.startsWith('/') ? f.icon.slice(1) : f.icon;
        iconUrl = `https://backend.ninety90degree.com/public/storage/${clean}`;
      }
    }

    return {
      id: f.id,
      name: isRtl ? (nameAr || nameEn) : (nameEn || nameAr),
      nameAr,
      nameEn,
      order: Number(f.order || 1),
      iconUrl,
      createdAt: f.created_at,
      updatedAt: f.updated_at
    };
  };

  const normalizeBooking = (b) => {
    if (!b || typeof b !== 'object') return null;

    let custAr = '';
    if (typeof b.user === 'object' && b.user !== null) {
      if (typeof b.user.name === 'string') custAr = b.user.name;
      else if (typeof b.user.name === 'object' && b.user.name !== null) custAr = b.user.name.ar || b.user.name.en || '';
    }
    if (!custAr && typeof b.customer_name === 'string') custAr = b.customer_name;
    if (!custAr && typeof b.customerName === 'string') custAr = b.customerName;
    if (!custAr) custAr = isRtl ? 'عميل كافيه 90' : 'Cafe 90 Guest';

    let custPhone = '';
    if (typeof b.user === 'object' && b.user !== null) {
      if (typeof b.user.phone === 'string' || typeof b.user.phone === 'number') custPhone = String(b.user.phone);
    }
    if (!custPhone && (typeof b.customer_phone === 'string' || typeof b.customer_phone === 'number')) custPhone = String(b.customer_phone);
    if (!custPhone && (typeof b.customerPhone === 'string' || typeof b.customerPhone === 'number')) custPhone = String(b.customerPhone);
    if (!custPhone) custPhone = '01009090900';

    let roomNameAr = '';
    let roomNameEn = '';
    if (typeof b.room === 'object' && b.room !== null) {
      if (typeof b.room.name_ar === 'string') roomNameAr = b.room.name_ar;
      if (typeof b.room.name_en === 'string') roomNameEn = b.room.name_en;
      if (typeof b.room.name === 'string') {
        if (/[\u0600-\u06FF]/.test(b.room.name)) roomNameAr = roomNameAr || b.room.name;
        else roomNameEn = roomNameEn || b.room.name;
      } else if (typeof b.room.name === 'object' && b.room.name !== null) {
        roomNameAr = roomNameAr || b.room.name.ar || '';
        roomNameEn = roomNameEn || b.room.name.en || '';
      }
    }
    if (!roomNameAr && typeof b.roomName === 'string') roomNameAr = b.roomName;
    if (!roomNameAr && typeof b.room_name === 'string') roomNameAr = b.room_name;
    if (!roomNameAr) roomNameAr = isRtl ? 'غرفة اجتماعات VIP 1' : 'VIP Meeting Room 1';
    if (!roomNameEn) roomNameEn = roomNameAr;

    const chosenRoomName = isRtl ? (roomNameAr || roomNameEn) : (roomNameEn || roomNameAr);

    const pricePerHour = Number(b.price_per_hour || b.hourlyRate || b.hourly_rate || (b.room?.price_per_hour || 100)) || 100;
    const durationHours = Number(b.duration_hours || b.duration || 2) || 2;
    const totalPrice = Number(b.total_price || b.totalPrice || (pricePerHour * durationHours)) || (pricePerHour * durationHours);
    const pointsEarned = Number(b.points_earned || b.pointsEarned || 30) || 30;

    let receiptImg = '';
    if (typeof b.receipt_image_url === 'string' && b.receipt_image_url.trim()) receiptImg = b.receipt_image_url;
    else if (typeof b.receiptImage === 'string' && b.receiptImage.trim()) receiptImg = b.receiptImage;
    else if (typeof b.receipt_image === 'string' && b.receipt_image.trim()) {
      if (b.receipt_image.startsWith('http') || b.receipt_image.startsWith('data:')) receiptImg = b.receipt_image;
      else {
        const clean = b.receipt_image.startsWith('/') ? b.receipt_image.slice(1) : b.receipt_image;
        receiptImg = `https://backend.ninety90degree.com/public/storage/${clean}`;
      }
    }

    return {
      id: b.id,
      bookingNumber: b.booking_number || b.bookingNumber || b.id,
      customerName: custAr,
      customerPhone: custPhone,
      roomName: chosenRoomName,
      roomNameAr,
      roomNameEn,
      roomId: b.room_id || b.roomId || 1,
      date: typeof b.date === 'string' ? b.date : (typeof b.booking_date === 'string' ? b.booking_date : (typeof b.bookingDate === 'string' ? b.bookingDate : new Date().toISOString().split('T')[0])),
      timeSlot: typeof b.time_slot === 'string' ? b.time_slot : (typeof b.timeSlot === 'string' ? b.timeSlot : '04:00 PM'),
      startTime: typeof b.start_time === 'string' ? b.start_time : (typeof b.startTime === 'string' ? b.startTime : (typeof b.from_time === 'string' ? b.from_time : (typeof b.from === 'string' ? b.from : ''))),
      endTime: typeof b.end_time === 'string' ? b.end_time : (typeof b.endTime === 'string' ? b.endTime : (typeof b.to_time === 'string' ? b.to_time : (typeof b.to === 'string' ? b.to : ''))),
      capacityMin: Number(b.room?.capacity_min || b.room?.capacityMin || 10),
      capacityMax: Number(b.room?.capacity_max || b.room?.capacityMax || 12),
      durationHours,
      hourlyRate: pricePerHour,
      totalPrice,
      pointsEarned,
      // حجز من غير طريقة دفع = جاي من الآيفون والدفع مقفول، بيتدفع كاش بعد تواصل المطعم
      paymentMethod: String(b.payment_method || b.paymentMethod || 'cash').toLowerCase(),
      status: String(b.status || 'pending').toLowerCase(),
      receiptImageUrl: receiptImg,
      notes: typeof b.notes === 'string' ? b.notes : (typeof b.special_requests === 'string' ? b.special_requests : ''),
      createdAt: typeof b.created_at === 'string' ? b.created_at : new Date().toISOString(),
      rawBooking: b
    };
  };

  // Helper to parse dates & calculate clear "From Time -> To Time" + Duration
  const formatBookingSchedule = (booking, isRtlLang = true) => {
    if (!booking) {
      return {
        dateFormatted: '',
        dateShort: '',
        rawDateStr: '',
        timeRange: '',
        timeRangeLong: '',
        startTimeFormatted: '',
        endTimeFormatted: '',
        startTimeLong: '',
        endTimeLong: '',
        durationFormatted: '',
        durationHours: 1,
        isNextDay: false
      };
    }

    // 1. Safe Date Parsing (Avoids UTC midnight day-shift bugs)
    const rawDateStr = String(booking.date || booking.booking_date || booking.bookingDate || '').split('T')[0].trim();
    let dateFormatted = rawDateStr;
    let dateShort = rawDateStr;

    if (/^\d{4}-\d{2}-\d{2}$/.test(rawDateStr)) {
      const [y, m, d] = rawDateStr.split('-').map(Number);
      const dObj = new Date(y, m - 1, d);
      if (!isNaN(dObj.getTime())) {
        try {
          dateFormatted = dObj.toLocaleDateString(isRtlLang ? 'ar-EG' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          dateShort = dObj.toLocaleDateString(isRtlLang ? 'ar-EG' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch {
          dateFormatted = rawDateStr;
          dateShort = rawDateStr;
        }
      }
    }

    // 2. Duration
    const durationHours = Number(booking.durationHours || booking.duration_hours || booking.duration || 1) || 1;

    // 3. Flexible Time Parsing (Supports 12h AM/PM, inverted "PM 04:00", Arabic ص/م, 24h)
    const parseToMinutes = (str) => {
      if (!str || typeof str !== 'string') return null;
      const clean = str.trim();
      const isPM = /pm|م/i.test(clean);
      const isAM = /am|ص/i.test(clean);
      const match = clean.match(/(\d{1,2})[:.](\d{2})/);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      if (isNaN(h) || isNaN(mins)) return null;

      if (isPM && h < 12) {
        h += 12;
      } else if (isAM && h === 12) {
        h = 0;
      }
      return h * 60 + mins;
    };

    const formatMinutesTo12h = (totalMins) => {
      let m = totalMins % (24 * 60);
      if (m < 0) m += 24 * 60;
      const h24 = Math.floor(m / 60);
      const mins = m % 60;
      const isPM = h24 >= 12;
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      const hPad = String(h12).padStart(2, '0');
      const mPad = String(mins).padStart(2, '0');
      const period = isRtlLang ? (isPM ? 'م' : 'ص') : (isPM ? 'PM' : 'AM');
      const periodLong = isRtlLang ? (isPM ? 'مساءً' : 'صباحاً') : (isPM ? 'PM' : 'AM');
      return {
        timeStr: `${hPad}:${mPad} ${period}`,
        timeStrLong: `${hPad}:${mPad} ${periodLong}`,
        hours24: h24,
        mins
      };
    };

    // Calculate Start Time (fallback to 4:00 PM if none provided)
    let startMins = parseToMinutes(booking.startTime) ?? parseToMinutes(booking.timeSlot);
    if (startMins === null) {
      startMins = 16 * 60;
    }

    // Calculate End Time
    let endMins = parseToMinutes(booking.endTime);
    let isNextDay = false;
    if (endMins === null) {
      endMins = startMins + Math.round(durationHours * 60);
    }
    if (endMins >= 24 * 60) {
      isNextDay = true;
    }

    const startFmt = formatMinutesTo12h(startMins);
    const endFmt = formatMinutesTo12h(endMins);

    // Human Friendly Range
    const timeRange = isRtlLang
      ? `من ${startFmt.timeStr} إلى ${endFmt.timeStr}${isNextDay ? ' (+1 يوم)' : ''}`
      : `From ${startFmt.timeStr} to ${endFmt.timeStr}${isNextDay ? ' (+1 Day)' : ''}`;

    const timeRangeLong = isRtlLang
      ? `من الساعة ${startFmt.timeStrLong} إلى الساعة ${endFmt.timeStrLong}${isNextDay ? ' (اليوم التالي)' : ''}`
      : `From ${startFmt.timeStrLong} to ${endFmt.timeStrLong}${isNextDay ? ' (Next Day)' : ''}`;

    // Duration Label
    let durationFormatted = '';
    if (isRtlLang) {
      if (durationHours === 1) durationFormatted = 'ساعة واحدة (1 ساعة)';
      else if (durationHours === 2) durationFormatted = 'ساعتان (2 ساعة)';
      else if (durationHours >= 3 && durationHours <= 10) durationFormatted = `${durationHours} ساعات`;
      else durationFormatted = `${durationHours} ساعة`;
    } else {
      durationFormatted = durationHours === 1 ? '1 Hour' : `${durationHours} Hours`;
    }

    return {
      dateFormatted,
      dateShort,
      rawDateStr,
      timeRange,
      timeRangeLong,
      startTimeFormatted: startFmt.timeStr,
      endTimeFormatted: endFmt.timeStr,
      startTimeLong: startFmt.timeStrLong,
      endTimeLong: endFmt.timeStrLong,
      durationFormatted,
      durationHours,
      isNextDay
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.getRooms(),
        api.getFacilities(),
        api.getBookings(),
        api.getTables()
      ]);

      // 1. Handle Rooms from Backend
      let loadedRooms = [];
      if (results[0].status === 'fulfilled' && results[0].value) {
        const val = results[0].value;
        const raw = Array.isArray(val)
          ? val
          : (Array.isArray(val?.data)
              ? val.data
              : (Array.isArray(val?.rooms)
                  ? val.rooms
                  : []));
        if (raw.length > 0) {
          loadedRooms = raw.map(normalizeRoom).filter(Boolean);
        }
      }
      setRooms(loadedRooms);

      // 2. Handle Facilities from Backend
      let loadedFacs = [];
      if (results[1].status === 'fulfilled' && results[1].value) {
        const val = results[1].value;
        const raw = Array.isArray(val)
          ? val
          : (Array.isArray(val?.data)
              ? val.data
              : (Array.isArray(val?.facilities)
                  ? val.facilities
                  : []));
        if (raw.length > 0) {
          loadedFacs = raw.map(normalizeFacility).filter(Boolean);
        }
      }
      setFacilities(loadedFacs);

      // 3. Handle Bookings from Backend
      let loadedBookings = [];
      if (results[2].status === 'fulfilled' && results[2].value) {
        const val = results[2].value;
        const raw = Array.isArray(val)
          ? val
          : (Array.isArray(val?.data)
              ? val.data
              : (Array.isArray(val?.bookings)
                  ? val.bookings
                  : []));
        if (raw.length > 0) {
          loadedBookings = raw.map(normalizeBooking).filter(Boolean);
        }
      }
      setBookings(loadedBookings);

      // 4. Handle Tables from Backend
      let loadedTables = [];
      if (results[3].status === 'fulfilled' && results[3].value) {
        const val = results[3].value;
        const raw = Array.isArray(val)
          ? val
          : (Array.isArray(val?.data)
              ? val.data
              : (Array.isArray(val?.tables)
                  ? val.tables
                  : []));
        if (raw.length > 0) {
          loadedTables = raw.map(t => ({
            id: t.id || `tbl-${t.number}`,
            number: Number(t.number) || t.number,
            capacity: Number(t.capacity) || 4,
            status: String(t.status || 'available').toLowerCase(),
            createdAt: t.created_at || t.createdAt || ''
          })).sort((a, b) => Number(a.number) - Number(b.number));
        }
      }
      setTables(loadedTables);

    } catch (e) {
      console.error('Error loading rooms data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isRtl, language]);

  // Lightweight silent refetch for bookings upon real-time events
  const loadBookingsOnly = useCallback(async (silent = true) => {
    try {
      const res = await api.getBookings({ force: true });
      const raw = Array.isArray(res)
        ? res
        : (Array.isArray(res?.data)
            ? res.data
            : (Array.isArray(res?.bookings)
                ? res.bookings
                : []));
      if (raw.length > 0) {
        const loadedBookings = raw.map(normalizeBooking).filter(Boolean);
        setBookings(loadedBookings);
      }
    } catch (e) {
      console.warn('[Facilities] Error reloading bookings:', e);
    }
  }, [isRtl]);

  // Real-time events listener via Pusher & Laravel Echo (Shared Singleton)
  const token = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('admin_token') || localStorage.getItem('token') || '') 
    : '';

  const { reconnect } = useAdminRealtime(
    token,
    (event) => {
      if (!event) return;
      const evType = String(event.type || event.data?.type || '').toLowerCase();

      // 1. Room Booking Events (admin_new_booking, booking_confirmed, booking_rejected, etc.)
      if (evType.includes('booking')) {
        playBookingChime();
        const bookingId = event.data?.booking_id || event.booking_id || event.id;
        if (bookingId) {
          setLastNewBookingId(String(bookingId));
          setTimeout(() => setLastNewBookingId(null), 12000);
        }

        // Silent immediate reload of bookings list
        loadBookingsOnly(true);

        const title = (isRtl ? event?.title?.ar : (event?.title?.en || event?.title?.ar)) || event?.title?.ar || (isRtl ? '📅 وصول حجز غرفة جديد' : 'New Room Booking Alert');
        const body = (isRtl ? event?.body?.ar : (event?.body?.en || event?.body?.ar)) || event?.body?.ar || (isRtl ? 'تم تسجيل حجز قاعة اجتماعات جديد' : 'A new room booking has been recorded');

        toast.info(title, body);
      }

      // 2. Table & Dine-in Events (table updates, rounds, bill requests)
      if (evType.includes('table') || evType.includes('round') || evType === 'admin_bill_requested') {
        loadTables();
      }
    },
    setRealtimeState
  );

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomImageFile(null);
    setVirtualTourImageFile(null);
    setNewAmenityAr('');
    setNewAmenityEn('');
    setSelectedNewIcon('speaker');
    setRoomForm({
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      capacityMin: '10',
      capacityMax: '12',
      hourlyRate: '100',
      pointsReward: '15',
      availableFrom: '09:00',
      availableTo: '23:00',
      amenitiesList: [],
      imageUrl: '',
      virtualTourUrl: ''
    });
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room) => {
    setEditingRoom(room);
    setRoomImageFile(null);
    setVirtualTourImageFile(null);
    setNewAmenityAr('');
    setNewAmenityEn('');
    setSelectedNewIcon('speaker');
    setRoomForm({
      nameEn: room.nameEn || '',
      nameAr: room.nameAr || '',
      descriptionEn: room.descriptionEn || '',
      descriptionAr: room.descriptionAr || '',
      capacityMin: String(room.capacityMin || 10),
      capacityMax: String(room.capacityMax || 12),
      hourlyRate: String(room.hourlyRate || 100),
      pointsReward: String(room.pointsReward || 15),
      availableFrom: room.availableFrom || '09:00',
      availableTo: room.availableTo || '23:00',
      amenitiesList: Array.isArray(room.amenitiesList) ? [...room.amenitiesList] : [],
      imageUrl: room.imageUrl || '',
      virtualTourUrl: room.virtualTourUrl || ''
    });
    setIsRoomModalOpen(true);
  };

  const handleToggleAmenity = (preset) => {
    const exists = roomForm.amenitiesList.some(a => a.ar === preset.ar || a.en === preset.en);
    if (exists) {
      setRoomForm(prev => ({
        ...prev,
        amenitiesList: prev.amenitiesList.filter(a => a.ar !== preset.ar && a.en !== preset.en)
      }));
    } else {
      setRoomForm(prev => ({
        ...prev,
        amenitiesList: [
          ...prev.amenitiesList,
          {
            ar: preset.ar,
            en: preset.en,
            icon: preset.icon || getAmenityIcon(preset.ar) || 'star'
          }
        ]
      }));
    }
  };

  const handleAddCustomAmenity = () => {
    const text = (newAmenityAr || newAmenityEn || '').trim();
    if (!text) {
      toast.warning(isRtl ? 'يرجى كتابة اسم الميزة أولاً' : 'Please enter amenity name first');
      return;
    }
    const finalAr = translateAmenity(text, true) || text;
    const finalEn = translateAmenity(text, false) || text;
    const iconName = getAmenityIcon(text) || 'star';

    if (roomForm.amenitiesList.some(a => a.ar === finalAr || a.en === finalEn || a.ar === text)) {
      toast.info(isRtl ? 'هذه الميزة مضافة بالفعل' : 'This amenity is already added');
      return;
    }

    setRoomForm(prev => ({
      ...prev,
      amenitiesList: [
        ...prev.amenitiesList,
        {
          ar: finalAr,
          en: finalEn,
          icon: iconName
        }
      ]
    }));
    setNewAmenityAr('');
    setNewAmenityEn('');
    toast.success(isRtl ? 'تمت إضافة الميزة بنجاح' : 'Amenity added successfully');
  };

  const handleRemoveAmenity = (indexToRemove) => {
    setRoomForm(prev => ({
      ...prev,
      amenitiesList: prev.amenitiesList.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSaveRoom = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const nameAr = (roomForm.nameAr || '').trim();
    const nameEn = (roomForm.nameEn || '').trim();
    const hourlyRate = parseFloat(roomForm.hourlyRate);
    const capMin = parseInt(roomForm.capacityMin, 10);
    const capMax = parseInt(roomForm.capacityMax, 10);
    const pointsReward = roomForm.pointsReward !== '' ? parseInt(roomForm.pointsReward, 10) : 0;

    // Strict Validation matching Backend Rules (422)
    if (!nameAr) {
      toast.warning(isRtl ? 'يرجى إدخال اسم الغرفة بالعربية (حقل إجباري)' : 'Arabic room name is required');
      return;
    }
    if (!nameEn) {
      toast.warning(isRtl ? 'يرجى إدخال اسم الغرفة بالإنجليزية (حقل إجباري)' : 'English room name is required');
      return;
    }
    if (!hourlyRate || isNaN(hourlyRate) || hourlyRate <= 0) {
      toast.warning(isRtl ? 'يرجى إدخال سعر الساعة بشكل صحيح (ج.م)' : 'Please enter a valid hourly rate');
      return;
    }
    if (isNaN(capMin) || capMin < 1) {
      toast.warning(isRtl ? 'الحد الأدنى للأفراد يجب أن يكون 1 على الأقل' : 'Minimum capacity must be at least 1');
      return;
    }
    if (isNaN(capMax) || capMax < 1) {
      toast.warning(isRtl ? 'الحد الأقصى للأفراد يجب أن يكون 1 على الأقل' : 'Maximum capacity must be at least 1');
      return;
    }
    if (capMin > capMax) {
      toast.warning(isRtl ? 'الحد الأدنى للأفراد لا يمكن أن يكون أكبر من الحد الأقصى' : 'Minimum capacity cannot exceed maximum capacity');
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('name_ar', nameAr);
      fd.append('name_en', nameEn);
      fd.append('price_per_hour', hourlyRate.toString());
      fd.append('capacity_min', capMin.toString());
      fd.append('capacity_max', capMax.toString());
      
      if (!isNaN(pointsReward) && pointsReward >= 0) {
        fd.append('points_reward', pointsReward.toString());
      }

      if (roomForm.availableFrom) {
        fd.append('available_from', roomForm.availableFrom);
      }
      if (roomForm.availableTo) {
        fd.append('available_to', roomForm.availableTo);
      }
      
      if (roomForm.descriptionAr && roomForm.descriptionAr.trim()) {
        fd.append('description_ar', roomForm.descriptionAr.trim());
      }
      if (roomForm.descriptionEn && roomForm.descriptionEn.trim()) {
        fd.append('description_en', roomForm.descriptionEn.trim());
      }
      
      // Send amenities_ar and amenities_en as arrays of objects:
      // amenities_ar[0][text] = "..."
      // amenities_ar[0][icon] = "..."
      // amenities_en[0][text] = "..."
      // amenities_en[0][icon] = "..."
      const amenitiesList = roomForm.amenitiesList || [];
      amenitiesList.forEach((am, idx) => {
        const arText = (am.ar || translateAmenity(am.en, true) || am.en || '').trim();
        const enText = (am.en || translateAmenity(am.ar, false) || am.ar || '').trim();
        const iconName = (am.icon || getAmenityIcon(arText || enText) || 'star').trim();

        if (arText && enText) {
          fd.append(`amenities_ar[${idx}][text]`, arText);
          fd.append(`amenities_ar[${idx}][icon]`, iconName);

          fd.append(`amenities_en[${idx}][text]`, enText);
          fd.append(`amenities_en[${idx}][icon]`, iconName);
        }
      });
      
      // Photo files
      if (roomImageFile instanceof File) {
        fd.append('image', roomImageFile);
      }
      if (virtualTourImageFile instanceof File) {
        fd.append('virtual_tour_image', virtualTourImageFile);
      }

      let resData = null;
      if (editingRoom) {
        resData = await api.updateRoom(editingRoom.id, fd);
        const updatedRoom = normalizeRoom(resData?.room || resData);
        if (updatedRoom) {
          setRooms(prev => prev.map(r => String(r.id) === String(editingRoom.id) ? updatedRoom : r));
        }
        toast.success(resData?.message || (isRtl ? 'تم تحديث الغرفة بنجاح' : 'Room updated successfully'));
      } else {
        resData = await api.createRoom(fd);
        const newRoom = normalizeRoom(resData?.room || resData);
        if (newRoom) {
          setRooms(prev => [newRoom, ...prev.filter(r => String(r.id) !== String(newRoom.id))]);
        }
        toast.success(resData?.message || (isRtl ? 'تم إنشاء الغرفة بنجاح' : 'Room created successfully'));
      }

      setIsRoomModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving room:', err);
      toast.error(err.message || (isRtl ? 'فشل حفظ بيانات الغرفة' : 'Failed to save room details'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoomConfirm = async () => {
    if (!deletingRoom) return;
    try {
      setSubmitting(true);
      const res = await api.deleteRoom(deletingRoom.id);
      if (res?.message && (res.message.includes('غير موجود') || res.message.toLowerCase().includes('not found'))) {
        toast.warning(res.message);
        setRooms(prev => prev.filter(r => String(r.id) !== String(deletingRoom.id)));
        setDeletingRoom(null);
        await loadData();
        return;
      }
      toast.success(res?.message || (isRtl ? 'تم حذف الغرفة بنجاح من التطبيق' : 'Room deleted successfully'));
      setRooms(prev => prev.filter(r => String(r.id) !== String(deletingRoom.id)));
      setDeletingRoom(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting room:', err);
      toast.error(err.message || (isRtl ? 'فشل حذف الغرفة' : 'Failed to delete room'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenBookingDetails = async (b) => {
    setViewingBooking(b);
    try {
      const details = await api.getBookingDetails(b.id);
      if (details) {
        if (details.message && (details.message.includes('غير موجود') || details.message.toLowerCase().includes('not found'))) {
          toast.warning(details.message);
          return;
        }
        const normalized = normalizeBooking(details?.booking || details);
        if (normalized) {
          setViewingBooking(normalized);
          setBookings(prev => prev.map(item => String(item.id) === String(b.id) ? normalized : item));
        }
      }
    } catch (err) {
      console.warn('Booking details fetch notice:', err?.message);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      setActionLoading(true);
      const res = await api.confirmBooking(bookingId);
      toast.success(res?.message || (isRtl ? 'تم تأكيد حجز الغرفة بنجاح' : 'Room booking confirmed'));
      setBookings(prev => prev.map(b => String(b.id) === String(bookingId) ? { ...b, status: 'confirmed' } : b));
      if (viewingBooking && String(viewingBooking.id) === String(bookingId)) {
        setViewingBooking(prev => ({ ...prev, status: 'confirmed' }));
      }
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل تأكيد الحجز' : 'Failed to confirm booking'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBookingConfirm = async () => {
    if (!rejectingBooking) return;
    try {
      setActionLoading(true);
      const res = await api.rejectBooking(rejectingBooking.id, rejectReason);
      toast.success(res?.message || (isRtl ? 'تم رفض الحجز وإخطار العميل' : 'Booking rejected'));
      setBookings(prev => prev.map(b => String(b.id) === String(rejectingBooking.id) ? { ...b, status: 'rejected' } : b));
      if (viewingBooking && String(viewingBooking.id) === String(rejectingBooking.id)) {
        setViewingBooking(prev => ({ ...prev, status: 'rejected' }));
      }
      setRejectingBooking(null);
      setRejectReason('');
      await loadData();
    } catch (err) {
      toast.error(err.message || (isRtl ? 'فشل رفض الحجز' : 'Failed to reject booking'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterBookingsTab = async (tabId) => {
    setBookingStatusFilter(tabId);
    if (tabId === 'pending') {
      try {
        const pendingData = await api.getPendingBookings();
        if (Array.isArray(pendingData) && pendingData.length > 0) {
          const normPending = pendingData.map(normalizeBooking).filter(Boolean);
          setBookings(prev => {
            const pendingIds = new Set(normPending.map(p => String(p.id)));
            const rest = prev.filter(b => !pendingIds.has(String(b.id)));
            return [...normPending, ...rest];
          });
        }
      } catch (e) {
        console.warn('Failed to fetch pending bookings:', e);
      }
    } else if (tabId === 'all') {
      try {
        const allData = await api.getBookings();
        if (Array.isArray(allData) && allData.length > 0) {
          setBookings(allData.map(normalizeBooking).filter(Boolean));
        }
      } catch (e) {}
    }
  };

  const handleOpenAddFacility = () => {
    setEditingFacility(null);
    setFacilityIconFile(null);
    setFacilityForm({
      nameAr: '',
      nameEn: '',
      order: String(facilities.length + 1),
      iconUrl: ''
    });
    setIsFacilityModalOpen(true);
  };

  const handleOpenEditFacility = (fac) => {
    setEditingFacility(fac);
    setFacilityIconFile(null);
    setFacilityForm({
      nameAr: fac.nameAr || '',
      nameEn: fac.nameEn || '',
      order: String(fac.order || 1),
      iconUrl: fac.iconUrl || ''
    });
    setIsFacilityModalOpen(true);
  };

  const handleFacilityIconChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFacilityIconFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFacilityForm(prev => ({ ...prev, iconUrl: event.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFacility = async (e) => {
    e?.preventDefault?.();
    if (!facilityForm.nameAr.trim() && !facilityForm.nameEn.trim()) {
      toast.warning(isRtl ? 'يرجى إدخال اسم الخدمة' : 'Please enter facility name');
      return;
    }

    try {
      setFacilitySubmitting(true);
      const fd = new FormData();
      fd.append('name_ar', facilityForm.nameAr.trim() || facilityForm.nameEn.trim());
      fd.append('name_en', facilityForm.nameEn.trim() || facilityForm.nameAr.trim());
      fd.append('name', facilityForm.nameAr.trim() || facilityForm.nameEn.trim());
      fd.append('order', String(facilityForm.order || 1));

      if (facilityIconFile instanceof File) {
        fd.append('icon', facilityIconFile);
      }

      if (editingFacility) {
        const res = await api.updateFacility(editingFacility.id, fd);
        toast.success(res?.message || (isRtl ? 'تم تحديث الخدمة بنجاح' : 'Facility updated successfully'));
      } else {
        const res = await api.createFacility(fd);
        toast.success(res?.message || (isRtl ? 'تم إنشاء الخدمة بنجاح' : 'Facility created successfully'));
      }

      setIsFacilityModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving facility:', err);
      toast.error(err.message || (isRtl ? 'فشل حفظ الخدمة' : 'Failed to save facility'));
    } finally {
      setFacilitySubmitting(false);
    }
  };

  const handleDeleteFacilityConfirm = async () => {
    if (!deletingFacility) return;
    try {
      setFacilitySubmitting(true);
      const res = await api.deleteFacility(deletingFacility.id);
      if (res?.message && (res.message.includes('غير موجود') || res.message.toLowerCase().includes('not found'))) {
        toast.warning(res.message);
        setFacilities(prev => prev.filter(f => String(f.id) !== String(deletingFacility.id)));
        setDeletingFacility(null);
        await loadData();
        return;
      }
      toast.success(res?.message || (isRtl ? 'تم حذف الخدمة بنجاح' : 'Facility deleted successfully'));
      setFacilities(prev => prev.filter(f => String(f.id) !== String(deletingFacility.id)));
      setDeletingFacility(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting facility:', err);
      toast.error(err.message || (isRtl ? 'فشل حذف الخدمة' : 'Failed to delete facility'));
    } finally {
      setFacilitySubmitting(false);
    }
  };

  // ----------------------------------------------------
  // DINING TABLES HANDLERS (/tables)
  // ----------------------------------------------------
  const loadTables = async () => {
    try {
      setTablesLoading(true);
      const res = await api.getTables();
      const raw = Array.isArray(res)
        ? res
        : (Array.isArray(res?.data)
            ? res.data
            : (Array.isArray(res?.tables)
                ? res.tables
                : []));
      if (raw.length > 0) {
        const mapped = raw.map(t => ({
          id: t.id || `tbl-${t.number}`,
          number: Number(t.number) || t.number,
          capacity: Number(t.capacity) || 4,
          status: String(t.status || 'available').toLowerCase(),
          createdAt: t.created_at || t.createdAt || ''
        })).sort((a, b) => Number(a.number) - Number(b.number));
        setTables(mapped);
      } else {
        setTables([]);
      }
    } catch (e) {
      console.warn('Error loading tables:', e);
    } finally {
      setTablesLoading(false);
    }
  };

  const handleOpenAddTable = () => {
    setEditingTable(null);
    setTableValidationErrors({});
    // Suggest the next available table number based on existing registered numbers
    const existingNumbers = tables.map(t => Number(t.number)).filter(n => !isNaN(n) && n > 0);
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    setTableForm({
      number: String(nextNumber),
      capacity: '4'
    });
    setIsTableModalOpen(true);
  };

  const handleOpenEditTable = (table) => {
    setEditingTable(table);
    setTableValidationErrors({});
    setTableForm({
      number: String(table.number),
      capacity: String(table.capacity || 4)
    });
    setIsTableModalOpen(true);
  };

  const handleSaveTable = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setTableValidationErrors({});

    const tableNumber = parseInt(tableForm.number, 10);
    const capacity = parseInt(tableForm.capacity, 10);

    const clientErrors = {};
    if (isNaN(tableNumber) || tableNumber <= 0) {
      clientErrors.number = isRtl ? 'يرجى إدخال رقم طاولة صحيح (أكبر من 0)' : 'Please enter a valid table number (> 0)';
    }
    if (isNaN(capacity) || capacity <= 0) {
      clientErrors.capacity = isRtl ? 'يرجى تحديد السعة الاستيعابية (شخص واحد على الأقل)' : 'Capacity must be at least 1 person';
    } else if (capacity > 50) {
      clientErrors.capacity = isRtl ? 'الحد الأقصى للسعة هو 50 فرد للطاولة' : 'Maximum capacity is 50 persons';
    }

    if (Object.keys(clientErrors).length > 0) {
      setTableValidationErrors(clientErrors);
      return;
    }

    try {
      setTableSubmitting(true);
      const payload = {
        number: tableNumber,
        capacity: capacity
      };

      if (editingTable) {
        const res = await api.updateTable(editingTable.id, payload);
        toast.success(res?.message || (isRtl ? `تم تحديث الطاولة #${tableNumber} بنجاح` : `Table #${tableNumber} updated successfully`));
      } else {
        const res = await api.createTable(payload);
        toast.success(res?.message || (isRtl ? `تمت إضافة الطاولة #${tableNumber} بنجاح` : `Table #${tableNumber} added successfully`));
      }
      
      setIsTableModalOpen(false);
      setEditingTable(null);
      setTableValidationErrors({});
      await loadTables();
    } catch (err) {
      console.error('Error saving table:', err);
      
      const serverErrors = {};
      const errData = err.data;

      // Handle Laravel 422 Validation Errors
      if (errData && errData.errors && typeof errData.errors === 'object') {
        if (errData.errors.number) {
          const rawNumErr = Array.isArray(errData.errors.number) ? errData.errors.number[0] : String(errData.errors.number);
          if (rawNumErr.toLowerCase().includes('taken') || rawNumErr.toLowerCase().includes('unique') || rawNumErr.toLowerCase().includes('already') || rawNumErr.includes('مستخدم') || rawNumErr.includes('مسجل')) {
            serverErrors.number = isRtl
              ? `رقم الطاولة (${tableNumber}) مسجل مسبقاً في النظام. يرجى اختيار رقم آخر.`
              : `Table number (${tableNumber}) has already been taken. Please choose another number.`;
          } else {
            serverErrors.number = rawNumErr;
          }
        }
        if (errData.errors.capacity) {
          serverErrors.capacity = Array.isArray(errData.errors.capacity) ? errData.errors.capacity[0] : String(errData.errors.capacity);
        }
      }

      // Check general error message if field-specific error was not attached
      const errMsg = err.message || '';
      if (!serverErrors.number && (errMsg.toLowerCase().includes('taken') || errMsg.toLowerCase().includes('unique') || errMsg.toLowerCase().includes('already') || errMsg.includes('مستخدم') || errMsg.includes('مسجل'))) {
        serverErrors.number = isRtl
          ? `رقم الطاولة (${tableNumber}) مسجل مسبقاً في النظام. يرجى اختيار رقم آخر.`
          : `Table number (${tableNumber}) has already been taken. Please choose another number.`;
      }

      setTableValidationErrors(serverErrors);

      const toastMessage = serverErrors.number || serverErrors.capacity || errMsg || (isRtl ? (editingTable ? 'حدث خطأ أثناء تعديل الطاولة' : 'حدث خطأ أثناء إضافة الطاولة') : (editingTable ? 'Failed to update table' : 'Failed to add table'));
      toast.error(toastMessage);
    } finally {
      setTableSubmitting(false);
    }
  };

  const handleDeleteTableConfirm = async () => {
    if (!deletingTable) return;
    try {
      setTableSubmitting(true);
      const res = await api.deleteTable(deletingTable.id);
      toast.success(res?.message || (isRtl ? `تم حذف الطاولة #${deletingTable.number} بنجاح` : `Table #${deletingTable.number} deleted successfully`));
      setTables(prev => prev.filter(t => t.id !== deletingTable.id));
      setDeletingTable(null);
      await loadTables();
    } catch (err) {
      console.error('Error deleting table:', err);
      toast.error(err.message || (isRtl ? 'فشل حذف الطاولة' : 'Failed to delete table'));
    } finally {
      setTableSubmitting(false);
    }
  };

  // Filter Bookings safely
  const filteredBookings = bookings.filter(b => {
    if (!b) return false;
    const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
    const sTerm = (bookingSearch || '').trim().toLowerCase();
    if (!sTerm) return matchesStatus;

    const matchesSearch = 
      String(b.customerName || '').toLowerCase().includes(sTerm) ||
      String(b.customerPhone || '').includes(sTerm) ||
      String(b.bookingNumber || '').toLowerCase().includes(sTerm) ||
      String(b.roomName || '').toLowerCase().includes(sTerm);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-fade-in w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/70 shadow-card w-full">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-chocolate-900">
              {bookingsOnly
                ? t('navBookings', isRtl ? 'حجوزات الغرف' : 'Room Bookings')
                : t('navFacilitiesRooms', isRtl ? 'إدارة المرافق وغرف الاجتماعات VIP' : 'Facilities & VIP Rooms Management')}
            </h2>
            {!bookingsOnly && (
            <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500" />
              {activeTab === 'tables'
                ? `${tables.length} ${isRtl ? 'طاولة مسجلة' : 'Tables'}`
                : `${rooms.length} ${isRtl ? 'غرف مجهزة' : 'VIP Rooms'}`}
            </span>
            )}
          </div>
          <p className="text-[13px] text-stone-500 mt-1 leading-relaxed max-w-2xl">
            {bookingsOnly
              ? (isRtl ? 'متابعة حجوزات الغرف وتأكيدها أو رفضها.' : 'Review room bookings and confirm or reject them.')
              : isRtl
              ? 'إدارة غرف الاجتماعات، طاولات الصالة، تسعير الساعات (ج.م)، نقاط الولاء، الجولات الافتراضية 360°، وسجل الحجوزات اليومية.'
              : 'Manage executive meeting pods, dining tables, hourly rates (EGP), loyalty points reward, 360° virtual tours, and live booking schedule.'}
          </p>
        </div>

        {/* Tab Switcher */}
        {!bookingsOnly && (
        <div className="flex items-center gap-0.5 p-1 bg-stone-200/50 rounded-xl overflow-x-auto custom-scrollbar max-w-full shrink-0 self-start xl:self-auto">
          {[
            { key: 'rooms', Icon: DoorOpen, label: isRtl ? 'غرف وقاعات VIP' : 'VIP Meeting Rooms', count: rooms.length },
            { key: 'tables', Icon: Coffee, label: isRtl ? 'طاولات الصالة' : 'Dining Tables', count: tables.length },
            { key: 'bookings', Icon: Calendar, label: isRtl ? 'سجل الحجوزات' : 'Bookings Schedule', count: bookings.length },
            { key: 'facilities', Icon: Sparkles, label: isRtl ? 'مرافق وخدمات الفرع' : 'General Facilities', count: facilities.length }
          ].map(({ key, Icon, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`h-8 px-3 text-[13px] rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === key
                  ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                  : 'text-stone-500 font-medium hover:text-chocolate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${activeTab === key ? 'text-gold-600' : ''}`} />
              <span>{label}</span>
              <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                activeTab === key ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. ROOMS SECTION */}
      {/* ======================================================== */}
      {activeTab === 'rooms' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div>
              <h3 className="text-[15px] font-bold text-chocolate-900">
                {isRtl ? 'غرف وقاعات الاجتماعات التنفيذية VIP' : 'Executive Boardrooms & VIP Meeting Pods'}
              </h3>
              <p className="text-[13px] text-stone-500 mt-0.5">
                {isRtl ? 'تجهيزات متكاملة، عزل صوتي، جولات 360° تفاعلية، ومزامنة حية مع تطبيق الموبايل.' : 'Fully equipped spaces with soundproofing, 360° tours, and live mobile sync.'}
              </p>
            </div>
            <Button
              variant="gold"
              size="sm"
              icon={Plus}
              onClick={handleOpenAddRoom}
            >
              {isRtl ? 'إضافة غرفة جديدة' : 'Add New Room'}
            </Button>
          </div>

          {loading && rooms.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-80 skeleton rounded-2xl" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200/70 py-12 px-6 text-center flex flex-col items-center justify-center gap-3 shadow-card">
              <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-chocolate-900 mb-1">
                  {isRtl ? 'لا توجد غرف اجتماعات مسجلة في السيرفر حالياً' : 'No Meeting Rooms in Database Yet'}
                </h4>
                <p className="text-xs text-stone-500 max-w-sm">
                  {isRtl ? 'ابدأ الآن بإضافة أول غرفة اجتماعات لتظهر فوراً على تطبيق الموبايل لجميع العملاء.' : 'Add your first VIP room to feature it live on the guest mobile app.'}
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                icon={Plus}
                onClick={handleOpenAddRoom}
              >
                {isRtl ? 'إضافة غرفة جديدة' : 'Add New Room'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-stone-200/70 shadow-card hover:shadow-luxury hover:border-stone-300/70 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  {/* Room Cover Image Banner */}
                  <div className="relative h-56 w-full overflow-hidden bg-stone-900">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        onError={(e) => {
                          const currentSrc = e.target.src;
                          if (!e.target.dataset.tried1 && currentSrc.includes('/public/storage/')) {
                            e.target.dataset.tried1 = 'true';
                            e.target.src = currentSrc.replace('/public/storage/', '/storage/');
                            return;
                          }
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-chocolate-950 via-chocolate-900 to-chocolate-800 flex items-center justify-center">
                        <DoorOpen className="w-12 h-12 text-gold-500/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-chocolate-950/90 via-chocolate-950/25 to-black/10" />

                    {/* Top Floating Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="h-6 px-2 rounded-full text-xs font-medium bg-black/45 backdrop-blur text-white ring-1 ring-white/15 flex items-center gap-1 tabular-nums">
                          <Users className="w-3.5 h-3.5 text-gold-300" />
                          {isRtl ? `${room.capacityMin} - ${room.capacityMax} أفراد` : `${room.capacityMin}-${room.capacityMax} Guests`}
                        </span>

                        {room.pointsReward > 0 && (
                          <span className="h-6 px-2 rounded-full text-xs font-semibold bg-gold-400/95 text-chocolate-950 ring-1 ring-white/20 flex items-center gap-1 tabular-nums">
                            <Award className="w-3.5 h-3.5 text-chocolate-950" />
                            +{room.pointsReward} {isRtl ? 'نقطة' : 'pts'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {room.availableFrom && room.availableTo && (
                          <span className="h-6 px-2 rounded-full text-xs font-medium bg-black/45 backdrop-blur text-white ring-1 ring-white/15 flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3 text-gold-300" />
                            <span>{room.availableFrom} - {room.availableTo}</span>
                          </span>
                        )}
                        <span className="h-6 px-2 rounded-full text-xs font-medium bg-black/45 backdrop-blur text-white ring-1 ring-white/15 inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {isRtl ? 'معروضة بالتطبيق' : 'Live on App'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Title & Price */}
                    <div className="absolute bottom-3 inset-x-4 flex items-end justify-between text-white">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold drop-shadow-sm">
                            {room.name}
                          </h4>
                          {room.rating > 0 && (
                            <span className="text-xs text-amber-300 font-bold flex items-center gap-0.5">
                              ★ {room.rating}
                            </span>
                          )}
                        </div>
                        {room.secondaryName && room.secondaryName !== room.name && (
                          <p className="text-xs text-gold-200/90 font-medium mt-0.5">
                            {room.secondaryName}
                          </p>
                        )}
                      </div>

                      <div className="text-end bg-black/45 px-3 py-1.5 rounded-xl ring-1 ring-white/15 backdrop-blur">
                        <span className="text-lg font-semibold text-gold-300 tabular-nums">
                          {isRtl ? `${room.hourlyRate} ج.م` : `EGP ${room.hourlyRate}`}
                        </span>
                        <span className="block text-[11px] text-stone-300 font-medium">
                          {isRtl ? '/ بالساعة' : '/ hour'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-[13px] text-stone-600 leading-relaxed line-clamp-2">
                      {room.description || (isRtl ? 'مساحة مجهزة للاجتماعات واللقاءات الخاصة.' : 'Equipped executive meeting space.')}
                    </p>

                    {/* Amenities Badges with FontAwesome Icons */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400 block mb-2">
                        {isRtl ? 'المميزات والتجهيزات التقنية' : 'Included Amenities & Technology'}
                      </span>
                      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                        {(room.amenitiesList && room.amenitiesList.length > 0) ? (
                          room.amenitiesList.map((am, idx) => (
                            <span
                              key={idx}
                              className="h-7 px-2.5 rounded-lg bg-stone-50 text-chocolate-800 border border-stone-200/70 text-xs font-medium flex items-center gap-1.5"
                            >
                              <i className={`${getFaClass(am.icon)} text-gold-600 text-[11px]`}></i>
                              <span>{isRtl ? (am.ar || am.en) : (am.en || am.ar)}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-stone-400 font-medium">
                            {isRtl ? 'تجهيزات قياسية' : 'Standard room equipment'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 360 Virtual Tour Button Bar */}
                    {room.virtualTourUrl && (
                      <div className="p-3 rounded-xl bg-gold-50/60 border border-gold-200/70 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 shrink-0 rounded-xl bg-white text-gold-700 ring-1 ring-inset ring-gold-200/70 flex items-center justify-center">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-chocolate-900">
                              {isRtl ? 'معاينة الغرفة 360° / جولة افتراضية' : '360° Virtual Tour Preview'}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              {isRtl ? 'استعراض بانورامي ثلاثي الأبعاد متاح للعملاء' : 'Interactive panoramic view available in app'}
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="gold"
                          size="sm"
                          icon={Eye}
                          onClick={() => setViewingVirtualTour(room)}
                        >
                          {isRtl ? 'معاينة 360°' : 'View 360°'}
                        </Button>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenEditRoom(room)}
                      >
                        {isRtl ? 'تعديل الغرفة' : 'Edit Room'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => setDeletingRoom(room)}
                      >
                        {isRtl ? 'حذف' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DINING TABLES SECTION (/tables) */}
      {/* ======================================================== */}
      {activeTab === 'tables' && (() => {
        // Filter and Search logic for tables
        const filteredTables = tables.filter((t) => {
          const cap = Number(t.capacity) || 0;
          if (tableFilter === 'couples' && cap > 2) return false;
          if (tableFilter === 'family' && (cap < 3 || cap > 4)) return false;
          if (tableFilter === 'group' && cap < 5) return false;
          if (tableSearch.trim()) {
            const q = tableSearch.trim().toLowerCase();
            return String(t.number).toLowerCase().includes(q) || String(t.id).toLowerCase().includes(q);
          }
          return true;
        });

        const totalSeats = tables.reduce((acc, t) => acc + (Number(t.capacity) || 0), 0);
        const avgSeats = tables.length > 0 ? (totalSeats / tables.length).toFixed(1) : '0';

        return (
          <div className="space-y-5">
            {/* Sleek Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center ring-1 ring-inset ring-gold-200/60 shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-bold text-chocolate-900">
                      {isRtl ? 'طاولات الصالة وجلسات الضيوف' : 'Dining Tables & Seating'}
                    </h3>
                    <span className="inline-flex items-center h-6 px-2 rounded-full bg-stone-100 text-stone-600 text-xs font-semibold tabular-nums">
                      {tables.length} {isRtl ? 'طاولات' : 'Tables'}
                    </span>
                  </div>
                  <p className="text-[13px] text-stone-500 mt-0.5">
                    {isRtl
                      ? 'إدارة جلسات الصالة وسعة المقاعد لاستقبال طلبات الـ Dine-in ونظام الكاشير.'
                      : 'Configure table capacities and live sync with dine-in tickets.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadTables}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-600 hover:text-chocolate-900 shadow-2xs transition-all cursor-pointer"
                  title={isRtl ? 'تحديث من السيرفر' : 'Refresh from server'}
                >
                  <RefreshCw className={`w-4 h-4 ${tablesLoading ? 'animate-spin text-gold-600' : ''}`} />
                </button>
                <Button
                  variant="gold"
                  size="sm"
                  icon={Plus}
                  onClick={handleOpenAddTable}
                >
                  {isRtl ? 'إضافة طاولة جديدة' : 'Add New Table'}
                </Button>
              </div>
            </div>

            {/* Professional KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center ring-1 ring-inset ring-gold-200/60">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-stone-500">{isRtl ? 'إجمالي الطاولات' : 'Total Tables'}</span>
                </div>
                <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {tables.length}
                </div>
                <span className="text-xs text-stone-500 mt-2 block">
                  {isRtl ? 'طاولة مسجلة في الصالة' : 'Tables registered'}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center ring-1 ring-inset ring-sky-200/60">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-stone-500">{isRtl ? 'السعة الكلية للمقاعد' : 'Total Seating'}</span>
                </div>
                <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {totalSeats}
                </div>
                <span className="text-xs text-stone-500 mt-2 block">
                  {isRtl ? 'مقعد متاح للضيوف' : 'Available guest seats'}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-inset ring-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-stone-500">{isRtl ? 'جاهزية الصالة' : 'Hall Readiness'}</span>
                </div>
                <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {tables.length > 0 ? '100%' : '0%'}
                </div>
                <span className="text-xs text-emerald-700 font-medium mt-2 block">
                  {isRtl ? 'جاهزة لاستقبال الطلبات' : 'Ready for dine-in'}
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center ring-1 ring-inset ring-amber-200/60">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-stone-500">{isRtl ? 'متوسط سعة الطاولة' : 'Avg Table Size'}</span>
                </div>
                <div className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {avgSeats}
                </div>
                <span className="text-xs text-stone-500 mt-2 block">
                  {isRtl ? 'أفراد لكل جلسة' : 'Guests per table'}
                </span>
              </div>
            </div>

            {/* Filter Chips & Search Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/70 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Pills */}
              <div className="inline-flex items-center flex-wrap gap-0.5 p-1 bg-stone-200/50 rounded-xl self-start">
                {[
                  { key: 'all', label: isRtl ? 'الكل' : 'All', count: tables.length },
                  { key: 'couples', label: isRtl ? 'جلسات ثنائية (1-2)' : 'Couples (1-2)', count: tables.filter(t => (Number(t.capacity) || 0) <= 2).length },
                  { key: 'family', label: isRtl ? 'جلسات عائلية (3-4)' : 'Family (3-4)', count: tables.filter(t => (Number(t.capacity) || 0) >= 3 && (Number(t.capacity) || 0) <= 4).length },
                  { key: 'group', label: isRtl ? 'مجموعات كبيرة (5+)' : 'Large Groups (5+)', count: tables.filter(t => (Number(t.capacity) || 0) >= 5).length }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTableFilter(tab.key)}
                    className={`h-8 px-3 rounded-lg text-[13px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      tableFilter === tab.key
                        ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                        : 'text-stone-500 font-medium hover:text-chocolate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                      tableFilter === tab.key ? 'bg-gold-100 text-gold-800' : 'bg-stone-200/70 text-stone-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-60">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder={isRtl ? 'بحث برقم الطاولة...' : 'Search table #...'}
                  className="w-full h-10 ps-10 pe-8 text-sm rounded-xl bg-white border border-stone-200 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition text-chocolate-900"
                />
                {tableSearch && (
                  <button
                    type="button"
                    onClick={() => setTableSearch('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-rose-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tables Grid */}
            {tablesLoading && tables.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-56 skeleton rounded-2xl" />
                ))}
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200/70 py-12 px-6 text-center flex flex-col items-center justify-center gap-3 shadow-card">
                <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center">
                  <Coffee className="w-5 h-5" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-sm font-semibold text-chocolate-900">
                    {tableSearch
                      ? (isRtl ? 'لم نجد طاولة تطابق بحثك' : 'No Table Found')
                      : (isRtl ? 'لا توجد طاولات ضمن هذا التصنيف' : 'No Tables in this Filter')}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {tableSearch
                      ? (isRtl ? `لم نجد أي طاولة تطابق "${tableSearch}". جرب البحث برقم آخر.` : `No match for "${tableSearch}". Try another table number.`)
                      : (isRtl ? 'يمكنك إضافة طاولة جديدة للصالة بنقرة واحدة وتحديد سعتها الاستيعابية.' : 'Add your first dining table to get started.')}
                  </p>
                </div>
                <div className="pt-1">
                  <Button
                    variant="gold"
                    size="sm"
                    icon={Plus}
                    onClick={handleOpenAddTable}
                  >
                    {isRtl ? 'إضافة طاولة جديدة' : 'Add New Table'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTables.map((table) => {
                  const capacityNum = Number(table.capacity) || 4;

                  return (
                    <div
                      key={table.id || table.number}
                      className="bg-white rounded-2xl border border-stone-200/70 p-4 sm:p-5 shadow-card hover:shadow-luxury hover:border-stone-300/70 transition-all flex flex-col justify-between group relative overflow-hidden"
                    >

                      <div className="space-y-4">
                        {/* Header: Table Number & Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 flex items-center justify-center font-semibold text-sm tabular-nums">
                              #{table.number}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-chocolate-900 leading-tight">
                                {isRtl ? `طاولة رقم ${table.number}` : `Table #${table.number}`}
                              </h4>
                              <span className="text-[11px] text-stone-500 font-medium">
                                {isRtl ? 'الصالة الداخلية' : 'Main Dining Area'}
                              </span>
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-medium whitespace-nowrap shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{isRtl ? 'متاحة للجلوس' : 'Available'}</span>
                          </div>
                        </div>

                        {/* Interactive Seating Plan Blueprint Representation */}
                        <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/60 flex flex-col items-center justify-center space-y-3">
                          {/* Visual Table Surface with Chairs around it */}
                          <div className="relative flex items-center justify-center py-2">
                            {/* Central Table Icon Badge */}
                            <div className="w-16 h-12 rounded-xl bg-white border border-gold-300/80 shadow-xs flex items-center justify-center text-chocolate-900 font-semibold tabular-nums text-xs">
                              <Coffee className="w-4 h-4 text-gold-600 me-1" />
                              <span>T-{table.number}</span>
                            </div>

                            {/* Stylized Chairs layout matching capacity */}
                            <div className="absolute inset-x-0 -top-1 flex justify-center gap-2">
                              {Array.from({ length: Math.min(Math.ceil(capacityNum / 2), 4) }).map((_, i) => (
                                <div key={i} className="w-2.5 h-1 rounded-t-sm bg-gold-400" />
                              ))}
                            </div>
                            <div className="absolute inset-x-0 -bottom-1 flex justify-center gap-2">
                              {Array.from({ length: Math.min(Math.floor(capacityNum / 2), 4) }).map((_, i) => (
                                <div key={i} className="w-2.5 h-1 rounded-b-sm bg-gold-400" />
                              ))}
                            </div>
                          </div>

                          {/* Seating Capacity Badge */}
                          <div className="flex items-center gap-1.5 h-7 text-xs font-medium text-chocolate-800 bg-white px-2.5 rounded-full border border-stone-200/70 shadow-2xs">
                            <Users className="w-3.5 h-3.5 text-gold-600" />
                            <span>{isRtl ? `تتسع لـ ${capacityNum} أفراد` : `Seats ${capacityNum} Guests`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3.5 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-stone-400">
                          {isRtl ? 'خدمة الصالة Dine-in' : 'Dine-in Service'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEditTable(table)}
                          >
                            {isRtl ? 'تعديل السعة' : 'Edit'}
                          </Button>
                          
                          <button
                            type="button"
                            onClick={() => setDeletingTable(table)}
                            className="h-8 w-8 inline-flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title={isRtl ? 'حذف الطاولة' : 'Delete Table'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* 3. BOOKINGS SECTION */}
      {/* ======================================================== */}
      {activeTab === 'bookings' && (() => {
        const totalBookingsCount = bookings.length;
        const pendingBookingsCount = bookings.filter(b => b.status === 'pending').length;
        const confirmedBookingsCount = bookings.filter(b => b.status === 'confirmed').length;
        const completedBookingsCount = bookings.filter(b => b.status === 'completed').length;
        const rejectedBookingsCount = bookings.filter(b => b.status === 'rejected').length;
        const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

        return (
          <div className="space-y-5">
            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center ring-1 ring-inset ring-sky-200/60">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-stone-500">
                    {isRtl ? 'إجمالي الحجوزات' : 'Total Bookings'}
                  </span>
                </div>
                <p className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {totalBookingsCount}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center ring-1 ring-inset ring-amber-200/60">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-stone-500 min-w-0">
                    {isRtl ? 'قيد المراجعة والإيصال' : 'Pending Verification'}
                  </span>
                  {pendingBookingsCount > 0 && (
                    <span className="relative flex w-2 h-2 shrink-0">
                      <span className="absolute inline-flex w-full h-full rounded-full bg-amber-400 opacity-70 animate-ping" />
                      <span className="relative inline-flex w-2 h-2 rounded-full bg-amber-500" />
                    </span>
                  )}
                </div>
                <p className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {pendingBookingsCount}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center ring-1 ring-inset ring-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-stone-500">
                    {isRtl ? 'الحجوزات المؤكدة' : 'Confirmed Bookings'}
                  </span>
                </div>
                <p className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {confirmedBookingsCount}
                </p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/70 shadow-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 shrink-0 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center ring-1 ring-inset ring-gold-200/60">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-medium text-stone-500">
                    {isRtl ? 'قيمة الحجوزات' : 'Total Revenue'}
                  </span>
                </div>
                <p className="mt-4 text-[28px] leading-none font-semibold text-chocolate-950 tabular-nums">
                  {totalRevenue} <span className="text-xs font-medium text-stone-400">{isRtl ? 'ج.م' : 'EGP'}</span>
                </p>
              </div>
            </div>

            {/* Top Controls & Search */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/70 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-0.5 p-1 bg-stone-200/50 rounded-xl overflow-x-auto max-w-full self-start lg:self-auto">
                {[
                  { id: 'all', label: isRtl ? 'جميع الحجوزات' : 'All Bookings', count: totalBookingsCount },
                  { id: 'pending', label: isRtl ? 'قيد المراجعة والإيصال' : 'Pending Verification', count: pendingBookingsCount },
                  { id: 'confirmed', label: isRtl ? 'مؤكدة' : 'Confirmed', count: confirmedBookingsCount },
                  { id: 'completed', label: isRtl ? 'مكتملة' : 'Completed', count: completedBookingsCount },
                  { id: 'rejected', label: isRtl ? 'ملغية / مرفوضة' : 'Rejected', count: rejectedBookingsCount }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleFilterBookingsTab(tab.id)}
                    className={`h-8 px-3 rounded-lg text-[13px] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      bookingStatusFilter === tab.id
                        ? 'bg-white text-chocolate-900 font-semibold shadow-xs'
                        : 'text-stone-500 font-medium hover:text-chocolate-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                      bookingStatusFilter === tab.id
                        ? 'bg-gold-100 text-gold-800'
                        : 'bg-stone-200/70 text-stone-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                <div className="relative flex-1 lg:flex-none">
                  <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder={isRtl ? "بحث برقم الحجز، العميل، الهاتف، القاعة..." : "Search booking #, guest, phone, room..."}
                    className="h-10 ps-10 pe-3 text-sm rounded-xl bg-white border border-stone-200 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition w-full lg:w-64 text-chocolate-900 placeholder:text-stone-400"
                  />
                </div>

                {/* Real-time Connection Status Pill */}
                <div
                  className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${
                    realtimeState === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                      : realtimeState === 'connecting'
                      ? 'bg-amber-50 text-amber-700 border-amber-200/70 animate-pulse'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                  title={
                    realtimeState === 'connected'
                      ? (isRtl ? 'البث المباشر متصل - الحجوزات تتحدث لحظياً بدون ريفريش' : 'Real-time WebSocket Live')
                      : (isRtl ? 'جاري الاتصال بالبث المباشر...' : 'Connecting...')
                  }
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      realtimeState === 'connected'
                        ? 'bg-emerald-500 animate-pulse'
                        : realtimeState === 'connecting'
                        ? 'bg-amber-500'
                        : 'bg-stone-400'
                    }`}
                  />
                  <span>
                    {realtimeState === 'connected'
                      ? (isRtl ? 'بث مباشر' : 'Live')
                      : realtimeState === 'connecting'
                      ? (isRtl ? 'اتصال...' : 'Connecting...')
                      : (isRtl ? 'غير متصل' : 'Offline')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (reconnect) reconnect();
                    loadBookingsOnly(true);
                    toast.info(isRtl ? 'تم تحديث قائمة الحجوزات' : 'Bookings refreshed');
                  }}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-600 hover:text-chocolate-900 shadow-2xs transition-all cursor-pointer shrink-0"
                  title={isRtl ? 'إعادة الاتصال وتحديث الحجوزات' : 'Reconnect & Refresh Bookings'}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl py-12 px-6 border border-stone-200/70 shadow-card text-center space-y-2">
                <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-1">
                  <Calendar className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-chocolate-900">{isRtl ? 'لا توجد حجوزات مسجلة' : 'No bookings found'}</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  {isRtl ? 'لم يتم العثور على أي حجوزات تتوافق مع خيارات الفلترة والبحث الحالية.' : 'No reservations found for current filter.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200/70 shadow-card overflow-hidden w-full">
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-[13px]">
                    <thead className="bg-stone-50/80 text-stone-500 text-xs border-b border-stone-200/70">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-start whitespace-nowrap">{isRtl ? 'رقم الحجز والعميل' : 'Booking & Guest'}</th>
                        <th className="py-2.5 px-4 font-semibold text-start whitespace-nowrap">{isRtl ? 'الغرفة المحجوزة' : 'Room Booked'}</th>
                        <th className="py-2.5 px-4 font-semibold text-start min-w-[220px]">{isRtl ? 'موعد الحجز (من - إلى) والمدة' : 'Schedule (From – To) & Duration'}</th>
                        <th className="py-2.5 px-4 font-semibold text-start whitespace-nowrap">{isRtl ? 'المبلغ والدفع' : 'Amount & Payment'}</th>
                        <th className="py-2.5 px-4 font-semibold text-start whitespace-nowrap">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="py-2.5 px-4 font-semibold text-end whitespace-nowrap">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredBookings.map((b) => {
                        const sched = formatBookingSchedule(b, isRtl);
                        const cleanPhone = b.customerPhone ? String(b.customerPhone).replace(/\D/g, '') : '';
                        const waLink = cleanPhone ? `https://wa.me/20${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}` : null;
                        const isNewlyArrived = lastNewBookingId && (String(b.id) === String(lastNewBookingId) || String(b.bookingNumber) === String(lastNewBookingId));

                        return (
                          <tr
                            key={b.id}
                            className={`transition-all cursor-pointer ${
                              isNewlyArrived
                                ? 'bg-amber-50/90 ring-2 ring-inset ring-gold-400 animate-pulse'
                                : 'hover:bg-stone-50/70'
                            }`}
                            onClick={() => handleOpenBookingDetails(b)}
                          >
                            {/* Booking # and Guest */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="inline-flex items-center h-6 px-2 rounded-md bg-stone-100 border border-stone-200/70 font-semibold tabular-nums text-chocolate-900 text-xs">
                                  #{b.bookingNumber}
                                </span>
                                {isNewlyArrived && (
                                  <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-amber-500 text-white font-semibold text-[11px]">
                                    {isRtl ? 'جديد الآن' : 'New!'}
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-chocolate-900 text-sm">{b.customerName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <a
                                  href={`tel:${b.customerPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-stone-500 tabular-nums hover:text-gold-700 flex items-center gap-1 font-medium"
                                  dir="ltr"
                                  title={isRtl ? 'اتصال هاتفي' : 'Call guest'}
                                >
                                  <Phone className="w-3 h-3 text-stone-400" />
                                  <span>{b.customerPhone}</span>
                                </a>
                                {waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-6 w-6 inline-flex items-center justify-center rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                    title={isRtl ? 'محادثة واتساب' : 'WhatsApp'}
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Booked Room */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-700 flex items-center justify-center shrink-0 ring-1 ring-inset ring-gold-200/60">
                                  <DoorOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-chocolate-900 text-[13px]">{b.roomName}</p>
                                  <span className="text-xs text-stone-500 block">
                                    {b.capacityMin && b.capacityMax ? `${b.capacityMin}-${b.capacityMax} ${isRtl ? 'فرد' : 'guests'}` : (isRtl ? 'قاعة مجهزة' : 'Equipped Room')}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Schedule (From - To) and Duration */}
                            <td className="py-3 px-4">
                              <div className="space-y-1.5">
                                {/* Formatted Arabic / English Date */}
                                <div className="flex items-center gap-1.5 text-[13px] font-semibold text-chocolate-900">
                                  <Calendar className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                                  <span>{sched.dateFormatted}</span>
                                </div>

                                {/* From - To Time Range Badge */}
                                <div className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 font-medium text-xs tabular-nums">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>{sched.timeRange}</span>
                                </div>

                                {/* Duration */}
                                <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                                  <Hourglass className="w-3 h-3 text-stone-400 shrink-0" />
                                  <span>
                                    {isRtl ? 'المدة:' : 'Duration:'}{' '}
                                    <strong className="text-chocolate-900 font-semibold">{sched.durationFormatted}</strong>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Amount & Payment */}
                            <td className="py-3 px-4">
                              <span className="font-semibold text-chocolate-950 text-sm tabular-nums block whitespace-nowrap">
                                {isRtl ? `${b.totalPrice} ج.م` : `EGP ${b.totalPrice}`}
                              </span>
                              <span className="text-[11px] text-stone-400 tabular-nums block mt-0.5">
                                {b.durationHours} {isRtl ? 'ساعات' : 'hrs'} × {isRtl ? `${b.hourlyRate} ج.م` : `EGP ${b.hourlyRate}`}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <span className="inline-flex items-center h-5 px-1.5 rounded-md bg-stone-100 text-stone-600 font-semibold text-[11px]">
                                  {b.paymentMethod === 'instapay' ? 'InstaPay' : b.paymentMethod === 'vodafone_cash' ? 'Vodafone Cash' : (isRtl ? 'دفع كاش' : 'Cash')}
                                </span>
                                {b.receiptImageUrl && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenBookingDetails(b);
                                    }}
                                    className="h-5 px-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Receipt className="w-3 h-3" />
                                    <span>{isRtl ? 'إيصال مرفق' : 'Receipt'}</span>
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                              <Badge variant={b.status === 'confirmed' ? 'available' : b.status === 'completed' ? 'completed' : b.status === 'rejected' ? 'inactive' : 'pending'}>
                                {b.status === 'confirmed' ? (isRtl ? 'مؤكد ومحجوز' : 'Confirmed') :
                                 b.status === 'completed' ? (isRtl ? 'مكتمل' : 'Completed') :
                                 b.status === 'rejected' ? (isRtl ? 'مرفوض / ملغي' : 'Rejected') : (isRtl ? 'قيد المراجعة والإيصال' : 'Pending Verification')}
                              </Badge>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-end" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                {b.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleConfirmBooking(b.id)}
                                      className="h-8 w-8 inline-flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors border border-emerald-200/70"
                                      title={isRtl ? 'تأكيد الحجز' : 'Confirm'}
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRejectingBooking(b)}
                                      className="h-8 w-8 inline-flex items-center justify-center bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors border border-rose-200/70"
                                      title={isRtl ? 'رفض الحجز' : 'Reject'}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={Eye}
                                  onClick={() => handleOpenBookingDetails(b)}
                                >
                                  {isRtl ? 'التفاصيل' : 'Details'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* 3. GENERAL FACILITIES SECTION */}
      {/* ======================================================== */}
      {activeTab === 'facilities' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/70 shadow-card">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-bold text-chocolate-900">
                  {isRtl ? 'مرافق وخدمات فرع كافيه 90' : 'Cafe 90 Branch Facilities & Perks'}
                </h3>
                <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums">
                  {facilities.length} {isRtl ? 'خدمة مضافة' : 'Facilities'}
                </span>
              </div>
              <p className="text-[13px] text-stone-500 mt-1 leading-relaxed">
                {isRtl
                  ? 'إدارة الخدمات المميزة المعروضة في شاشات التطبيق للعملاء (واي فاي مجاني، مناطق عمل، مقابس شحن، وغيرها) مع الترتيب والأيقونات.'
                  : 'Manage amenities displayed on customer app store directory with custom icons and display orders.'}
              </p>
            </div>

            <Button
              variant="gold"
              size="sm"
              icon={Plus}
              onClick={handleOpenAddFacility}
            >
              {isRtl ? 'إضافة خدمة جديدة' : 'Add New Facility'}
            </Button>
          </div>

          {facilities.length === 0 ? (
            <div className="bg-white rounded-2xl py-12 px-6 border border-stone-200/70 text-center flex flex-col items-center justify-center gap-3 shadow-card">
              <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-chocolate-900 mb-1">
                  {isRtl ? 'لا توجد خدمات مسجلة في السيرفر حالياً' : 'No Facilities in Database Yet'}
                </h4>
                <p className="text-xs text-stone-500 max-w-sm">
                  {isRtl ? 'ابدأ الآن بإضافة أول خدمة (مثل واي فاي مجاني) لتظهر للعملاء في التطبيق.' : 'Add your first branch amenity to showcase on mobile app.'}
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                icon={Plus}
                onClick={handleOpenAddFacility}
              >
                {isRtl ? 'إضافة خدمة جديدة' : 'Add New Facility'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities.map((fac) => (
                <div
                  key={fac.id}
                  className="bg-white rounded-2xl p-5 border border-stone-200/70 shadow-card hover:shadow-luxury hover:border-stone-300/70 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gold-50 ring-1 ring-inset ring-gold-200/60 flex items-center justify-center shrink-0 overflow-hidden">
                        {fac.iconUrl ? (
                          <img
                            src={fac.iconUrl}
                            alt={fac.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Sparkles className="w-6 h-6 text-gold-600" />
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center h-6 px-2 rounded-full text-[11px] font-semibold tabular-nums bg-stone-100 text-stone-600 border border-stone-200/70">
                          #{fac.id}
                        </span>
                        <span className="inline-flex items-center h-6 px-2 rounded-full text-[11px] font-semibold tabular-nums bg-gold-50 text-gold-800 border border-gold-200/70">
                          {isRtl ? `الترتيب: ${fac.order}` : `Order: ${fac.order}`}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-chocolate-900">
                        {fac.nameAr || fac.name}
                      </h4>
                      {fac.nameEn && fac.nameEn !== fac.nameAr && (
                        <p className="text-[13px] text-stone-500 mt-0.5">
                          {fac.nameEn}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3.5 mt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleOpenEditFacility(fac)}
                    >
                      {isRtl ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() => setDeletingFacility(fac)}
                    >
                      {isRtl ? 'حذف' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD / EDIT ROOM MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title={editingRoom ? (isRtl ? "تعديل غرفة الاجتماعات" : "Edit Meeting Room") : (isRtl ? "إضافة غرفة اجتماعات VIP جديدة" : "Add New VIP Meeting Room")}
        subtitle={isRtl ? "تحديد الاسم، السعة، سعر الساعة، نقاط الولاء، المميزات مع الأيقونات، والجولة الافتراضية 360°" : "Configure capacity, hourly rates (EGP), loyalty points, amenities with icons, and 360° tour"}
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRoomModalOpen(false)}
              disabled={submitting}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleSaveRoom}
              loading={submitting}
            >
              {editingRoom ? (isRtl ? "حفظ التعديلات في التطبيق" : "Save Changes") : (isRtl ? "إنشاء ونشر الغرفة في التطبيق" : "Create Room")}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveRoom} className="space-y-4 text-sm">
          {/* Room Names (Arabic & English) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'اسم الغرفة (بالعربية) *' : 'Room Name (Arabic) *'}
              </label>
              <input
                type="text"
                value={roomForm.nameAr}
                onChange={(e) => setRoomForm({ ...roomForm, nameAr: e.target.value })}
                placeholder={isRtl ? "مثال: غرفة الاجتماعات VIP 1" : "e.g. غرفة الاجتماعات VIP 1"}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'اسم الغرفة (بالإنجليزية) *' : 'Room Name (English) *'}
              </label>
              <input
                type="text"
                value={roomForm.nameEn}
                onChange={(e) => setRoomForm({ ...roomForm, nameEn: e.target.value })}
                placeholder={isRtl ? "مثال: VIP Meeting Room 1" : "e.g. VIP Meeting Room 1"}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
                required
              />
            </div>
          </div>

          {/* Pricing, Capacity, Points & Working Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'سعر الساعة (ج.م) *' : 'Hourly Rate (EGP) *'}
              </label>
              <input
                type="number"
                value={roomForm.hourlyRate}
                onChange={(e) => setRoomForm({ ...roomForm, hourlyRate: e.target.value })}
                placeholder="100"
                min="1"
                step="any"
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'الحد الأدنى للأفراد *' : 'Min Capacity *'}
              </label>
              <input
                type="number"
                value={roomForm.capacityMin}
                onChange={(e) => setRoomForm({ ...roomForm, capacityMin: e.target.value })}
                placeholder="10"
                min="1"
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'الحد الأقصى للأفراد *' : 'Max Capacity *'}
              </label>
              <input
                type="number"
                value={roomForm.capacityMax}
                onChange={(e) => setRoomForm({ ...roomForm, capacityMax: e.target.value })}
                placeholder="12"
                min="1"
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'مكافأة نقاط الولاء' : 'Points Reward'}
              </label>
              <input
                type="number"
                value={roomForm.pointsReward}
                onChange={(e) => setRoomForm({ ...roomForm, pointsReward: e.target.value })}
                placeholder="15"
                min="0"
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'متاح للحجز من (وقت)' : 'Available From'}
              </label>
              <input
                type="time"
                value={roomForm.availableFrom}
                onChange={(e) => setRoomForm({ ...roomForm, availableFrom: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'متاح للحجز إلى (وقت)' : 'Available To'}
              </label>
              <input
                type="time"
                value={roomForm.availableTo}
                onChange={(e) => setRoomForm({ ...roomForm, availableTo: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
              />
            </div>
          </div>

          {/* Dynamic Amenities & Technology Manager with FontAwesome Icons */}
          <div className="space-y-3 p-4 rounded-xl border border-stone-200/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-chocolate-900">
                  {isRtl ? 'المميزات والتجهيزات التقنية' : 'Included Amenities & Equipment'}
                </label>
                <p className="text-xs text-stone-500 mt-0.5">
                  {isRtl ? 'اختر من المميزات الجاهزة أو اكتب ميزة جديدة وأضفها مباشرة:' : 'Select from quick presets or type a new amenity and add it directly:'}
                </p>
              </div>
              <span className="inline-flex items-center h-6 px-2 rounded-full bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200/70 text-xs font-semibold tabular-nums whitespace-nowrap shrink-0">
                {roomForm.amenitiesList.length} {isRtl ? 'مميزات مختارة' : 'Selected'}
              </span>
            </div>

            {/* Active Selected Amenities List */}
            {roomForm.amenitiesList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-stone-50/80 border border-stone-200/70 min-h-[44px] items-center">
                {roomForm.amenitiesList.map((am, idx) => (
                  <span
                    key={idx}
                    className="h-7 ps-2.5 pe-1 rounded-lg bg-white border border-stone-200 text-chocolate-900 text-xs font-medium flex items-center gap-1.5 shadow-2xs animate-fade-in group"
                  >
                    <i className={`${getFaClass(am.icon)} text-gold-600 text-[11px]`}></i>
                    <span>{isRtl ? am.ar : am.en}</span>
                    {am.en && am.en !== am.ar && (
                      <span className="text-[11px] text-stone-400 font-normal">
                        ({isRtl ? am.en : am.ar})
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(idx)}
                      className="h-5 w-5 inline-flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 rounded-md transition-colors cursor-pointer text-stone-400"
                      title={isRtl ? "حذف هذه الميزة" : "Remove amenity"}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-stone-500 border border-dashed border-stone-200 rounded-xl bg-stone-50/60">
                {isRtl ? 'لم يتم تحديد أي مميزات للغرفة بعد. اختر من الأسفل أو أضف ميزة جديدة.' : 'No amenities added yet. Select from below or add a new one.'}
              </div>
            )}

            {/* Quick Preset Selector Buttons with Icons */}
            <div>
              <span className="text-xs font-semibold text-stone-600 block mb-1.5">
                {isRtl ? 'مميزات جاهزة للاختيار السريع:' : 'Quick Preset Amenities:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_AMENITIES.map((preset, i) => {
                  const isSelected = roomForm.amenitiesList.some(a => a.ar === preset.ar || a.en === preset.en);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleToggleAmenity(preset)}
                      className={`h-7 px-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-gold-50 text-gold-900 border border-gold-300 font-semibold ring-2 ring-gold-400/15'
                          : 'bg-white text-stone-600 font-medium hover:bg-stone-50 hover:text-chocolate-900 border border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <i className={`${getFaClass(preset.icon)} text-[11px] ${isSelected ? 'text-gold-700' : 'text-stone-400'}`}></i>
                      <span>{isRtl ? preset.ar : preset.en}</span>
                      <span className="text-[11px] opacity-75">{isSelected ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Amenity Input (Single clean textfield + Add button) */}
            <div className="pt-3 border-t border-stone-100 space-y-1.5">
              <span className="text-xs font-semibold text-stone-600 block">
                {isRtl ? 'إضافة ميزة مخصصة:' : 'Add Custom Amenity:'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAmenityAr}
                  onChange={(e) => setNewAmenityAr(e.target.value)}
                  placeholder={isRtl ? "اكتب اسم الميزة هنا واضغط إضافة (مثال: سبورة ذكية، إضاءة بودكاست...)" : "Enter amenity name (e.g. Smart Board...)"}
                  className="flex-1 min-w-0 h-10 px-3 text-sm rounded-xl bg-white border border-stone-200 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none text-chocolate-900 transition"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomAmenity(); }}}
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="h-10 px-4 bg-chocolate-900 hover:bg-chocolate-800 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إضافة' : 'Add'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Image & 360 Tour Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Main Cover Image */}
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'صورة الغرفة الرئيسية' : 'Main Cover Image'}
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200/70 bg-stone-100 shrink-0 flex items-center justify-center relative">
                  {roomForm.imageUrl ? (
                    <img src={roomForm.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-stone-400" />
                  )}
                  {optimizingRoomImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-gold-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setOptimizingRoomImage(true);
                        const optimized = await optimizeImageForMobile(file, 'room');
                        setRoomImageFile(optimized.file);
                        setRoomForm((p) => ({ ...p, imageUrl: optimized.previewUrl }));
                        toast.success(
                          isRtl
                            ? 'تم ضبط وتنسيق صورة الغرفة تلقائياً للموبايل (16:9 فائقة الدقة) ✨'
                            : 'Room cover optimized for mobile (16:9 HD) ✨'
                        );
                      } catch {
                        setRoomImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) setRoomForm(p => ({ ...p, imageUrl: evt.target.result }));
                        };
                        reader.readAsDataURL(file);
                      } finally {
                        setOptimizingRoomImage(false);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={optimizingRoomImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 px-3 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-gold-600" />
                      <span>{optimizingRoomImage ? (isRtl ? 'جاري التحسين...' : 'Optimizing...') : (isRtl ? 'اختيار صورة (تحسين تلقائي 16:9)' : 'Choose Image (Auto 16:9)')}</span>
                    </button>
                    {roomImageFile && (
                      <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full truncate max-w-[130px]" title={roomImageFile.name}>
                        ✓ {roomImageFile.name}
                      </span>
                    )}
                    {roomForm.imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setRoomImageFile(null);
                          setRoomForm(p => ({ ...p, imageUrl: '' }));
                        }}
                        className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                      >
                        {isRtl ? 'إزالة' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 360 Tour Image */}
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'صورة الجولة الافتراضية 360°' : '360° Virtual Tour Image'}
              </label>
              <div className="flex items-center gap-2.5">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-gold-200/70 bg-gold-50 shrink-0 flex items-center justify-center relative">
                  {roomForm.virtualTourUrl ? (
                    <img src={roomForm.virtualTourUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Compass className="w-6 h-6 text-gold-600" />
                  )}
                  {optimizingRoomImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 text-gold-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <input
                    type="file"
                    ref={virtualTourInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setOptimizingRoomImage(true);
                        const optimized = await optimizeImageForMobile(file, 'room');
                        setVirtualTourImageFile(optimized.file);
                        setRoomForm((p) => ({ ...p, virtualTourUrl: optimized.previewUrl }));
                        toast.success(
                          isRtl
                            ? 'تم ضبط صورة الجولة الافتراضية 360° لشاشات الموبايل بنجاح ✨'
                            : 'Virtual tour optimized for mobile screens ✨'
                        );
                      } catch {
                        setVirtualTourImageFile(file);
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          if (evt.target?.result) setRoomForm(p => ({ ...p, virtualTourUrl: evt.target.result }));
                        };
                        reader.readAsDataURL(file);
                      } finally {
                        setOptimizingRoomImage(false);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={optimizingRoomImage}
                      onClick={() => virtualTourInputRef.current?.click()}
                      className="h-8 px-3 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-gold-600" />
                      <span>{optimizingRoomImage ? (isRtl ? 'جاري التحسين...' : 'Optimizing...') : (isRtl ? 'اختيار صورة 360°' : 'Choose 360°')}</span>
                    </button>
                    {virtualTourImageFile && (
                      <span className="text-[11px] text-gold-800 font-medium bg-gold-50 border border-gold-200/70 px-2 py-0.5 rounded-full truncate max-w-[130px]" title={virtualTourImageFile.name}>
                        ✓ {virtualTourImageFile.name}
                      </span>
                    )}
                    {roomForm.virtualTourUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setVirtualTourImageFile(null);
                          setRoomForm(p => ({ ...p, virtualTourUrl: '' }));
                        }}
                        className="text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                      >
                        {isRtl ? 'إزالة' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bilingual Descriptions (Arabic & English) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'الوصف ومواصفات الغرفة (بالعربية)' : 'Room Description & Specs (Arabic)'}
              </label>
              <textarea
                rows={3}
                value={roomForm.descriptionAr}
                onChange={(e) => {
                  setRoomForm({ ...roomForm, descriptionAr: e.target.value });
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.max(80, e.target.scrollHeight) + 'px';
                }}
                placeholder={isRtl ? "مساحة خاصة مجهزة للاجتماعات واللقاءات الخاصة بتجربة مريحة ومميزة..." : "e.g. مساحة خاصة مجهزة للاجتماعات..."}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition min-h-[85px] leading-relaxed resize-y"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
                {isRtl ? 'الوصف ومواصفات الغرفة (بالإنجليزية)' : 'Room Description & Specs (English)'}
              </label>
              <textarea
                rows={3}
                value={roomForm.descriptionEn}
                onChange={(e) => {
                  setRoomForm({ ...roomForm, descriptionEn: e.target.value });
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.max(80, e.target.scrollHeight) + 'px';
                }}
                placeholder="A private space equipped for meetings and gatherings with a comfortable, premium experience..."
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition min-h-[85px] leading-relaxed resize-y"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ======================================================== */}
      {/* 360 VIRTUAL TOUR PREVIEW MODAL */}
      {/* ======================================================== */}
      {viewingVirtualTour && (
        <Modal
          isOpen={Boolean(viewingVirtualTour)}
          onClose={() => setViewingVirtualTour(null)}
          title={isRtl ? `جولة افتراضية 360° - ${viewingVirtualTour.name}` : `360° Virtual Tour - ${viewingVirtualTour.name}`}
          subtitle={isRtl ? "استعراض تفاعلي ومحاكاة ثلاثية الأبعاد لمحيط وتجهيزات الغرفة" : "Interactive 3D panoramic simulation of the executive meeting room"}
          maxWidth="max-w-4xl"
          footer={
            <div className="w-full flex items-center justify-between">
              <span className="text-sm font-semibold text-gold-700 tabular-nums">
                {isRtl ? `${viewingVirtualTour.hourlyRate} ج.م / بالساعة` : `EGP ${viewingVirtualTour.hourlyRate} / Hour`}
              </span>
              <Button
                variant="gold"
                size="sm"
                onClick={() => setViewingVirtualTour(null)}
              >
                {isRtl ? 'إغلاق المعاينة' : 'Close Tour'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* 360 Panorama Canvas Simulation */}
            <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-chocolate-950 ring-1 ring-black/5 group">
              <img
                src={viewingVirtualTour.virtualTourUrl || viewingVirtualTour.imageUrl}
                alt="360 Tour Panorama"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-chocolate-950/80 via-transparent to-chocolate-950/40" />

              {/* Center 360 Compass Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-9 px-3.5 rounded-full bg-black/45 ring-1 ring-white/15 backdrop-blur text-white flex items-center gap-2 shadow-pop">
                  <Compass className="w-4 h-4 text-gold-300" />
                  <span className="text-xs font-semibold">
                    {isRtl ? 'اسحب للتجول 360° داخل القاعة' : '360° Interactive Room Panorama'}
                  </span>
                </div>
              </div>

              {/* Interactive Floating Hotspots */}
              <div className="absolute bottom-4 start-4 flex flex-wrap gap-2">
                {(viewingVirtualTour.amenitiesList || []).map((am, i) => (
                  <span key={i} className="h-6 px-2 rounded-full bg-black/45 text-white ring-1 ring-white/15 text-xs font-medium backdrop-blur flex items-center gap-1.5">
                    <i className={`${getFaClass(am.icon)} text-gold-300 text-[11px]`}></i>
                    <span>{isRtl ? am.ar : am.en}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Room Specs Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-stone-200/70 text-[13px]">
              <div>
                <span className="text-xs text-stone-500 font-medium block mb-0.5">{isRtl ? 'السعة الاستيعابية:' : 'Capacity:'}</span>
                <span className="font-semibold text-chocolate-900 tabular-nums">{viewingVirtualTour.capacityMin} - {viewingVirtualTour.capacityMax} {isRtl ? 'أفراد' : 'Guests'}</span>
              </div>
              <div>
                <span className="text-xs text-stone-500 font-medium block mb-0.5">{isRtl ? 'سعر الحجز بالساعة:' : 'Hourly Rate:'}</span>
                <span className="font-semibold text-chocolate-900 tabular-nums">{isRtl ? `${viewingVirtualTour.hourlyRate} ج.م` : `EGP ${viewingVirtualTour.hourlyRate}`}</span>
              </div>
              {viewingVirtualTour.pointsReward > 0 && (
                <div>
                  <span className="text-xs text-stone-500 font-medium block mb-0.5">{isRtl ? 'مكافأة نقاط الولاء:' : 'Points Reward:'}</span>
                  <span className="font-semibold text-gold-700 tabular-nums">+{viewingVirtualTour.pointsReward} {isRtl ? 'نقطة' : 'pts'}</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* BOOKING DETAILS & RECEIPT VERIFICATION MODAL */}
      {/* ======================================================== */}
      {viewingBooking && (() => {
        const sched = formatBookingSchedule(viewingBooking, isRtl);
        const cleanPhone = viewingBooking.customerPhone ? String(viewingBooking.customerPhone).replace(/\D/g, '') : '';
        const waLink = cleanPhone ? `https://wa.me/20${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}` : null;

        return (
          <Modal
            isOpen={Boolean(viewingBooking)}
            onClose={() => setViewingBooking(null)}
            title={isRtl ? `قسيمة حجز القاعة #${viewingBooking.bookingNumber}` : `Reservation Voucher #${viewingBooking.bookingNumber}`}
            subtitle={isRtl ? `بيانات حجز العميل ${viewingBooking.customerName} بقاعة ${viewingBooking.roomName}` : `Guest ${viewingBooking.customerName} - ${viewingBooking.roomName}`}
            maxWidth="max-w-2xl"
            footer={
              <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  {isRtl ? 'طباعة قسيمة الحجز' : 'Print Voucher'}
                </Button>

                <div className="flex items-center gap-2">
                  {viewingBooking.status === 'pending' && (
                    <>
                      <Button
                        variant="gold"
                        size="sm"
                        icon={CheckCircle2}
                        loading={actionLoading}
                        onClick={() => handleConfirmBooking(viewingBooking.id)}
                      >
                        {isRtl ? 'تأكيد وقبول الحجز' : 'Confirm Booking'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => setRejectingBooking(viewingBooking)}
                      >
                        {isRtl ? 'رفض الحجز' : 'Reject'}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingBooking(null)}
                  >
                    {isRtl ? 'إغلاق' : 'Close'}
                  </Button>
                </div>
              </div>
            }
          >
            <div className="space-y-4 text-sm">
              {/* Top Highlight: Booking Code & Status Strip */}
              <div className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-stone-500 font-medium">{isRtl ? 'كود الحجز:' : 'Booking ID:'}</span>
                  <span className="inline-flex items-center h-7 tabular-nums font-semibold text-chocolate-900 bg-white px-2.5 rounded-lg border border-stone-200 shadow-2xs text-sm">
                    #{viewingBooking.bookingNumber}
                  </span>
                </div>
                <Badge variant={viewingBooking.status === 'confirmed' ? 'available' : viewingBooking.status === 'completed' ? 'completed' : viewingBooking.status === 'rejected' ? 'inactive' : 'pending'}>
                  {viewingBooking.status === 'confirmed' ? (isRtl ? 'مؤكد ومحجوز' : 'Confirmed') :
                   viewingBooking.status === 'completed' ? (isRtl ? 'مكتمل' : 'Completed') :
                   viewingBooking.status === 'rejected' ? (isRtl ? 'مرفوض / ملغي' : 'Rejected') : (isRtl ? 'قيد المراجعة والإيصال' : 'Pending Verification')}
                </Badge>
              </div>

              {/* SCHEDULE HERO CARD: Exact Start-to-End Hours & Duration */}
              <div className="p-4 rounded-xl bg-gold-50/50 border border-gold-200/70 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-white text-amber-700 ring-1 ring-inset ring-gold-200/70 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-amber-700" />
                    </div>
                    <h4 className="font-bold text-chocolate-900 text-[15px]">
                      {isRtl ? 'جدول ومواعيد الحجز الدقيقة' : 'Exact Reservation Schedule'}
                    </h4>
                  </div>
                  <span className="inline-flex items-center h-6 px-2 rounded-full bg-amber-50 text-amber-800 font-semibold text-xs border border-amber-200/70 whitespace-nowrap">
                    {sched.durationFormatted}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Date Card */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200/70 shadow-2xs">
                    <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gold-600" />
                      {isRtl ? 'تاريخ الحجز المعتمد' : 'Booking Date'}
                    </span>
                    <p className="font-semibold text-chocolate-900 text-sm mt-1">
                      {sched.dateFormatted}
                    </p>
                    <span className="text-[11px] text-stone-400 tabular-nums">
                      {sched.rawDateStr}
                    </span>
                  </div>

                  {/* Hours Range Card */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200/70 shadow-2xs">
                    <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {isRtl ? 'فترة الحجز (من الساعة إلى الساعة)' : 'Time Slot (From – To)'}
                    </span>
                    <p className="font-semibold text-amber-900 text-sm mt-1 tabular-nums">
                      {sched.timeRangeLong}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1 tabular-nums">
                      <span>{isRtl ? 'بدء:' : 'Start:'} <strong>{sched.startTimeFormatted}</strong></span>
                      <span>{isRtl ? 'انتهاء:' : 'End:'} <strong>{sched.endTimeFormatted}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Column Info Grid: Guest & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Guest Contact Card */}
                <div className="p-4 rounded-xl border border-stone-200/70 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200/60 flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-semibold text-chocolate-900">{isRtl ? 'بيانات العميل والتواصل' : 'Guest Information'}</span>
                  </div>
                  <p className="text-sm font-semibold text-chocolate-900">{viewingBooking.customerName}</p>
                  <p className="tabular-nums text-xs text-stone-500">{viewingBooking.customerPhone}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`tel:${viewingBooking.customerPhone}`}
                      className="flex-1 h-8 px-2.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-chocolate-800 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-stone-600" />
                      <span>{isRtl ? 'اتصال مباشر' : 'Call'}</span>
                    </a>
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-200/70"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'واتساب' : 'WhatsApp'}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Room & Pricing Card */}
                <div className="p-4 rounded-xl border border-stone-200/70 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200/60 flex items-center justify-center">
                      <DoorOpen className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-semibold text-chocolate-900">{isRtl ? 'القاعة والتكلفة المالية' : 'Room & Pricing'}</span>
                  </div>
                  <p className="text-sm font-semibold text-chocolate-900">{viewingBooking.roomName}</p>
                  <div className="space-y-1 text-xs text-stone-600">
                    <div className="flex justify-between">
                      <span>{isRtl ? 'سعر الساعة:' : 'Hourly Rate:'}</span>
                      <strong className="tabular-nums font-semibold text-chocolate-900">{viewingBooking.hourlyRate} {isRtl ? 'ج.م' : 'EGP'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{isRtl ? 'إجمالي الحساب:' : 'Total Amount:'}</span>
                      <strong className="tabular-nums text-chocolate-950 text-sm font-semibold">{viewingBooking.totalPrice} {isRtl ? 'ج.م' : 'EGP'}</strong>
                    </div>
                    <div className="flex justify-between text-gold-700 font-semibold">
                      <span>{isRtl ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                      <span className="uppercase">{viewingBooking.paymentMethod}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {viewingBooking.notes && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900 text-[13px] flex items-start gap-2">
                  <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{isRtl ? 'ملاحظات ومتطلبات العميل الخاصة:' : 'Guest Special Requests:'}</span>
                    <span className="mt-0.5 block">{viewingBooking.notes}</span>
                  </div>
                </div>
              )}

              {/* Transfer Receipt Verification */}
              {viewingBooking.receiptImageUrl && (
                <div>
                  <h4 className="text-[13px] font-semibold text-chocolate-900 mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-gold-600" />
                    <span>{isRtl ? 'صورة إيصال التحويل البنكي / المحفظة الإلكترونية' : 'Bank / Wallet Transfer Receipt'}</span>
                  </h4>
                  <div className="h-56 w-full rounded-xl overflow-hidden border border-stone-200/70 bg-stone-50 relative group">
                    <img
                      src={viewingBooking.receiptImageUrl}
                      alt="Receipt"
                      className="w-full h-full object-contain p-2"
                    />
                    <a
                      href={viewingBooking.receiptImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-3 end-3 h-8 px-3 rounded-lg bg-chocolate-950/80 backdrop-blur text-white text-xs font-semibold hover:bg-chocolate-900 flex items-center gap-1.5 shadow-pop"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'فتح بالحجم الكامل' : 'Open Full Image'}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ======================================================== */}
      {/* REJECT BOOKING MODAL */}
      {/* ======================================================== */}
      {rejectingBooking && (
        <Modal
          isOpen={Boolean(rejectingBooking)}
          onClose={() => setRejectingBooking(null)}
          title={isRtl ? `رفض حجز القاعة #${rejectingBooking.bookingNumber}` : `Reject Booking #${rejectingBooking.bookingNumber}`}
          subtitle={isRtl ? 'يرجى كتابة سبب الرفض لإبلاغ العميل به' : 'Provide a reason for rejecting this booking'}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingBooking(null)}
                disabled={actionLoading}
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                loading={actionLoading}
                onClick={handleRejectBookingConfirm}
              >
                {isRtl ? 'تأكيد الرفض' : 'Confirm Rejection'}
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-sm">
            <label className="block text-[13px] font-semibold text-chocolate-900">
              {isRtl ? 'سبب رفض الحجز (ملاحظة للعميل)' : 'Rejection Reason (Note to customer)'}
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={isRtl ? "مثال: عدم وضوح إيصال التحويل، أو تعارض الموعد مع صيانة القاعة..." : "e.g. Incomplete payment transfer receipt or schedule conflict..."}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/15 outline-none transition"
              autoFocus
            />
          </div>
        </Modal>
      )}

      {/* Delete Room Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingRoom)}
        onClose={() => setDeletingRoom(null)}
        onConfirm={handleDeleteRoomConfirm}
        title={isRtl ? "حذف غرفة الاجتماعات؟" : "Delete Meeting Room?"}
        message={isRtl
          ? `هل أنت متأكد من رغبتك في حذف "${deletingRoom?.nameAr || deletingRoom?.name}"؟ سيتم حذفها نهائياً من قاعدة البيانات والتطبيق.`
          : `Are you sure you want to remove "${deletingRoom?.name}"? It will be permanently removed from mobile app catalog.`
        }
        loading={submitting}
      />

      {/* ======================================================== */}
      {/* ADD / EDIT FACILITY MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
        title={editingFacility ? (isRtl ? 'تعديل بيانات الخدمة' : 'Edit Facility') : (isRtl ? 'إضافة خدمة ومرفق جديد' : 'Add New Facility')}
        subtitle={isRtl ? 'تحديد الاسم بالعربية والإنجليزية ورقم الترتيب وأيقونة الخدمة' : 'Configure bilingual name, display order, and custom icon'}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFacilityModalOpen(false)}
              disabled={facilitySubmitting}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="gold"
              size="sm"
              icon={Save}
              loading={facilitySubmitting}
              onClick={handleSaveFacility}
            >
              {editingFacility ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة الخدمة' : 'Add Facility')}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveFacility} className="space-y-4 text-sm">
          {/* Icon Upload / Preview */}
          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'أيقونة / صورة الخدمة (اختياري)' : 'Facility Icon Image (Optional)'}
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-gold-50 ring-1 ring-inset ring-gold-200/60 overflow-hidden flex items-center justify-center shrink-0">
                {facilityForm.iconUrl ? (
                  <img
                    src={facilityForm.iconUrl}
                    alt="Icon Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-6 h-6 text-gold-600" />
                )}
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFacilityIconChange}
                  className="block w-full text-xs text-stone-500 file:me-2 file:h-8 file:px-3 file:rounded-lg file:border file:border-solid file:border-stone-200 file:text-xs file:font-semibold file:bg-white file:text-chocolate-800 hover:file:bg-stone-50 cursor-pointer"
                />
                <span className="text-xs text-stone-500 mt-1.5 block">
                  {isRtl ? 'صيغ PNG أو JPG خفيفة' : 'PNG or JPG icon'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'اسم الخدمة (بالعربية) *' : 'Facility Name (Arabic) *'}
            </label>
            <input
              type="text"
              value={facilityForm.nameAr}
              onChange={(e) => setFacilityForm({ ...facilityForm, nameAr: e.target.value })}
              placeholder="مثال: واي فاي مجاني"
              className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'اسم الخدمة (بالإنجليزية) *' : 'Facility Name (English) *'}
            </label>
            <input
              type="text"
              value={facilityForm.nameEn}
              onChange={(e) => setFacilityForm({ ...facilityForm, nameEn: e.target.value })}
              placeholder="e.g. Free Wi-Fi"
              className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-chocolate-800 mb-1.5">
              {isRtl ? 'ترتيب الظهور في التطبيق (Order)' : 'Display Order'}
            </label>
            <input
              type="number"
              min="1"
              value={facilityForm.order}
              onChange={(e) => setFacilityForm({ ...facilityForm, order: e.target.value })}
              placeholder="1"
              className="w-full h-10 px-3 rounded-xl bg-white border border-stone-200 text-sm text-chocolate-900 shadow-2xs hover:border-stone-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 outline-none transition tabular-nums"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Facility Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingFacility)}
        onClose={() => setDeletingFacility(null)}
        onConfirm={handleDeleteFacilityConfirm}
        title={isRtl ? "حذف الخدمة؟" : "Delete Facility?"}
        message={isRtl
          ? `هل أنت متأكد من رغبتك في حذف خدمة "${deletingFacility?.nameAr || deletingFacility?.name}"؟ سيتم حذفها نهائياً من التطبيق.`
          : `Are you sure you want to remove "${deletingFacility?.name}"? It will be removed from customer app.`
        }
        loading={facilitySubmitting}
      />

      {/* ======================================================== */}
      {/* ADD / EDIT TABLE MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => {
          if (!tableSubmitting) {
            setIsTableModalOpen(false);
            setTableValidationErrors({});
          }
        }}
        title={
          editingTable
            ? (isRtl ? `تعديل سعة الطاولة #${editingTable.number}` : `Edit Table #${editingTable.number}`)
            : (isRtl ? 'إضافة طاولة جديدة للصالة' : 'Add New Dining Table')
        }
        subtitle={
          editingTable
            ? (isRtl ? 'تحديث السعة الاستيعابية لضيوف الطاولة في الصالة' : 'Update guest seating capacity for this dining table')
            : (isRtl ? 'تحديد رقم الطاولة وسعة المقاعد لاستقبال طلبات الـ Dine-in' : 'Set table number and guest capacity for dine-in service')
        }
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsTableModalOpen(false);
                setTableValidationErrors({});
              }}
              disabled={tableSubmitting}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="gold"
              size="sm"
              icon={Save}
              loading={tableSubmitting}
              onClick={handleSaveTable}
            >
              {editingTable
                ? (isRtl ? 'حفظ التعديلات' : 'Save Changes')
                : (isRtl ? 'إضافة الطاولة' : 'Add Table')}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveTable} className="space-y-4 text-sm">
          {/* Info Alert */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-xl flex items-start gap-2.5">
            <Coffee className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              {isRtl
                ? 'طاولات الصالة تظهر تلقائياً في شاشة نقاط البيع ونظام الكاشير لربط الطلبات وتنظيم أماكن جلوس الضيوف.'
                : 'Dining tables automatically sync with the POS system for table assignments and dine-in orders.'}
            </p>
          </div>

          {/* Table Number Field */}
          <div>
            <label className="text-[13px] font-semibold text-chocolate-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-gold-600" />
                <span>{isRtl ? 'رقم الطاولة' : 'Table Number'} *</span>
              </span>
              {tables.length > 0 && !editingTable && (
                <span className="text-[11px] text-stone-400 font-normal tabular-nums">
                  {isRtl ? `المسجل حالياً: ${tables.map(t => t.number).join(', ')}` : `Taken: ${tables.map(t => t.number).join(', ')}`}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                disabled={Boolean(editingTable)}
                value={tableForm.number}
                onChange={(e) => {
                  setTableForm({ ...tableForm, number: e.target.value });
                  if (tableValidationErrors.number) {
                    setTableValidationErrors(prev => ({ ...prev, number: null }));
                  }
                }}
                placeholder={isRtl ? "مثال: 1" : "e.g. 1"}
                className={`w-full h-10 px-3 rounded-xl border font-medium text-sm tabular-nums outline-none shadow-2xs transition ${
                  editingTable ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-white'
                } ${
                  tableValidationErrors.number
                    ? 'border-rose-400 bg-rose-50/60 ring-4 ring-rose-400/15 text-rose-900 placeholder:text-rose-300'
                    : 'border-stone-200 hover:border-stone-300 focus:border-gold-400 text-chocolate-900 focus:ring-4 focus:ring-gold-400/15'
                }`}
                required
              />
              {tableValidationErrors.number && (
                <div className="absolute end-3 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none">
                  <AlertCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Validation Error Banner for Number */}
            {tableValidationErrors.number && (
              <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{isRtl ? 'خطأ في التحقق من رقم الطاولة:' : 'Table Number Validation Error:'}</p>
                  <p className="mt-0.5 font-medium">{tableValidationErrors.number}</p>
                </div>
              </div>
            )}
            <p className="text-xs text-stone-500 mt-1.5">
              {editingTable
                ? (isRtl ? 'رقم الطاولة ثابت. لتغيير الرقم يمكنك حذف الطاولة وإعادة إضافتها.' : 'Table number is locked. Delete and recreate to change number.')
                : (isRtl ? 'رقم صحيح موجب فريد لكل طاولة بالصالة.' : 'Unique positive integer identifier.')}
            </p>
          </div>

          {/* Capacity Field */}
          <div>
            <label className="text-[13px] font-semibold text-chocolate-800 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gold-600" />
                <span>{isRtl ? 'السعة الاستيعابية (عدد الأفراد)' : 'Seating Capacity (Guests)'} *</span>
              </span>
              <span className="text-xs font-semibold text-gold-700 tabular-nums">
                {tableForm.capacity} {isRtl ? 'أفراد' : 'Guests'}
              </span>
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={tableForm.capacity}
              onChange={(e) => {
                setTableForm({ ...tableForm, capacity: e.target.value });
                if (tableValidationErrors.capacity) {
                  setTableValidationErrors(prev => ({ ...prev, capacity: null }));
                }
              }}
              placeholder="4"
              className={`w-full h-10 px-3 rounded-xl border font-medium text-sm tabular-nums outline-none shadow-2xs transition ${
                tableValidationErrors.capacity
                  ? 'border-rose-400 bg-rose-50/60 ring-4 ring-rose-400/15 text-rose-900'
                  : 'bg-white border-stone-200 hover:border-stone-300 focus:border-gold-400 text-chocolate-900 focus:ring-4 focus:ring-gold-400/15'
              }`}
              required
            />

            {tableValidationErrors.capacity && (
              <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{tableValidationErrors.capacity}</span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="mt-3">
              <span className="text-xs font-semibold text-stone-500 block mb-1.5">
                {isRtl ? 'اختيار سريع لسعة المقاعد:' : 'Quick Select Capacity:'}
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { val: '2', labelAr: '2 مقاعد', labelEn: '2 Seats' },
                  { val: '4', labelAr: '4 مقاعد', labelEn: '4 Seats' },
                  { val: '6', labelAr: '6 مقاعد', labelEn: '6 Seats' },
                  { val: '8', labelAr: '8 مقاعد', labelEn: '8 Seats' },
                  { val: '10', labelAr: '10 مقاعد', labelEn: '10 Seats' }
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => {
                      setTableForm({ ...tableForm, capacity: preset.val });
                      if (tableValidationErrors.capacity) {
                        setTableValidationErrors(prev => ({ ...prev, capacity: null }));
                      }
                    }}
                    className={`h-8 px-1.5 rounded-lg text-xs transition-all cursor-pointer text-center tabular-nums border ${
                      String(tableForm.capacity) === preset.val
                        ? 'bg-gold-50 text-gold-900 border-gold-300 font-semibold ring-2 ring-gold-400/15'
                        : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-600 font-medium'
                    }`}
                  >
                    {isRtl ? preset.labelAr : preset.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Table Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingTable)}
        onClose={() => setDeletingTable(null)}
        onConfirm={handleDeleteTableConfirm}
        title={isRtl ? `حذف الطاولة #${deletingTable?.number}؟` : `Delete Table #${deletingTable?.number}?`}
        message={isRtl
          ? `هل أنت متأكد من حذف الطاولة رقم #${deletingTable?.number} بسعة (${deletingTable?.capacity} أفراد) من قاعدة البيانات؟`
          : `Are you sure you want to delete Table #${deletingTable?.number} (${deletingTable?.capacity} guests) from database?`}
        confirmText={isRtl ? 'نعم، احذف الطاولة' : 'Yes, Delete Table'}
        cancelText={isRtl ? 'إلغاء' : 'Cancel'}
        loading={tableSubmitting}
        variant="danger"
      />
    </div>
  );
};
