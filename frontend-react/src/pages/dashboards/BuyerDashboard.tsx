import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { propertyService } from '../../services/property.service';
import { authService } from '../../services/auth.service';
import { aiService } from '../../services/ai.service';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Map } from '../../components/shared/Map';
import { LazyIframe } from '../../components/shared/LazyIframe';
import { Button } from '../../components/ui/Button';
import { StatusBadge, Chip } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { CircularProgress } from '../../components/ui/ProgressBar';
import { CitizenAiAssistantModal } from '../../components/shared/CitizenAiAssistantModal';
import { DocumentVerificationHub } from '../../components/shared/DocumentVerificationHub';
import type { Property, PropertyVisit, AiConversation, AiMessage, Notification, PropertyImage, PropertyVideo, PropertyDocument, AiVerification } from '../../models/property.models';
import {
  Search, Calendar, MessageSquare, Bell, Map as MapIcon,
  Heart, ExternalLink, Clock, CheckCircle, Send, Plus,
  Filter, User, Settings, LogOut, ChevronRight, Home, Bookmark, 
  RefreshCw, X, Shield, Play, Video, FileText, ArrowLeft, Star, MapPin, Menu,
  Compass, Phone, Mail, Briefcase, Loader2, FileCheck, Sparkles, Award, ShieldCheck
} from 'lucide-react';
import logo from '../../assets/logo.png';
import logoText from '../../assets/logo-text.png';
import noPropertiesImg from '../../assets/no-properties.png';
import hero1 from '../../assets/hero/1.jpg';
import hero2 from '../../assets/hero/2.jpg';
import hero3 from '../../assets/hero/3.jpg';
import hero4 from '../../assets/hero/4.jpg';
import hero5 from '../../assets/hero/5.jpg';

const formatMarkdownBold = (text?: string): string => {
  if (!text) return '';
  return text.replace(/\*\*\s*(.*?)\s*\*\*/g, (_, match) => `**${match.trim()}**`);
};

const getCleanIframeUrl = (url?: string) => {
  if (!url) return '';
  let cleaned = url.trim();

  // Extract src from <iframe src="..."> if embedded as HTML snippet
  if (cleaned.toLowerCase().includes('<iframe')) {
    const match = cleaned.match(/src\s*=\s*["']([^"']+)["']/i);
    if (match && match[1]) cleaned = match[1];
  }

  // Prepend https:// if missing scheme
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }

  // Kuula formatting: convert /post/ to /share/ and add clean embed parameters
  if (cleaned.includes('kuula.co')) {
    cleaned = cleaned.replace('/post/', '/share/');
    const baseUrl = cleaned.split('?')[0];
    return `${baseUrl}?fs=1&vr=0&zoom=0&sd=0&info=0&logo=-1&thumbs=0`;
  }

  // Momento360 formatting: convert /p/ to /e/ for embeddable iframe
  if (cleaned.includes('momento360.com')) {
    if (cleaned.includes('/p/')) {
      cleaned = cleaned.replace('/p/', '/e/');
    }
    return cleaned;
  }

  // Matterport formatting
  if (cleaned.includes('matterport.com')) {
    if (!cleaned.includes('/show/')) {
      const match = cleaned.match(/m=([a-zA-Z0-9]+)/);
      if (match && match[1]) {
        return `https://my.matterport.com/show/?m=${match[1]}`;
      }
    }
  }

  return cleaned;
};

const isValidIframeUrl = (url?: string) => {
  if (!url) return false;
  const cleaned = getCleanIframeUrl(url);
  if (!cleaned) return false;
  if (cleaned.includes('example.com') || cleaned.endsWith('/share/') || cleaned.endsWith('/post/') || cleaned.endsWith('/e/')) {
    return false;
  }
  try {
    const parsed = new URL(cleaned);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && 
           parsed.hostname.includes('.') && 
           !parsed.hostname.includes('localhost') &&
           parsed.pathname.length > 3;
  } catch (e) {
    return false;
  }
};

const isDirectImage = (url?: string) => {
  if (!url) return false;
  return url.includes('cloudinary.com') || /\.(jpg|jpeg|png|webp)($|\?)/i.test(url);
};

const getFallbackPhoto = (p: Property) => {
  if (p.images && p.images.length > 0) {
    const imgUrl = p.images[0].imageUrl || p.images[0].url;
    if (imgUrl) return imgUrl;
  }
  return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80';
};

const HeroSkeleton = () => (
  <div className="relative h-[200px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-xs bg-gray-200 animate-pulse p-5 flex flex-col justify-center gap-3">
    <div className="h-6 bg-gray-300 rounded-md w-3/5" />
    <div className="h-4 bg-gray-300 rounded-md w-2/5" />
    <div className="h-9 bg-gray-300 rounded-xl w-32 mt-2" />
  </div>
);

const CategorySkeleton = () => (
  <div className="grid grid-cols-4 gap-2">
    {[0, 1, 2, 3].map(i => (
      <div key={i} className="flex flex-col items-center gap-2 w-full animate-pulse">
        <div className="w-[68px] h-[68px] rounded-2xl bg-gray-200 border border-gray-300/60" />
        <div className="h-3 bg-gray-200 rounded-md w-12" />
      </div>
    ))}
  </div>
);

const HorizontalCardSkeleton = () => (
  <div className="w-[340px] sm:w-[400px] shrink-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs animate-pulse flex flex-col aspect-video">
    <div className="h-[75%] bg-gray-200 relative" />
    <div className="h-[25%] px-3 flex flex-col justify-center gap-1.5 bg-white">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        <div className="h-4 bg-gray-200 rounded-md w-1/4" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 rounded-md w-1/3" />
        <div className="h-3 bg-gray-200 rounded-md w-1/6" />
      </div>
    </div>
  </div>
);

const VerticalCardSkeleton = () => (
  <div className="w-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs animate-pulse flex flex-col aspect-video">
    <div className="h-[75%] bg-gray-200 relative" />
    <div className="h-[25%] px-3 flex flex-col justify-center gap-1.5 bg-white">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded-md w-1/2" />
        <div className="h-4 bg-gray-200 rounded-md w-1/4" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 rounded-md w-1/3" />
        <div className="h-3 bg-gray-200 rounded-md w-1/6" />
      </div>
    </div>
  </div>
);

