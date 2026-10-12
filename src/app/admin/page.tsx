'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminNavbar from '../../components/AdminNavbar';
import { 
  adminLoginApi, 
  fetchEvents, 
  updateEventStatusApi,
  toggleEventVisibilityApi,
  deleteEventApi,
  fetchObserversAdminApi,
  createObserverAdminApi,
  toggleObserverStatusAdminApi,
  deleteObserverAdminApi,
  fetchLogsAndAnalyticsApi,
  fetchSubmissionsApi
} from '../../services/api.service';
import { 
  fetchAnalyticsDashboardApi, 
  AnalyticsSummaryData 
} from '../../services/analytics.service';
import { EventItem, EventStatus } from '../../types/event.types';
import { SubmissionItem } from '../../types/submission.types';
import EmailPreviewModal from '../../components/EmailPreviewModal';
import { 
  Lock, 
  LogOut, 
  Plus, 
  Mail, 
  Calendar, 
  FileText, 
  Users, 
  CalendarX,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  MousePointerClick,
  TrendingUp,
  BarChart3,
  RefreshCw,
  UserPlus,
  ShieldAlert,
  KeyRound,
  Check,
  UserX,
  Activity,
  PieChart as PieChartIcon,
  Clock,
  ShieldCheck,
  ShieldX,
  Server,
  Filter,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Layers,
  ArrowRight,
  Search,
  Sparkles,
  Building2,
  GraduationCap
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

const CHART_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#ea580c', '#65a30d', '#db2777'];

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null);
  const [previewEvent, setPreviewEvent] = useState<EventItem | null>(null);

  // Event-Wise Analytics Filter
  const [selectedAnalyticsEventId, setSelectedAnalyticsEventId] = useState<string>('ALL');

  // General Website Traffic Analytics State
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummaryData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  // Observer Management State
  const [observers, setObservers] = useState<any[]>([]);
  const [newObsName, setNewObsName] = useState<string>('');
  const [newObsEmail, setNewObsEmail] = useState<string>('');
  const [newObsPassword, setNewObsPassword] = useState<string>('');
  const [obsLoading, setObsLoading] = useState<boolean>(false);
  const [obsError, setObsError] = useState<string>('');
  const [obsSuccess, setObsSuccess] = useState<string>('');

  // Logs & Audit State
  const [logsAnalyticsData, setLogsAnalyticsData] = useState<any>(null);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);

  // Search filter for events list
  const [eventSearchQuery, setEventSearchQuery] = useState<string>('');
  const [eventStatusFilter, setEventStatusFilter] = useState<string>('ALL');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await adminLoginApi(emailInput, passwordInput);
      if (res.success && res.token) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminToken', res.token);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Invalid Admin Email or Password');
    } finally {
      setAuthLoading(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadAdminEventsAndSubmissions = async (forceRefresh: boolean = false) => {
    // Only show full loading spinner if we don't have any cached events yet
    if (events.length === 0) {
      setLoading(true);
    }
    try {
      const [eventsList, subsList] = await Promise.all([
        fetchEvents(true, true, forceRefresh),
        fetchSubmissionsApi(undefined, forceRefresh)
      ]);
      setEvents(eventsList);
      setAllSubmissions(subsList);
    } catch (err) {
      console.error('Failed loading admin events & submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (eventId: string, isHidden: boolean) => {
    setTogglingVisibilityId(eventId);
    try {
      await toggleEventVisibilityApi(eventId, isHidden);
      setEvents(prev => prev.map(ev => {
        if ((ev.id || (ev as any)._id) === eventId) {
          return { ...ev, isHidden };
        }
        return ev;
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle event visibility');
    } finally {
      setTogglingVisibilityId(null);
    }
  };

  const loadAnalytics = async (forceRefresh: boolean = false) => {
    if (!analyticsData) setAnalyticsLoading(true);
    try {
      const data = await fetchAnalyticsDashboardApi(forceRefresh);
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed loading analytics summary:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadObserversList = async (forceRefresh: boolean = false) => {
    try {
      const data = await fetchObserversAdminApi(forceRefresh);
      setObservers(data);
    } catch (err) {
      console.error('Failed loading observers list:', err);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadAdminEventsAndSubmissions(true),
        loadAnalytics(true),
        loadObserversList(true),
        loadLogsAndAnalytics(true)
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateObserver = async (e: React.FormEvent) => {
    e.preventDefault();
    setObsError('');
    setObsSuccess('');
    setObsLoading(true);

    try {
      await createObserverAdminApi(newObsName, newObsEmail, newObsPassword);
      setObsSuccess(`Observer "${newObsName}" created successfully.`);
      setNewObsName('');
      setNewObsEmail('');
      setNewObsPassword('');
      await loadObserversList(true);
    } catch (err: any) {
      setObsError(err.message || 'Failed to create observer credentials');
    } finally {
      setObsLoading(false);
    }
  };

  const handleToggleObserverStatus = async (id: string, currentIsActive: boolean) => {
    try {
      await toggleObserverStatusAdminApi(id, !currentIsActive);
      await loadObserversList(true);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteObserver = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY REMOVE observer "${email}"? Access will be revoked immediately.`)) {
      return;
    }

    try {
      await deleteObserverAdminApi(id);
      await loadObserversList(true);
    } catch (err: any) {
      alert(err.message || 'Failed to remove observer');
    }
  };

  const loadLogsAndAnalytics = async (forceRefresh: boolean = false) => {
    if (!logsAnalyticsData) setLogsLoading(true);
    try {
      const data = await fetchLogsAndAnalyticsApi(forceRefresh);
      setLogsAnalyticsData(data);
    } catch (err) {
      console.error('Failed loading logs and analytics:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken');
      if (token) setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminEventsAndSubmissions();
      loadAnalytics();
      loadObserversList();
      loadLogsAndAnalytics();
    }
  }, [isAuthenticated]);

  const handleStatusChange = async (eventId: string, newStatus: EventStatus) => {
    setUpdatingStatusId(eventId);
    try {
      await updateEventStatusApi(eventId, newStatus);
      await loadAdminEventsAndSubmissions();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(eventId);
    try {
      await deleteEventApi(eventId);
      await loadAdminEventsAndSubmissions();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // EVENT-WISE COMPUTED ANALYTICS
  // ==========================================
  const eventWiseFilteredSubmissions = useMemo(() => {
    if (selectedAnalyticsEventId === 'ALL') {
      return allSubmissions;
    }
    return allSubmissions.filter(sub => {
      const matchesId = sub.eventId === selectedAnalyticsEventId;
      const isNavroopamAlias = (selectedAnalyticsEventId.includes('nav') || selectedAnalyticsEventId === '6aca70825588e8009b8e8e83') && (sub.eventId === '6aca70825588e8009b8e8e83' || sub.eventId?.includes('nav') || sub.eventTitle?.toLowerCase().includes('nav'));
      const isPratidhwaniAlias = (selectedAnalyticsEventId.includes('pratid')) && (sub.eventId?.includes('pratid') || sub.eventTitle?.toLowerCase().includes('pratid'));
      return matchesId || isNavroopamAlias || isPratidhwaniAlias;
    });
  }, [allSubmissions, selectedAnalyticsEventId]);

  // Dept Wise computation for selected event
  const deptWiseData = useMemo(() => {
    const counts: Record<string, number> = {};
    eventWiseFilteredSubmissions.forEach(sub => {
      const dept = sub.answers?.['Department'] || 'Other / Unknown';
      const cleanDept = dept.split('(')[0].trim() || 'General';
      counts[cleanDept] = (counts[cleanDept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [eventWiseFilteredSubmissions]);

  // Academic Year Wise computation for selected event
  const yearWiseData = useMemo(() => {
    const counts: Record<string, number> = {};
    eventWiseFilteredSubmissions.forEach(sub => {
      const year = sub.answers?.['Academic Year'] || 'Unspecified';
      counts[year] = (counts[year] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [eventWiseFilteredSubmissions]);

  // Domain Wise computation for selected event
  const domainWiseData = useMemo(() => {
    const counts: Record<string, number> = {};
    eventWiseFilteredSubmissions.forEach(sub => {
      const dom = sub.answers?.['Selected Domain'] || sub.answers?.['Enrolled Event Options'] || 'General Entry';
      counts[dom] = (counts[dom] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [eventWiseFilteredSubmissions]);

  // Payment Status Breakdown for selected event
  const paymentMetrics = useMemo(() => {
    let paidCount = 0;
    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let totalRevenue = 0;

    eventWiseFilteredSubmissions.forEach(sub => {
      const status = sub.paymentStatus || (sub.answers?.['Payment Status']?.includes('PAID') ? 'PAID' : 'PENDING');
      if (status === 'VERIFIED') verifiedCount++;
      else if (status === 'PAID') paidCount++;
      else if (status === 'REJECTED') rejectedCount++;
      else pendingCount++;

      // Revenue parsing
      const rawAmt = sub.answers?.['Registration Fee'] || sub.answers?.['Payment Amount'];
      if (rawAmt) {
        const numMatch = String(rawAmt).match(/(\d+(\.\d+)?)/);
        if (numMatch) {
          totalRevenue += parseFloat(numMatch[0]);
        }
      }
    });

    return {
      paidCount,
      verifiedCount,
      pendingCount,
      rejectedCount,
      totalRevenue: totalRevenue.toFixed(2),
      totalSubmissions: eventWiseFilteredSubmissions.length
    };
  }, [eventWiseFilteredSubmissions]);

  // Filtered Events in Directory
  const filteredEventsDirectory = useMemo(() => {
    return events.filter(ev => {
      const matchesSearch = ev.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) || 
        ev.location.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
        ev.organizer.toLowerCase().includes(eventSearchQuery.toLowerCase());
      const matchesStatus = eventStatusFilter === 'ALL' || ev.status === eventStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [events, eventSearchQuery, eventStatusFilter]);

  // Unauthenticated Login Screen with clean zero rounded corners
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
        <header className="w-full bg-white border-b border-slate-200 py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 flex items-center justify-center p-1">
                <span className="text-white font-black text-xs">HI</span>
              </div>
              <span className="font-extrabold text-slate-900 text-base">HITian Inside • Admin Portal</span>
            </div>
            <Link href="/" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
              ← Return to Main Website
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 max-w-md w-full border border-slate-300 shadow-md">
            <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              Admin Authentication
            </h1>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Enter your authorized administrative credentials to manage registrations, verify payments, and access system analytics.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Admin Email</label>
                <input 
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="admin@hitianinside.in"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-sans"
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Admin Password</label>
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider mt-2 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>{authLoading ? 'Verifying...' : 'Sign In to Admin Console'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      <AdminNavbar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TOP COMMAND BAR */}
        <div className="bg-white border border-slate-200 p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Operations & Event Control Center
              </h1>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                System Active
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Live submission management, payment reconciliation, event-wise visual intelligence, and auditor access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              title="Re-fetch fresh data from server (bypasses local cache)"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>

            <Link 
              href="/admin/events/create"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Link>

            <Link 
              href="/admin/send-appreciation-email"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Issue Certificates & Appreciation</span>
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 1. EVENT-WISE ANALYTICS & INTELLIGENCE CONSOLE */}
        {/* ========================================================= */}
        <section className="bg-white border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  Event-Wise Analytics & Registration Metrics
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Select an event from the dropdown to immediately switch analytics, department distribution, domain breakdown, and payment health.
              </p>
            </div>

            {/* EVENT SWITCHER DROPDOWN */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter Event:</span>
              </label>
              <select
                value={selectedAnalyticsEventId}
                onChange={e => setSelectedAnalyticsEventId(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-slate-900 cursor-pointer min-w-[240px]"
              >
                <option value="ALL">🌟 ALL EVENTS COMBINED ({allSubmissions.length} Total Entries)</option>
                {events.map(ev => {
                  const evId = ev.id || (ev as any)._id;
                  const count = allSubmissions.filter(s => s.eventId === evId || (evId.includes('nav') && s.eventId?.includes('nav'))).length;
                  return (
                    <option key={evId} value={evId}>
                      {ev.title} ({count} Submissions)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* 4 KEY METRIC CARDS FOR SELECTED EVENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 border-l-4 border-l-blue-600">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Filtered Registrations</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{paymentMetrics.totalSubmissions}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">Active participant records</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 border-l-4 border-l-emerald-600">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Verified Payments</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700">{paymentMetrics.verifiedCount + paymentMetrics.paidCount}</p>
              <span className="text-[10px] text-emerald-700 mt-1 block font-medium">Reconciled with bank UTR</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending Verification</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-700">{paymentMetrics.pendingCount}</p>
              <span className="text-[10px] text-amber-700 mt-1 block font-medium">Awaiting manual admin check</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 border-l-4 border-l-purple-600">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Estimated Revenue</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-purple-900 font-mono">₹{paymentMetrics.totalRevenue}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">From ₹9.00 / ₹50 fees</span>
            </div>
          </div>

          {/* 3 VISUAL CHARTS (DEPT, YEAR, DOMAIN) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* 1. Department Distribution */}
            <div className="bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Department Distribution</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700">
                  {deptWiseData.length} Depts
                </span>
              </div>

              {deptWiseData.length > 0 ? (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deptWiseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {deptWiseData.map((entry, index) => (
                          <Cell key={`dept-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px', color: '#0f172a' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center text-xs text-slate-400 italic">
                  No submissions recorded for this selection.
                </div>
              )}
            </div>

            {/* 2. Academic Year Breakdown */}
            <div className="bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Academic Year Breakdown</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700">
                  {yearWiseData.length} Batches
                </span>
              </div>

              {yearWiseData.length > 0 ? (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearWiseData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px', color: '#0f172a' }}
                      />
                      <Bar dataKey="value" fill="#059669" name="Registrations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center text-xs text-slate-400 italic">
                  No academic batch data available.
                </div>
              )}
            </div>

            {/* 3. Competition Domain Distribution */}
            <div className="bg-white border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Domains & Categories</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700">
                  {domainWiseData.length} Tracks
                </span>
              </div>

              {domainWiseData.length > 0 ? (
                <div className="h-60 w-full overflow-y-auto space-y-2 pr-1">
                  {domainWiseData.map((d, i) => {
                    const pct = paymentMetrics.totalSubmissions > 0 
                      ? Math.round((d.value / paymentMetrics.totalSubmissions) * 100) 
                      : 0;
                    return (
                      <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                          <span className="truncate max-w-[180px]">{d.name}</span>
                          <span className="font-mono text-indigo-600">{d.value} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5">
                          <div 
                            className="bg-indigo-600 h-1.5 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center text-xs text-slate-400 italic">
                  No domain breakdown available.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. EVENT DIRECTORY & SUBMISSION PORTAL ACCESS */}
        {/* ========================================================= */}
        <section className="bg-white border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                Hosted Events & Registration Portals
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Manage live status, review attendee submissions, check payment verification, and edit registration form schemas.
              </p>
            </div>

            {/* DIRECTORY SEARCH & STATUS FILTER */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search events..."
                  value={eventSearchQuery}
                  onChange={e => setEventSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <select
                value={eventStatusFilter}
                onChange={e => setEventStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="LIVE">LIVE</option>
                <option value="DONE">DONE</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent animate-spin mb-2" />
              <p className="text-xs font-semibold">Loading event catalog...</p>
            </div>
          ) : filteredEventsDirectory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border border-dashed border-slate-300">
              <CalendarX className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">No events matched your search query</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the filter or create a new event.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200">
              {filteredEventsDirectory.map(ev => {
                const eventId = ev.id || (ev as any)._id || '';
                const isNavroopam = eventId === '6aca70825588e8009b8e8e83' || eventId.includes('nav') || ev.title.toLowerCase().includes('nav');
                const subsCount = allSubmissions.filter(s => s.eventId === eventId || (isNavroopam && s.eventId?.includes('nav'))).length;

                return (
                  <div key={eventId} className="p-4 sm:p-5 bg-white hover:bg-slate-50/70 transition-colors flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                          {isNavroopam && <span className="text-rose-600 font-bold">🔱</span>}
                          <span>{ev.title}</span>
                        </h3>

                        {/* Status Dropdown */}
                        <select 
                          value={ev.status || 'UPCOMING'}
                          disabled={updatingStatusId === eventId}
                          onChange={(e) => handleStatusChange(eventId, e.target.value as EventStatus)}
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 border cursor-pointer outline-none ${
                            ev.status === 'LIVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            ev.status === 'DONE' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                            'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="UPCOMING">UPCOMING</option>
                          <option value="LIVE">LIVE NOW</option>
                          <option value="DONE">DONE</option>
                        </select>

                        {/* Website Visibility Button */}
                        <button
                          type="button"
                          disabled={togglingVisibilityId === eventId}
                          onClick={() => handleToggleVisibility(eventId, !ev.isHidden)}
                          className={`px-2.5 py-0.5 text-[10px] font-bold border inline-flex items-center gap-1 transition-colors ${
                            ev.isHidden 
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={ev.isHidden ? 'Click to publish on website' : 'Click to hide from website'}
                        >
                          {ev.isHidden ? (
                            <>
                              <EyeOff className="w-3 h-3 text-rose-600" />
                              <span>Hidden</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>Public</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1 font-medium">
                        <span className="flex items-center gap-1 text-slate-700 font-bold">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {ev.date}
                        </span>
                        <span>📍 {ev.location}</span>
                        <span>🏢 {ev.organizer}</span>
                        <span className="font-bold text-indigo-700">
                          👥 {subsCount} Submissions
                        </span>
                      </div>
                    </div>

                    {/* ACTION BUTTONS WITH 0 ROUNDED CORNERS */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full xl:w-auto pt-2 xl:pt-0 border-t xl:border-t-0 border-slate-100">
                      <Link 
                        href={`/admin/events/${eventId}/submissions`}
                        className={`px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                          isNavroopam 
                            ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm' 
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>View Submissions ({subsCount})</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setPreviewEvent(ev)}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Preview email templates for this event"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-700" />
                        <span>Email Previews</span>
                      </button>

                      <Link 
                        href={`/admin/events/${eventId}/edit`}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </Link>

                      <Link 
                        href={`/admin/events/${eventId}/form-builder`}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Form Builder</span>
                      </Link>

                      <button
                        onClick={() => handleDeleteEvent(eventId, ev.title)}
                        disabled={deletingId === eventId}
                        className="p-2 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 3. OBSERVER CREDENTIALS & ACCESS GOVERNANCE */}
        {/* ========================================================= */}
        <section className="bg-white border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                  Judge & Observer Credential Management
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Issue read-only judge accounts for reviewing submissions and evaluating artworks.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 font-mono">Total Observers: {observers.length}</span>
          </div>

          <form onSubmit={handleCreateObserver} className="bg-slate-50 p-4 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Issue New Observer Login Credentials</h3>
            
            {obsError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-700 text-xs font-semibold">
                {obsError}
              </div>
            )}

            {obsSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                {obsSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Observer Name (e.g. Judge Srijita)"
                value={newObsName}
                onChange={e => setNewObsName(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-300 text-slate-900 outline-none focus:border-slate-900 font-sans"
                required
              />
              <input 
                type="email" 
                placeholder="Observer Email (e.g. judge@hitian.in)"
                value={newObsEmail}
                onChange={e => setNewObsEmail(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-300 text-slate-900 outline-none focus:border-slate-900 font-sans"
                required
              />
              <input 
                type="text" 
                placeholder="Password"
                value={newObsPassword}
                onChange={e => setNewObsPassword(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-300 text-slate-900 outline-none focus:border-slate-900 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={obsLoading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{obsLoading ? 'Issuing...' : '+ Issue Observer Credentials'}</span>
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {observers.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 text-center">No observer accounts issued yet.</p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200">
                {observers.map((obs) => {
                  const obsId = obs.id || obs._id;
                  return (
                    <div key={obsId} className="p-3 bg-white flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{obs.name}</span>
                          {obs.isActive ? (
                            <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase">
                              Active
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 bg-rose-100 text-rose-800 border border-rose-300 font-bold uppercase">
                              Revoked
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">{obs.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleObserverStatus(obsId, obs.isActive)}
                          className={`text-xs py-1 px-2.5 border font-semibold inline-flex items-center gap-1 transition-colors ${
                            obs.isActive 
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {obs.isActive ? <UserX className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                          <span>{obs.isActive ? 'Disable' : 'Enable'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteObserver(obsId, obs.email)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                          title="Revoke & Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* EMAIL PREVIEW MODAL */}
        <EmailPreviewModal
          isOpen={Boolean(previewEvent)}
          onClose={() => setPreviewEvent(null)}
          event={previewEvent}
        />

      </main>
    </div>
  );
}
