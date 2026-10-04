import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, Bookmark, Calendar, MessageSquare, Bell,
  Home, Plus, AlertOctagon, BarChart3, Key, LogOut,
  Shield, Eye, CheckCircle, Book, Activity, RefreshCw, ChevronDown, FileText
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { authService } from '../../services/auth.service';
import type { RoleType } from '../../models/property.models';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  navItems: NavItem[];
  role: RoleType;
  unreadCount?: number;
  className?: string;
  theme?: 'dark' | 'light';
}

const roleConfig: Record<RoleType, { label: string; color: string; badge: string }> = {
  ADMIN: {
    label: 'Admin Panel',
    color: 'text-danger-400',
    badge: 'bg-danger-500/15 border-danger-500/30 text-danger-400',
  },
  GOVERNMENT_OFFICER: {
    label: 'Govt. Admin',
    color: 'text-blue-600',
    badge: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  PROVIDER: {
    label: 'Provider Portal',
    color: 'text-accent-400',
    badge: 'bg-accent-500/15 border-accent-500/30 text-accent-400',
  },
  BUYER: {
    label: 'Buyer Portal',
    color: 'text-cyan-400',
    badge: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
  },
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  navItems,
  role,
  className = '',
  theme = role === 'GOVERNMENT_OFFICER' ? 'light' : 'dark',
}) => {
  const navigate = useNavigate();
  const currentUser = authService.currentUser();
  const cfg = roleConfig[role];
  const isLight = theme === 'light';

  const handleLogout = () => {
    authService.logout();
    navigate('/auth/login');
  };

  return (
    <aside className={`flex flex-col w-[240px] shrink-0 h-full overflow-hidden transition-colors ${
      isLight ? 'bg-white border-r border-gray-200 text-slate-800' : 'glass-nav text-white'
    } ${className}`}>
      {/* Logo */}
      <div className={`px-5 pt-5 pb-4 ${isLight ? 'border-b border-gray-100' : 'border-b border-white/[0.06]'}`}>
        <div className="flex items-center gap-2.5">
          {/* Logo Pin Mark */}
          <div className="relative w-8 h-8 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 shadow-sm text-white">
            <Shield className="w-4 h-4 fill-white text-emerald-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className={`font-black text-lg tracking-tight ${isLight ? 'text-blue-950' : 'text-white'}`}>
                Land<span className="text-blue-600">Lens</span>
              </span>
            </div>
            <p className={`text-[8px] font-bold tracking-widest uppercase -mt-1 ${isLight ? 'text-gray-400' : 'text-gray-400'}`}>
              VERIFY. TRUST. OWN.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto scrollbar-premium">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold
                transition-all duration-150 text-left group relative
                ${isLight ? (
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                ) : (
                  isActive
                    ? 'sidebar-item-active text-white'
                    : 'text-dark-400 hover:text-white hover:bg-white/[0.05]'
                )}
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                isActive
                  ? (isLight ? 'text-blue-600' : 'text-primary-400')
                  : (isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-dark-500 group-hover:text-dark-300')
              }`} />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`
                  px-1.5 py-0.5 rounded-full text-[9px] font-bold min-w-[18px] text-center
                  ${isLight
                    ? 'bg-rose-500 text-white'
                    : (isActive ? 'bg-primary-500/30 text-primary-300' : 'bg-danger-500/80 text-white')}
                `}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile at Bottom */}
      <div className={`px-3 py-3 ${isLight ? 'border-t border-gray-100 bg-gray-50/50' : 'border-t border-white/[0.06]'}`}>
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border mb-2 cursor-pointer ${
          isLight ? 'bg-white border-gray-200 shadow-xs hover:border-gray-300' : 'bg-white/[0.03] border-white/[0.06]'
        }`}>
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
            {role === 'GOVERNMENT_OFFICER' ? 'GV' : (currentUser?.firstName?.[0] || 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {role === 'GOVERNMENT_OFFICER' ? 'Govt. Admin' : `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`}
            </p>
            <p className={`text-[10px] truncate ${isLight ? 'text-slate-400' : 'text-dark-500'}`}>
              {role === 'GOVERNMENT_OFFICER' ? 'Super Administrator' : (currentUser?.email || '')}
            </p>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-dark-500'}`} />
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
            isLight ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50' : 'text-dark-500 hover:text-danger-400 hover:bg-danger-500/10'
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

// ─── Export nav item builders for each role ────────────────────────────
export const buyerNavItems = (unreadCount: number): NavItem[] => [
  { id: 'explore', label: 'Explore Lands', icon: Search },
  { id: 'visits', label: 'Scheduled Visits', icon: Calendar },
  { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
];

export const providerNavItems = (pendingVisits: number, unreadCount: number): NavItem[] => [
  { id: 'listings', label: 'My Listings', icon: Home },
  { id: 'add', label: 'Add Property', icon: Plus },
  { id: 'visits', label: 'Visits & Tours', icon: Calendar, badge: pendingVisits },
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
];

export const govtNavItems = (fraudCount: number, _unreadCount: number): NavItem[] => [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'queue', label: 'Verifications', icon: CheckCircle, badge: 25 },
  { id: 'approved', label: 'Properties', icon: Eye },
  { id: 'disputes', label: 'Disputes', icon: AlertOctagon, badge: fraudCount > 0 ? fraudCount : 3 },
  { id: 'api', label: 'Developer API', icon: Key },
  { id: 'health', label: 'System Health', icon: Activity },
];

export const adminNavItems = (unreadCount: number): NavItem[] => [
  { id: 'analytics', label: 'System Analytics', icon: BarChart3 },
  { id: 'properties', label: 'All Properties', icon: Home },
  { id: 'developer', label: 'Developer Portal', icon: Key },
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
];