const ExploreCardSkeleton = () => (
  <div className="break-inside-avoid relative h-[240px] w-full rounded-2xl overflow-hidden shadow-xs border border-gray-200 bg-white animate-pulse flex flex-col mb-4">
    <div className="h-[70%] bg-gray-200" />
    <div className="h-[30%] p-3 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="h-4 bg-gray-200 rounded-md w-3/4" />
        <div className="h-3 bg-gray-200 rounded-md w-1/2" />
      </div>
    </div>
  </div>
);

const VisitSkeletonCard = () => (
  <div className="shadow-xs border border-gray-200 rounded-2xl p-4 flex gap-3.5 items-center bg-white animate-pulse">
    <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded-md w-3/4" />
      <div className="h-3 bg-gray-200 rounded-md w-1/2" />
    </div>
    <div className="w-20 h-7 bg-gray-200 rounded-full shrink-0" />
  </div>
);

const calculateEmiUnder20k = (pOrPrice: Property | number): number => {
  let price = typeof pOrPrice === 'number' ? pOrPrice : (pOrPrice?.price || 45000);
  const identifier = typeof pOrPrice === 'object' && pOrPrice ? `${pOrPrice.id || pOrPrice.title || pOrPrice.surveyNumber || price}` : `${price}`;
  
  if (!price || isNaN(price)) price = 45000;

  // Compute a deterministic unique hash per property
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  // Dynamic percentage between 7.0% and 9.8%
  const rate = 0.070 + ((seed % 29) / 1000);

  if (price <= 60000) {
    const rawEmi = Math.round(price * rate);
    return Math.max(1200, Math.min(rawEmi, 19500));
  }

  // Generate distinct realistic EMI rates across cards (strictly under 20,000)
  const baseRange = 4000 + (seed % 14500);
  const roundOffset = (seed % 19) * 50;
  const finalEmi = Math.min(baseRange + roundOffset, 19800);

  return finalEmi;
};

const MobilePropertyCard = ({ p, vertical = false, isHidden = false, onScheduleVisit }: { p: Property, vertical?: boolean, isHidden?: boolean, onScheduleVisit?: (p: Property) => void }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/properties/${p.id}`)}
      className={`relative bg-white shadow-md border border-gray-200 rounded-2xl overflow-hidden shrink-0 flex ${vertical ? 'flex-col w-full aspect-video' : 'flex-col w-[340px] sm:w-[400px] aspect-video'} cursor-pointer !p-0 ${isHidden ? 'hidden' : ''}`}
    >
      <div className="relative h-[75%] bg-gray-100 overflow-hidden shrink-0">
        {/* 360 View or Direct Image */}
        {isDirectImage(p.threeSixtyImageUrl) ? (
          <img
            src={p.threeSixtyImageUrl}
            alt={p.title}
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'; }}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : isValidIframeUrl(p.threeSixtyImageUrl) ? (
          <LazyIframe
            src={getCleanIframeUrl(p.threeSixtyImageUrl)}
            fallbackImageSrc={p.images?.[0]?.imageUrl || p.images?.[0]?.url}
            alt={p.title}
            label="360° LIVE"
          />
        ) : (
          <img
            src={p.images?.[0]?.imageUrl || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'}
            alt={p.title}
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'; }}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        
        {/* Schedule Visit Button Overlay */}
        {onScheduleVisit && (
          <button
            onClick={(e) => { e.stopPropagation(); onScheduleVisit(p); }}
            className="absolute top-2 left-2 z-20 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
            title="Schedule Property Visit"
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule Visit
          </button>
        )}

        {/* Verified Badge - Top Right Corner */}
        {p.status === 'APPROVED' && (
          <div className="absolute top-0 right-0 bg-emerald-500 text-black px-3 py-1 rounded-bl-xl z-10 shadow-sm">
             <span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
          </div>
        )}

        {/* Category Badge - Bottom Left Corner */}
        <div className="absolute bottom-0 left-0 bg-white text-gray-900 px-4 py-1 rounded-tr-xl z-10 shadow-sm border-t border-r border-gray-200">
             <span className="text-[10px] font-black uppercase tracking-wider">{p.category}</span>
        </div>
      </div>
      <div className="h-[25%] px-3 flex flex-col justify-center bg-white z-20">
        <div className="flex items-center justify-between gap-1">
           <h3 className="text-gray-900 font-bold text-sm truncate pr-1">{p.title}</h3>
           <p className="text-emerald-700 font-extrabold text-xs sm:text-sm shrink-0 whitespace-nowrap">
             ₹{calculateEmiUnder20k(p).toLocaleString('en-IN')}<span className="text-[10px] font-semibold text-gray-500 ml-0.5">/month EMI</span>
           </p>
        </div>
        <div className="flex items-center justify-between mt-0.5">
           <p className="text-gray-500 text-[10px] flex items-center gap-1 truncate"><MapPin className="w-2.5 h-2.5 shrink-0"/> {p.village}, {p.district}</p>
           <p className="text-gray-400 text-[10px] font-semibold shrink-0">{p.area} acres</p>
        </div>
      </div>
    </div>
  );
};

export const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [viewTab, setViewTab] = useState<'home' | 'explore' | 'map' | 'chat' | 'wishlist' | 'schedule' | 'settings' | 'verify'>('home');
  const [listMode, setListMode] = useState<'list' | 'map'>('list');

  const [properties, setProperties] = useState<Property[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Schedule Visit bottom sheet states
  const [schedulingProperty, setSchedulingProperty] = useState<Property | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('10:00');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  const handleConfirmSchedule = async () => {
    if (!schedulingProperty || !scheduleDate || !scheduleTime) return;
    setScheduleLoading(true);
    try {
      const newVisit = await propertyService.scheduleVisit(schedulingProperty.id, {
        visitDate: scheduleDate,
        visitTime: scheduleTime
      }, schedulingProperty);
      setVisits(prev => [newVisit, ...prev.filter(v => v.id !== newVisit.id)]);
      setScheduleSuccess(`Site visit scheduled for "${schedulingProperty.title}" on ${scheduleDate} at ${scheduleTime}!`);
      setSchedulingProperty(null);
      await loadVisits();
    } catch (err: any) {
      alert("Failed to schedule visit: " + (err?.response?.data?.message || err?.message || "Unknown error"));
    } finally {
      setScheduleLoading(false);
    }
  };
;

  // Detail panel states
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<{ state: string; district: string; category: string }>({ state: '', district: '', category: '' });
  const [exploreCategory, setExploreCategory] = useState<string>('');
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [viewTab, filters.category]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Smart hiding disabled as per user request
    setIsNavVisible(true);
  };

  const heroSlides = [
    { title: 'AI-Powered Insights', subtitle: 'Get smart recommendations and answers for your land queries.', cta: 'Ask AI', image: hero1 },
    { title: 'Explore in 360°', subtitle: 'Experience properties virtually with our immersive LandLense technology.', cta: 'View 360°', image: hero2 },
    { title: 'Build Your Future', subtitle: 'Find the perfect plots for your next big construction project.', cta: 'Start Building', image: hero3 },
    { title: 'Interactive Mapping', subtitle: 'Discover properties easily with our advanced interactive map.', cta: 'Open Map', image: hero4 },
    { title: 'Secure & Verified', subtitle: 'Invest with confidence in 100% verified properties and clear titles.', cta: 'View Verified', image: hero5 }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIndex(prev => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (isChatOpen) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiThinking, isChatOpen]);
  
  const currentUser = authService.currentUser();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const userLocRef = useRef<{lat: number, lng: number} | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const sortPropertiesByLocation = (props: Property[], loc: { lat: number, lng: number }) => {
    return [...props].sort((a, b) => {
      const distA = Math.hypot(a.latitude - loc.lat, a.longitude - loc.lng);
      const distB = Math.hypot(b.latitude - loc.lat, b.longitude - loc.lng);
      return distA - distB;
    });
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          userLocRef.current = loc;
          setUserLocation(loc);
          setProperties(prev => prev.length > 0 ? sortPropertiesByLocation(prev, loc) : prev);
        },
        (error) => console.error("Error getting location", error)
      );
    }
    loadData(filters); loadBookmarks(); loadVisits(); loadNotifications();
  }, []);

  const loadData = async (currentFilters: any) => {
    if (properties.length === 0) setLoading(true);
    try {
      const { category, ...backendFilters } = currentFilters;
      let res = await propertyService.getProperties({ ...backendFilters, status: 'APPROVED' });
      // Filter out Google Street View and direct manual image upload properties
      res = res.filter(p => 
        !p.threeSixtyImageUrl?.toLowerCase().includes('google.com') && 
        !p.threeSixtyImageUrl?.toLowerCase().includes('google.co.in') &&
        !isDirectImage(p.threeSixtyImageUrl)
      );
      if (userLocRef.current) res = sortPropertiesByLocation(res, userLocRef.current);
      setProperties(res);
    } catch {} finally { setLoading(false); }
  };

  const filteredProperties = properties.filter(p => 
    (!filters.category || p.category?.toUpperCase() === filters.category?.toUpperCase()) &&
    (!p.threeSixtyImageUrl || (!p.threeSixtyImageUrl.toLowerCase().includes('google.com') && !p.threeSixtyImageUrl.toLowerCase().includes('google.co.in') && !isDirectImage(p.threeSixtyImageUrl)))
  );

  const exploreProperties = properties.filter(p => 
    (!exploreCategory || p.category?.toUpperCase() === exploreCategory.toUpperCase()) &&
    (!p.threeSixtyImageUrl || (!p.threeSixtyImageUrl.toLowerCase().includes('google.com') && !p.threeSixtyImageUrl.toLowerCase().includes('google.co.in') && !isDirectImage(p.threeSixtyImageUrl)))
  );

  const handleCategoryClick = (categoryId: string) => {
    const newCategory = filters.category === categoryId ? '' : categoryId;
    setFilters(prev => ({ ...prev, category: newCategory }));
  };

  const loadBookmarks = async () => {
    try {
      const res = await propertyService.getSavedProperties();
      setSavedProperties(res);
      setBookmarkIds(new Set(res.map(p => p.id)));
    } catch {}
  };

  const [visitsLoading, setVisitsLoading] = useState(true);

  const loadVisits = async () => {
    setVisitsLoading(true);
    try { setVisits(await propertyService.getVisits()); } catch {}
    finally { setVisitsLoading(false); }
  };

  const loadNotifications = async () => {
    try { setNotifications(await propertyService.getNotifications()); } catch {}
  };

  const isBookmarked = (id: string) => bookmarkIds.has(id);

  const toggleBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      isBookmarked(id) ? await propertyService.unsaveProperty(id) : await propertyService.saveProperty(id);
      loadBookmarks();
    } catch {}
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/auth/login');
  };

  const loadConversations = async () => {
    try {
      const res = await propertyService.getAiConversations();
      setConversations(res);
      if (res.length > 0 && !selectedConvoId) selectConversation(res[0].id);
    } catch {}
  };

  const selectConversation = async (id: string) => {
    setSelectedConvoId(id);
    try { setMessages(await propertyService.getAiMessages(id)); } catch {}
  };

  const createNewChat = async (topicSuggestion?: string) => {
    const title = typeof topicSuggestion === 'string' && topicSuggestion.trim() 
      ? topicSuggestion.trim() 
      : `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    try {
      const res = await propertyService.startAiConversation(title);
      loadConversations();
      setSelectedConvoId(res.id);
      setMessages([]);
    } catch {
      setSelectedConvoId(`local-${Date.now()}`);
      setMessages([]);
    }
  };

  const [aiVisitDate, setAiVisitDate] = useState('');
  const [aiVisitTime, setAiVisitTime] = useState('10:30');
  const [aiVisitLoading, setAiVisitLoading] = useState(false);

  const getLocalSmartResponse = (query: string): {
    content: string;
    actionButtons?: AiMessage['actionButtons'];
    matchedProperties?: Property[];
    isScheduleForm?: boolean;
  } => {
    const q = query.toLowerCase();

    // 1. Agricultural query
    if (q.includes('agri') || q.includes('farm') || q.includes('crop') || q.includes('land')) {
      const matched = properties.filter(p => (p.category || '').toUpperCase() === 'AGRICULTURAL');
      const list = matched.length > 0 ? matched.slice(0, 4) : properties.slice(0, 4);
      return {
        content: `🌾 **Found ${list.length} Verified Agricultural Properties in LandLens:**\n\n${list.map(p => `• **${p.title.trim()}**\n  📍 Location: ${p.village || p.district}, ${p.district}\n  📐 Area: ${p.area} Acres | 💰 Price: ₹${(p.price / 100000).toFixed(1)} Lakhs\n  🛡️ Legal Status: Government Title Verified`).join('\n\n')}\n\nClick any property card below to view details, inspect 360° virtual tours, or schedule a site visit!`,
        actionButtons: [
          { label: '📅 Schedule Site Visit', type: 'schedule' },
          { label: '📍 View on Map', type: 'map' },
          { label: '📞 Call Seller', type: 'call', value: list[0]?.provider?.phoneNumber || '+91 98480 12345' },
          { label: '✉️ Email Seller', type: 'email', value: list[0]?.provider?.email || 'seller@landlens.com' }
        ],
        matchedProperties: list
      };
    }

    // 2. Residential query
    if (q.includes('residen') || q.includes('house') || q.includes('home') || q.includes('plot')) {
      const matched = properties.filter(p => (p.category || '').toUpperCase() === 'RESIDENTIAL');
      const list = matched.length > 0 ? matched.slice(0, 4) : properties.slice(0, 4);
      return {
        content: `🏡 **Found ${list.length} Verified Residential Properties in LandLens:**\n\n${list.map(p => `• **${p.title.trim()}**\n  📍 Location: ${p.village || p.district}, ${p.district}\n  📐 Area: ${p.area} Acres | 💰 Price: ₹${(p.price / 100000).toFixed(1)} Lakhs`).join('\n\n')}\n\nSelect a property below or click **Schedule Site Visit**!`,
        actionButtons: [
          { label: '📅 Schedule Site Visit', type: 'schedule' },
          { label: '📍 View on Map', type: 'map' }
        ],
        matchedProperties: list
      };
    }

    // 3. Commercial query
    if (q.includes('commer') || q.includes('shop') || q.includes('office')) {
      const matched = properties.filter(p => (p.category || '').toUpperCase() === 'COMMERCIAL');
      const list = matched.length > 0 ? matched.slice(0, 4) : properties.slice(0, 4);
      return {
        content: `🏢 **Found ${list.length} Verified Commercial Properties in LandLens:**\n\n${list.map(p => `• **${p.title.trim()}**\n  📍 Location: ${p.village || p.district}, ${p.district}\n  📐 Area: ${p.area} Acres | 💰 Price: ₹${(p.price / 100000).toFixed(1)} Lakhs`).join('\n\n')}`,
        actionButtons: [
          { label: '📅 Schedule Site Visit', type: 'schedule' },
          { label: '📍 View on Map', type: 'map' }
        ],
        matchedProperties: list
      };
    }

    // 4. Industrial query
    if (q.includes('indust') || q.includes('factory')) {
      const matched = properties.filter(p => (p.category || '').toUpperCase() === 'INDUSTRIAL');
      const list = matched.length > 0 ? matched.slice(0, 4) : properties.slice(0, 4);
      return {
        content: `🏭 **Found ${list.length} Verified Industrial Properties in LandLens:**\n\n${list.map(p => `• **${p.title.trim()}**\n  📍 Location: ${p.village || p.district}, ${p.district}\n  📐 Area: ${p.area} Acres | 💰 Price: ₹${(p.price / 100000).toFixed(1)} Lakhs`).join('\n\n')}`,
        actionButtons: [
          { label: '📅 Schedule Site Visit', type: 'schedule' },
          { label: '📍 View on Map', type: 'map' }
        ],
        matchedProperties: list
      };
    }

    // 5. Generic property search queries
    if (q.includes('list') || q.includes('all') || q.includes('show') || q.includes('search') || q.includes('available') || q.includes('property') || q.includes('properties')) {
      const list = properties.slice(0, 4);
      return {
        content: `✨ **Here are top verified available properties in LandLens:**\n\n${list.map(p => `• **${p.title.trim()}** (${p.category})\n  📍 Location: ${p.village || p.district}, ${p.district}\n  📐 Area: ${p.area} Acres | 💰 Price: ₹${(p.price / 100000).toFixed(1)} Lakhs`).join('\n\n')}\n\nClick any property card below or use the action buttons to schedule a visit or contact the seller!`,
        actionButtons: [
          { label: '📅 Schedule Site Visit', type: 'schedule' },
          { label: '📍 View on Map', type: 'map' },
          { label: '📞 Call Seller', type: 'call', value: '+91 98480 12345' }
        ],
        matchedProperties: list
      };
    }

    // 6. Schedule / Visit queries
    if (q.includes('visit') || q.includes('schedule') || q.includes('book') || q.includes('see')) {
      return {
        content: "To schedule a site visit for any verified parcel, select your preferred date & time below and click **Confirm Site Visit Booking**! Your visit request will be sent to the seller immediately.",
        actionButtons: [{ label: '📅 Schedule Site Visit', type: 'schedule' }],
        isScheduleForm: true
      };
    }

    // 7. Contact / Owner queries
    if (q.includes('owner') || q.includes('seller') || q.includes('who owns') || q.includes('contact') || q.includes('phone') || q.includes('email') || q.includes('number') || q.includes('call')) {
      return {
        content: "Direct seller contact options are available below for verified properties! Feel free to call or email the landowner directly, or schedule an upcoming site visit.",
        actionButtons: [
          { label: '📞 Call Seller', type: 'call', value: '+91 98480 12345' },
          { label: '✉️ Email Seller', type: 'email', value: 'seller@landlens.com' },
          { label: '📅 Schedule Site Visit', type: 'schedule' }
        ]
      };
    }

    // 8. Greeting queries
    if (q.includes('who are you') || q.includes('what are you') || q.includes('your name') || q.includes('hi') || q.includes('hello') || q.includes('hey')) {
      return {
        content: "Hello! 👋 I am **LandLens AI**, your virtual real estate assistant. I can help you search verified land parcels, check market rates, inspect 360° virtual tours, and schedule site visits. How can I help you today?",
        actionButtons: [
          { label: '🌾 Browse Agricultural Land', type: 'search_agri' },
          { label: '🏡 Browse Residential Plots', type: 'search_res' },
          { label: '📅 Schedule Site Visit', type: 'schedule' }
        ]
      };
    }

    // Default fallback with top properties
    const list = properties.slice(0, 3);
    return {
      content: `I am here to assist you with property searches, legal verification, market pricing, and scheduling site visits! 😊\n\nHere are top recommended verified properties:`,
      actionButtons: [
        { label: '📅 Schedule Site Visit', type: 'schedule' },
        { label: '📍 View on Map', type: 'map' }
      ],
      matchedProperties: list
    };
  };

  const handleAiActionButtonClick = (btn: any, msg: AiMessage) => {
    if (btn.type === 'call') {
      window.open(`tel:${btn.value || '+919848012345'}`);
    } else if (btn.type === 'email') {
      window.open(`mailto:${btn.value || 'seller@landlens.com'}`);
    } else if (btn.type === 'map') {
      setIsChatOpen(false);
      setViewTab('map');
    } else if (btn.type === 'schedule') {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isScheduleForm: true } : m));
    } else if (btn.type === 'search_agri') {
      setChatInput('list all available agricultural properties');
    } else if (btn.type === 'search_res') {
      setChatInput('list all available residential properties');
    }
  };

  const handleConfirmAiScheduleVisit = async (msgId: string) => {
    if (!aiVisitDate || !aiVisitTime) return;
    setAiVisitLoading(true);
    try {
      const targetProp = properties[0];
      if (targetProp) {
        const newVisit = await propertyService.scheduleVisit(targetProp.id, { visitDate: aiVisitDate, visitTime: aiVisitTime + ':00' }, targetProp);
        setVisits(prev => [newVisit, ...prev.filter(v => v.id !== newVisit.id)]);
      }
      const confirmMsg: AiMessage = {
        id: `ai-confirm-${Date.now()}`,
        conversationId: selectedConvoId || 'main',
        senderRole: 'AI',
        content: `🎉 **Site Visit Successfully Scheduled!**\n\n• 📅 **Date**: ${aiVisitDate}\n• ⏰ **Time**: ${aiVisitTime}\n• 📍 **Status**: Confirmed & Sent to Seller\n\nSeller contact details are unlocked below! Feel free to call or email the landowner directly.`,
        timestamp: new Date().toISOString(),
        isActive: true,
        actionButtons: [
          { label: '📞 Call Seller', type: 'call', value: '+91 98480 12345' },
          { label: '✉️ Email Seller', type: 'email', value: 'seller@landlens.com' }
        ]
      };
      setMessages(prev => [...prev.map(m => m.id === msgId ? { ...m, isScheduleForm: false } : m), confirmMsg]);
    } catch (e) {
      console.error("Schedule visit error:", e);
    } finally {
      setAiVisitLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');

    let convoId = selectedConvoId;
    if (!convoId) {
      try {
        const newConvo = await propertyService.startAiConversation('Land Query Assistant');
        convoId = newConvo.id;
        setSelectedConvoId(convoId);
        setConversations(prev => [newConvo, ...prev]);
      } catch (e) {
        console.error("Failed to auto-create conversation", e);
        return;
      }
    }

    const opt: AiMessage = { 
      id: `user-${Date.now()}`, 
      conversationId: convoId, 
      senderRole: 'USER', 
      content: text, 
      timestamp: new Date().toISOString(), 
      isActive: true 
    };
    setMessages(prev => [...prev, opt]);
    setIsAiThinking(true);

    const smartData = getLocalSmartResponse(text);
    const chatHistoryPayload = messages.slice(-10).map(m => ({
      role: (m.senderRole === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content
    }));

    try { 
      const responseText = await aiService.generateResponse(text, undefined, chatHistoryPayload, convoId);
      const reply: AiMessage = {
        id: `ai-${Date.now()}`,
        conversationId: convoId,
        senderRole: 'AI',
        content: responseText || smartData.content,
        timestamp: new Date().toISOString(),
        isActive: true,
        actionButtons: smartData.actionButtons,
        matchedProperties: smartData.matchedProperties,
        isScheduleForm: smartData.isScheduleForm
      };
      setMessages(prev => [...prev, reply]);
    } catch (e) {
      console.warn("Direct Frontend AI generation failed, using smart engine:", e);
      const smartReply: AiMessage = {
        id: `ai-smart-${Date.now()}`,
        conversationId: convoId,
        senderRole: 'AI',
        content: smartData.content,
        timestamp: new Date().toISOString(),
        isActive: true,
        actionButtons: smartData.actionButtons,
        matchedProperties: smartData.matchedProperties,
        isScheduleForm: smartData.isScheduleForm
      };
      setMessages(prev => [...prev, smartReply]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleTabChange = (tab: typeof viewTab) => {
    setViewTab(tab);
  };



  return (
    <div className="relative h-screen bg-gray-50 flex flex-col overflow-hidden text-gray-900 font-sans">
      
      {/* ── APP BAR ── */}
      <div 
        style={{ borderBottomLeftRadius: '25px', borderBottomRightRadius: '25px' }}
        className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-40 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <img src={logo} alt="LandLense Logo" className="h-8 w-auto object-contain" />
          <img src={logoText} alt="LandLense" className="h-6 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setIsNotificationSidebarOpen(true)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-gray-200">
              <Bell className="w-4 h-4 text-gray-600" />
            </button>
            {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-danger-500 border-2 border-white rounded-full" />}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-gray-200 shadow-sm"
            >
              <User className="w-4 h-4 text-gray-600" />
            </button>
            
            <AnimatePresence>
              {isProfileMenuOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/20" 
                    onClick={() => setIsProfileMenuOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Signed in as</p>
                      <p className="text-gray-900 text-sm font-semibold truncate">{currentUser?.firstName || 'Explorer'}</p>
                    </div>
                    <div className="py-2">
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" /> Profile
                      </button>
                      <button 
                        onClick={() => { authService.logout(); navigate('/login'); }}
                        className="w-full px-4 py-2 text-left text-sm text-danger-500 hover:bg-danger-500/10 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Log out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div ref={mainContentRef} onScroll={handleScroll} className={`flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide ${viewTab === 'map' ? 'pt-0 pb-0' : 'pt-[68px] pb-20'}`}>
        <div className="relative w-full h-full">
          {/* ── HOME TAB ── */}
          <div className={viewTab === 'home' ? 'block pb-8' : 'hidden'}>
              
              {/* Hero Slider Section */}
              <div className="px-4 pt-6 pb-2 bg-gray-50 relative overflow-hidden">
                {loading ? (
                  <HeroSkeleton />
                ) : (
                  <div className="relative h-[200px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={heroSlideIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 flex items-center justify-between"
                      >
                         <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
                           <img src={heroSlides[heroSlideIndex].image} alt="Hero Illustration" className="w-full h-full object-contain object-right" />
                           <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
                           <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
                           <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-white via-white/90 to-transparent z-10 pointer-events-none" />
                         </div>
                         
                         <div className="w-full h-full flex flex-col justify-center relative z-10 p-5 pointer-events-none">
                            <h1 className="text-xl font-bold text-slate-900 mb-2 leading-tight max-w-[60%]">{heroSlides[heroSlideIndex].title}</h1>
                            <p className="text-emerald-600 text-[10.5px] mb-4 max-w-[55%] font-bold leading-relaxed">{heroSlides[heroSlideIndex].subtitle}</p>
                            <button className="pointer-events-auto group relative overflow-hidden bg-blue-900 text-blue-50 text-[11px] font-bold px-5 py-2.5 rounded-xl w-max transition-all duration-300 hover:bg-blue-800 active:scale-95 flex items-center gap-2 shadow-sm shadow-blue-900/20">
                              <span className="relative z-10">{heroSlides[heroSlideIndex].cta}</span>
                              <ChevronRight className="w-3.5 h-3.5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                            </button>
                         </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* ── LANDLENS DUAL-LAYER VERIFICATION HUB BANNER ── */}
              <div className="px-4 mb-6">
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg border border-indigo-700/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                          Major Project 2-Stage Verification
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mt-1">
                        Document AI Cross-Check & Original Owner Verification
                      </h3>
                      <p className="text-xs text-blue-200/80 leading-relaxed">
                        Verify property documents against government ledgers and confirm authorization directly with the genuine registered owner.
                      </p>
                    </div>

                    <button
                      onClick={() => setViewTab('verify')}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-blue-500/30 active:scale-95 transition cursor-pointer"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Launch Verification Hub</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="px-4 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900">Categories</h2>
                </div>
                {loading ? (
                  <CategorySkeleton />
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'AGRICULTURAL', label: 'Agricultural', image: 'https://i.ibb.co/60v5FYDV/AGRI.png' },
                      { id: 'RESIDENTIAL', label: 'Residential', image: 'https://i.ibb.co/PsHG0SXN/HOME.png' },
                      { id: 'COMMERCIAL', label: 'Commercial', image: 'https://i.ibb.co/5WJXZKxf/comersial.png' },
                      { id: 'INDUSTRIAL', label: 'Industrial', image: 'https://i.ibb.co/jkmhLV7J/INDUSTRY.png' },
                    ].map(cat => {
                      const isActive = filters.category === cat.id;
                      return (
                        <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className="flex flex-col items-center gap-3 w-full">
                          <div className={`flex items-center justify-center transition-all duration-300 active:scale-95 mx-auto ${isActive ? 'scale-110 drop-shadow-[0_0_4px_rgba(0,0,0,1)]' : 'opacity-80'}`}>
                             <img 
                               src={cat.image} 
                               alt={cat.label} 
                               onError={(e) => { e.currentTarget.src = 'https://i.ibb.co/PsHG0SXN/HOME.png'; }}
                               className="w-[68px] h-[68px] object-contain transition-transform" 
                             />
                          </div>
                          <span className={`text-[10.5px] font-bold text-center leading-tight break-words w-full transition-colors ${isActive ? 'text-black' : 'text-gray-500'}`}>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Latest Added Properties */}
              <div className="mb-8">
                <div className="px-4 flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900">Latest Additions</h2>
                  <button className="text-xs font-semibold text-primary-600 flex items-center">See All <ChevronRight className="w-3 h-3 ml-0.5" /></button>
                </div>
                {loading ? (
                  <div className="flex gap-4 overflow-x-auto px-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[0,1,2].map(i => <HorizontalCardSkeleton key={i} />)}
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto px-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filteredProperties.slice(0, 5).map(p => (
                      <MobilePropertyCard key={p.id} p={p} />
                    ))}
                  </div>
                )}
                {!loading && filteredProperties.length === 0 && (
                  <div className="py-8 flex flex-col items-center justify-center text-center px-4">
                    <img src={noPropertiesImg} alt="No properties found" className="w-64 h-auto object-contain drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                    <p className="text-gray-500 text-xs mt-2 font-medium">No properties found in this category.</p>
                  </div>
                )}
              </div>

              {/* Top Rated Properties */}
              {loading ? (
                <div className="mb-4">
                  <div className="px-4 flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500 fill-amber-500"/> Top Verified</h2>
                  </div>
                  <div className="px-4 flex flex-col gap-4">
                    {[0,1,2].map(i => <VerticalCardSkeleton key={i} />)}
                  </div>
                </div>
              ) : filteredProperties.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500 fill-amber-500"/> Top Verified</h2>
                    <button className="text-xs font-semibold text-primary-600 flex items-center">See All <ChevronRight className="w-3 h-3 ml-0.5" /></button>
                  </div>
                  <div className="px-4 flex flex-col gap-4">
                     {(filters.category ? filteredProperties : (filteredProperties.length > 5 ? filteredProperties.slice(5, 10) : filteredProperties.slice(0, 5))).map(p => (
                       <MobilePropertyCard key={`top-${p.id}`} p={p} vertical={true} />
                     ))}
                  </div>
                </div>
              )}

              {/* 50px bottom gap below Home Page content */}
              <div className="h-[50px] w-full shrink-0" />
            </div>

          {/* ── MAP TAB ── */}
          <div className={viewTab === 'map' ? 'block h-full w-full absolute inset-0' : 'hidden'}>
            <div className="h-full w-full relative">
              <Map 
                mode="view" 
                properties={properties.filter(p => !mapSearchQuery.trim() || p.title?.toLowerCase().includes(mapSearchQuery.toLowerCase()) || p.district?.toLowerCase().includes(mapSearchQuery.toLowerCase()) || p.village?.toLowerCase().includes(mapSearchQuery.toLowerCase()))} 
                onLocationSelected={() => {}} 
                onScheduleVisit={(p) => {
                  setSchedulingProperty(p);
                  setScheduleDate('');
                  setScheduleTime('10:00');
                }}
                className="!rounded-none !border-none w-full h-full" 
              />
              
              {/* Search overlay */}
              <div className="absolute top-[84px] left-4 bg-white rounded-full border border-gray-200 px-4 py-3 flex items-center gap-3 shadow-md w-[80vw] max-w-[350px] z-30">
                <Search className="w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={mapSearchQuery}
                  onChange={e => setMapSearchQuery(e.target.value)}
                  placeholder="Search location or survey..." 
                  className="bg-transparent text-sm text-gray-900 w-full outline-none font-medium" 
                />
              </div>
            </div>
          </div>

          {/* ── WISHLIST TAB ── */}
          <div className={viewTab === 'wishlist' ? 'block p-4 space-y-4' : 'hidden'}>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Saved Properties</h1>
              {savedProperties.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {savedProperties.map(p => <MobilePropertyCard key={p.id} p={p} vertical={true} />)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bookmark className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">Your wishlist is empty</h3>
                  <p className="text-gray-500 text-sm">Save properties you love to view them later.</p>
                </div>
              )}
            </div>

          {/* ── SCHEDULE TAB (Visits) ── */}
          <div className={viewTab === 'schedule' ? 'block p-4 space-y-4' : 'hidden'}>
            <h1 className="text-xl font-bold text-gray-900 mb-2">My Schedule</h1>
              {visitsLoading ? (
                <div className="flex flex-col gap-4">
                  {[0, 1, 2, 3].map(i => <VisitSkeletonCard key={i} />)}
                </div>
              ) : visits.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {visits.map(v => {
                    const isApproved = v.status === 'CONFIRMED';
                    const isDeclined = v.status === 'CANCELLED' || v.status === 'REJECTED';

                    // Parse visit date safely without timezone shift
                    const dateParts = (v.visitDate || '').split('-');
                    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    let displayMonth = 'VISIT';
                    let displayDay: string | number = '--';
                    if (dateParts.length === 3) {
                      const mIdx = parseInt(dateParts[1], 10) - 1;
                      displayMonth = monthNames[mIdx] || 'VISIT';
                      displayDay = parseInt(dateParts[2], 10) || '--';
                    } else if (v.visitDate) {
                      const d = new Date(v.visitDate);
                      if (!isNaN(d.getTime())) {
                        displayMonth = d.toLocaleString('default', { month: 'short' }).toUpperCase();
                        displayDay = d.getDate();
                      }
                    }

                    const matchedProp = v.property?.title ? v.property : properties.find(p => p.id === (v as any).propertyId || p.id === v.property?.id) || v.property;
                    const propTitle = matchedProp?.title || (v as any).propertyTitle || 'Vineyard Estate';

                    return (
                      <div key={v.id} className={`shadow-sm border rounded-2xl p-4 flex gap-3.5 items-center transition-all ${
                        isApproved ? 'bg-emerald-50/40 border-emerald-200' : isDeclined ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-gray-200'
                      }`}>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] text-blue-600 font-bold uppercase">{displayMonth}</span>
                          <span className="text-sm text-gray-900 font-bold">{displayDay}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{propTitle}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><Clock className="w-3 h-3 text-gray-400"/> {v.visitTime || '10:00'}</p>
                        </div>

                        {isApproved ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${matchedProp?.provider?.phoneNumber || '+91 98765 43210'}`} 
                              title="Call Seller"
                              className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-colors shadow-sm"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                            <a 
                              href={`mailto:${matchedProp?.provider?.email || 'seller@gmail.com'}`} 
                              title="Email Seller"
                              className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors shadow-sm"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                          </div>
                        ) : isDeclined ? (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-rose-200 shrink-0">
                            Declined
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-amber-200 shrink-0">
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" /> Pending Approval
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Calendar className="w-12 h-12 text-gray-800 mb-4" />
                  <h3 className="text-gray-900 font-semibold text-lg mb-1">No upcoming visits</h3>
                  <p className="text-gray-500 text-sm">Schedule a site visit to view properties.</p>
                </div>
              )}
            </div>

          {/* ── SETTINGS TAB ── */}
          <div className={viewTab === 'settings' ? 'block p-4' : 'hidden'}>
            <h1 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h1>
              
              <div className="bg-white shadow-sm border border-gray-200 rounded-2xl p-4 mb-6">
                 <h2 className="text-gray-900 font-bold text-lg leading-tight">{currentUser?.firstName} {currentUser?.lastName}</h2>
                 <p className="text-gray-500 text-sm leading-tight">{currentUser?.email}</p>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Account Details</h3>
                
                {currentUser?.email && (
                  <div className="w-full p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 text-left">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Email Address</p>
                      <p className="text-sm font-semibold text-gray-900">{currentUser.email}</p>
                    </div>
                  </div>
                )}
                
                {currentUser?.phoneNumber && (
                  <div className="w-full p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 text-left">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Phone Number</p>
                      <p className="text-sm font-semibold text-gray-900">{currentUser.phoneNumber}</p>
                    </div>
                  </div>
                )}
                
                {currentUser?.role && (
                  <div className="w-full p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 text-left">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Account Role</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{currentUser.role.toLowerCase()}</p>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleLogout} className="w-full mt-8 p-4 rounded-2xl bg-danger-500/10 border border-danger-500/20 text-danger-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-danger-500/20 transition-colors">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>

          {/* ── EXPLORE TAB ── */}
          <div className={viewTab === 'explore' ? 'block p-4 pb-28' : 'hidden'}>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Explore</h1>
                <span className="text-xs text-gray-500 font-semibold">{exploreProperties.length} Properties</span>
              </div>

              {/* Independent Explore Category Filter Bar */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                {[
                  { id: '', label: 'All' },
                  { id: 'AGRICULTURAL', label: 'Agricultural' },
                  { id: 'RESIDENTIAL', label: 'Residential' },
                  { id: 'COMMERCIAL', label: 'Commercial' },
                  { id: 'INDUSTRIAL', label: 'Industrial' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setExploreCategory(prev => prev === cat.id ? '' : cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all shadow-sm ${
                      exploreCategory === cat.id
                        ? 'bg-blue-600 text-gray-900 shadow-blue-600/30'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Multi-Size Dynamic Layout Grid with Gaps */}
              {loading ? (
                <div className="columns-2 gap-4 space-y-4">
                  {[0, 1, 2, 3, 4, 5].map(i => <ExploreCardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="columns-2 gap-4 space-y-4">
                  {exploreProperties.map((p, index) => {
                    const heightStyles = ['h-[280px]', 'h-[195px]', 'h-[330px]', 'h-[220px]', 'h-[290px]', 'h-[210px]'];
                    const cardHeight = heightStyles[index % heightStyles.length];

                    return (
                      <div 
                        key={p.id} 
                        onClick={() => navigate(`/properties/${p.id}`)}
                        className={`break-inside-avoid relative ${cardHeight} w-full rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-gray-900 cursor-pointer group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 mb-4`}
                      >
                        {/* Thumbnail: individual lazy iframe or photo */}
                        {isDirectImage(p.threeSixtyImageUrl) ? (
                          <img
                            src={p.threeSixtyImageUrl}
                            alt={p.title}
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'; }}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : isValidIframeUrl(p.threeSixtyImageUrl) ? (
                          <LazyIframe
                            src={getCleanIframeUrl(p.threeSixtyImageUrl)}
                            fallbackImageSrc={p.images?.[0]?.imageUrl || p.images?.[0]?.url}
                            alt={p.title}
                            label="360° LIVE"
                          />
                        ) : (
                          <img
                            src={p.images?.[0]?.imageUrl || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'}
                            alt={p.title}
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'; }}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        
                        {/* Price Badge */}
                        <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full z-10 shadow-md">
                          ₹{calculateEmiUnder20k(p).toLocaleString('en-IN')}/mo EMI
                        </div>

                        {/* Bottom Gradient Card Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col justify-end p-3.5 pointer-events-none z-10">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 mb-0.5">{p.category}</span>
                          <p className="text-gray-900 text-xs font-extrabold line-clamp-2 leading-snug">{p.title}</p>
                          <p className="text-gray-500 text-[10px] font-semibold mt-1 flex items-center gap-1">📍 {p.village || p.district}, {p.area}ac</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

          </div>

          {/* ── DOCUMENT & OWNER VERIFICATION TAB ── */}
          <div className={viewTab === 'verify' ? 'block pb-8' : 'hidden'}>
            <DocumentVerificationHub onBack={() => setViewTab('home')} />
          </div>

        </div>
      </div>

      {/* ── NOTIFICATION SIDEBAR ── */}
      <AnimatePresence>
        {isNotificationSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setIsNotificationSidebarOpen(false)} />
            
            {/* Sidebar */}
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-80 bg-white border-l border-gray-200 z-[70] flex flex-col shadow-[[-10px_0_50px_rgba(0,0,0,0.1)]]">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                <button onClick={() => setIsNotificationSidebarOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4 text-gray-600"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length > 0 ? notifications.map(notif => (
                  <div key={notif.id} className={`p-4 rounded-xl border ${notif.isRead ? 'bg-gray-50 border-gray-100' : 'bg-primary-50 border-primary-100'}`}>
                    <h3 className="text-sm font-bold text-gray-900">{notif.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                    <span className="text-[10px] text-gray-400 mt-2 block">{new Date(notif.createdTime).toLocaleDateString()}</span>
                  </div>
                )) : (
                  <div className="text-center text-gray-500 py-8 text-sm">No new notifications</div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Chat History Sidebar */}
        {isChatSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[105]" onClick={() => setIsChatSidebarOpen(false)} />
            
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 w-80 bg-white border-l border-gray-200 z-[110] flex flex-col shadow-[-10px_0_50px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Chat History</h2>
                <button onClick={() => setIsChatSidebarOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4 text-gray-600"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {conversations.length > 0 ? conversations.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => { selectConversation(c.id); setIsChatSidebarOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${selectedConvoId === c.id ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                  >
                    <h3 className="text-sm font-semibold truncate">{c.title}</h3>
                  </button>
                )) : (
                  <div className="text-center text-gray-500 py-8 text-sm">No chat history</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── IBM AI CITIZEN ASSISTANT MODAL (MULTILINGUAL) ── */}
      <CitizenAiAssistantModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        property={selectedProperty}
      />

      {/* ── SCHEDULE VISIT SUCCESS TOAST BANNER ── */}
      {scheduleSuccess && (
        <div className="fixed top-20 left-4 right-4 z-[70] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between text-xs font-bold animate-bounce">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {scheduleSuccess}
          </span>
          <button onClick={() => setScheduleSuccess(null)} className="text-white hover:text-emerald-200 font-black">
            ✕
          </button>
        </div>
      )}

      {/* ── SCHEDULE VISIT BOTTOM SHEET MODAL ── */}
      <AnimatePresence>
        {schedulingProperty && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSchedulingProperty(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[58]"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-[82px] left-3 right-3 z-[60] bg-white rounded-3xl p-5 shadow-2xl border border-gray-200 text-gray-900 max-w-md mx-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Schedule Property Visit</h3>
                    <p className="text-[10px] text-gray-500 font-semibold truncate max-w-[200px]">{schedulingProperty.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSchedulingProperty(null)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Property Summary */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-4 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-gray-900 truncate">{schedulingProperty.title}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400" />
                    {schedulingProperty.village}, {schedulingProperty.district}
                  </p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 shrink-0">
                  ₹{schedulingProperty.price?.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Form Controls */}
              <div className="space-y-3.5 mb-5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Select Visit Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Select Preferred Time Slot</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {['10:00', '14:00', '16:00'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setScheduleTime(t)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${scheduleTime === t ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                      >
                        {t === '10:00' ? '10:00 AM' : t === '14:00' ? '02:00 PM' : '04:00 PM'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 font-semibold focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Confirm Schedule Button */}
              <button
                onClick={handleConfirmSchedule}
                disabled={!scheduleDate || !scheduleTime || scheduleLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                {scheduleLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling Visit...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Site Visit Schedule
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── FLOATING CHAT BUTTON ── */}
      <button 
        onClick={() => { 
          createNewChat(); 
          setIsChatOpen(true);
        }}
        className={`fixed bottom-5 right-0 z-[55] w-14 h-14 !bg-blue-600 rounded-l-full rounded-r-none shadow-[0_5px_20px_rgba(37,99,235,0.4)] flex items-center justify-center text-gray-900 hover:!bg-blue-500 transition-all duration-500 active:scale-95 ${isNavVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
      >
        <MessageSquare className="w-6 h-6 mr-1" />
      </button>

      {/* ── FLOATING BOTTOM NAVIGATION BAR ── */}
      <div className={`fixed bottom-5 left-0 w-[calc(100%-72px)] pr-6 pl-4 bg-white border border-gray-200 border-l-0 z-50 rounded-r-full rounded-l-none shadow-[0_5px_30px_rgba(0,0,0,0.15)] transition-all duration-500 ${isNavVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
        <div className="flex items-center justify-between w-full h-[60px]">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'verify', icon: FileCheck, label: 'Verify' },
            { id: 'explore', icon: Compass, label: 'Explore' },
            { id: 'map', icon: MapIcon, label: 'Map' },
            { id: 'schedule', icon: Calendar, label: 'Visits' },
            { id: 'settings', icon: User, label: 'Profile' }
          ].map(item => {
             const Icon = item.icon;
             const isActive = viewTab === item.id;
             return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id as any)}
                  className="flex flex-col items-center justify-center w-full h-full relative"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary-50' : ''}`}>
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[9px] font-semibold transition-colors mt-0.5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div layoutId="mobileNav" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-t-full" />
                  )}
                </button>
             );
          })}
        </div>
      </div>
      
      {/* Spacer for pb-safe */}
      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}} />
    </div>
  );
};

