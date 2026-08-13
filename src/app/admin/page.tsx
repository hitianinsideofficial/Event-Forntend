'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
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
  fetchLogsAndAnalyticsApi
} from '../../services/api.service';
import { 
  fetchAnalyticsDashboardApi, 
  AnalyticsSummaryData 
} from '../../services/analytics.service';
import { EventItem, EventStatus } from '../../types/event.types';
import { 
  Lock, 
  LogOut, 
  Plus, 
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
  Server
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
  CartesianGrid
} from 'recharts';

const PIE_COLORS = ['#ff9933', '#e6c594', '#00c49f', '#ff8042', '#8884d8', '#ffc658', '#82ca9d', '#a4de6c', '#d0ed57', '#83a6ed'];

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Analytics State
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

  // Logs & Visual Analytics State
  const [logsAnalyticsData, setLogsAnalyticsData] = useState<any>(null);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);

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

  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null);

  const loadAdminEvents = async () => {
    setLoading(true);
    try {
      // Pass includeDone=true & admin=true so admins see ALL events (including DONE & HIDDEN)
      const eventsList = await fetchEvents(true, true);
      setEvents(eventsList);
    } catch (err) {
      console.error('Failed loading admin events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (eventId: string, isHidden: boolean) => {
    setTogglingVisibilityId(eventId);
    try {
      await toggleEventVisibilityApi(eventId, isHidden);
      setEvents(prev => prev.map(ev => {
        if ((ev.id || ev._id) === eventId) {
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

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await fetchAnalyticsDashboardApi();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed loading analytics summary:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadObserversList = async () => {
    try {
      const data = await fetchObserversAdminApi();
      setObservers(data);
    } catch (err) {
      console.error('Failed loading observers list:', err);
    }
  };

  const handleCreateObserver = async (e: React.FormEvent) => {
    e.preventDefault();
    setObsError('');
    setObsSuccess('');
    setObsLoading(true);

    try {
      await createObserverAdminApi(newObsName, newObsEmail, newObsPassword);
      setObsSuccess(`Observer "${newObsName}" created successfully. Credentials generated.`);
      setNewObsName('');
      setNewObsEmail('');
      setNewObsPassword('');
      await loadObserversList();
    } catch (err: any) {
      setObsError(err.message || 'Failed to create observer credentials');
    } finally {
      setObsLoading(false);
    }
  };

  const handleToggleObserverStatus = async (id: string, currentIsActive: boolean) => {
    try {
      await toggleObserverStatusAdminApi(id, !currentIsActive);
      await loadObserversList();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDeleteObserver = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY REMOVE observer "${email}"? Their portal access will be instantly revoked.`)) {
      return;
    }

    try {
      await deleteObserverAdminApi(id);
      await loadObserversList();
    } catch (err: any) {
      alert(err.message || 'Failed to remove observer');
    }
  };

  const loadLogsAndAnalytics = async () => {
    setLogsLoading(true);
    try {
      const data = await fetchLogsAndAnalyticsApi();
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
      loadAdminEvents();
      loadAnalytics();
      loadObserversList();
      loadLogsAndAnalytics();
    }
  }, [isAuthenticated]);

  const handleStatusChange = async (eventId: string, newStatus: EventStatus) => {
    setUpdatingStatusId(eventId);
    try {
      await updateEventStatusApi(eventId, newStatus);
      await loadAdminEvents();
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
      await loadAdminEvents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-md w-full border border-[#f7f1e5]/10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#800020]/30 border border-[#e6c594]/30 text-[#e6c594] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Admin Portal Access</h1>
            <p className="text-xs text-[#a69181] mb-6">Enter admin email & password to manage events, QR check-ins, and submissions.</p>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="form-group text-left">
                <label className="form-label">Admin Email</label>
                <input 
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="admin@hitianinside.in"
                  className="form-input text-sm"
                  required
                />
              </div>

              <div className="form-group text-left">
                <label className="form-label">Admin Password</label>
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="form-input text-sm font-mono"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={authLoading}
                className="btn-primary w-full py-2.5 justify-center text-sm font-semibold mt-2 inline-flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{authLoading ? 'Verifying...' : 'Unlock Admin Panel'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin Console & <span className="text-indigo-400">Event Management</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">General Administrative Panel • Manage events, forms, observers, and attendee records.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/admin/events/create"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Event</span>
            </Link>
            <button 
              onClick={() => {
                setIsAuthenticated(false);
                if (typeof window !== 'undefined') sessionStorage.removeItem('adminToken');
              }}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Real-time Website Analytics & Visitor Metrics */}
        <section className="glass-panel p-6 border border-[#f7f1e5]/10 mb-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#e6c594]" />
              <h2 className="text-lg font-bold text-white">Live Website Analytics & User Activity</h2>
            </div>
            <button 
              onClick={loadAnalytics} 
              disabled={analyticsLoading}
              className="text-xs text-[#a69181] hover:text-[#e6c594] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#180509] p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-[#a69181] mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Total Page Views</span>
                <Eye className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white">{analyticsData?.totalPageViews || 0}</p>
            </div>

            <div className="bg-[#180509] p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-[#a69181] mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Unique Visitors</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">{analyticsData?.uniqueVisitorsCount || 0}</p>
            </div>

            <div className="bg-[#180509] p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-[#a69181] mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Total Button Clicks</span>
                <MousePointerClick className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">{analyticsData?.totalClicks || 0}</p>
            </div>

            <div className="bg-[#180509] p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-between text-[#a69181] mb-1">
                <span className="text-[11px] font-medium uppercase tracking-wider">Today's Visits</span>
                <TrendingUp className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-white">{analyticsData?.todayPageViews || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Popular Button Clicks */}
            <div className="bg-[#180509]/80 p-4 rounded-xl border border-white/5">
              <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider mb-3">Top Clicked Buttons & Actions</h3>
              {analyticsData?.topClickedElements && analyticsData.topClickedElements.length > 0 ? (
                <div className="space-y-2">
                  {analyticsData.topClickedElements.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-white font-medium truncate max-w-[200px]">{item.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-mono font-bold text-[10px]">
                        {item.count} clicks
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#a69181] italic">No click data logged yet.</p>
              )}
            </div>

            {/* Most Visited Pages */}
            <div className="bg-[#180509]/80 p-4 rounded-xl border border-white/5">
              <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider mb-3">Most Visited Pages</h3>
              {analyticsData?.topPages && analyticsData.topPages.length > 0 ? (
                <div className="space-y-2">
                  {analyticsData.topPages.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-white font-mono truncate max-w-[200px]">{item._id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 font-mono font-bold text-[10px]">
                        {item.count} views
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#a69181] italic">No pageview data logged yet.</p>
              )}
            </div>
          </div>
        </section>

        {/* System Visual Analytics & Audit Logs Hub */}
        <section className="glass-panel p-6 border border-[#f7f1e5]/10 mb-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#ff9933]" />
              <div>
                <h2 className="text-lg font-bold text-white">System Audit Logs & Submission Analytics</h2>
                <p className="text-xs text-[#a69181] mt-0.5">Real-time department breakdown, academic year analysis, timeline graph, and login activity.</p>
              </div>
            </div>
            <button 
              onClick={loadLogsAndAnalytics} 
              disabled={logsLoading}
              className="text-xs text-[#a69181] hover:text-[#e6c594] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Charts</span>
            </button>
          </div>

          {/* 3 Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Department Analysis Pie Chart */}
            <div className="bg-[#180509] p-4 rounded-xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider flex items-center gap-1.5">
                  <PieChartIcon className="w-3.5 h-3.5 text-[#ff9933]" />
                  <span>1. Department Analysis</span>
                </h3>
                <span className="text-[10px] text-[#a69181] font-mono">Pie Chart</span>
              </div>
              
              {logsAnalyticsData?.deptPieData && logsAnalyticsData.deptPieData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={logsAnalyticsData.deptPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {logsAnalyticsData.deptPieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#150408', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-[#a69181] italic">
                  No department data logged yet.
                </div>
              )}
            </div>

            {/* 2. Academic Year Wise Submission Pie Chart */}
            <div className="bg-[#180509] p-4 rounded-xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider flex items-center gap-1.5">
                  <PieChartIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Year-Wise Submissions</span>
                </h3>
                <span className="text-[10px] text-[#a69181] font-mono">Pie Chart</span>
              </div>

              {logsAnalyticsData?.yearPieData && logsAnalyticsData.yearPieData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={logsAnalyticsData.yearPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {logsAnalyticsData.yearPieData.map((entry: any, index: number) => (
                          <Cell key={`cell-yr-${index}`} fill={PIE_COLORS[(index + 3) % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#150408', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-[#a69181] italic">
                  No academic year data logged yet.
                </div>
              )}
            </div>

            {/* 3. Time Graph of Submissions */}
            <div className="bg-[#180509] p-4 rounded-xl border border-white/10 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3. Submission Timeline Graph</span>
                </h3>
                <span className="text-[10px] text-[#a69181] font-mono">Time Series</span>
              </div>

              {logsAnalyticsData?.timeGraphData && logsAnalyticsData.timeGraphData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={logsAnalyticsData.timeGraphData}>
                      <defs>
                        <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff9933" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ff9933" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#a69181" fontSize={10} />
                      <YAxis stroke="#a69181" fontSize={10} allowDecimals={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#150408', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="submissions" stroke="#ff9933" fillOpacity={1} fill="url(#colorSub)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-[#a69181] italic">
                  No timeline submission data logged yet.
                </div>
              )}
            </div>
          </div>

          {/* System Login Audit Logs Table */}
          <div className="bg-[#180509] p-4 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#ff9933]" />
                <span>System Authentication & Login Audit Logs</span>
              </h3>
              <span className="text-[10px] text-[#a69181] font-mono">
                Total Attempts: {logsAnalyticsData?.loginLogs?.length || 0}
              </span>
            </div>

            {logsAnalyticsData?.loginLogs && logsAnalyticsData.loginLogs.length > 0 ? (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#150408] border-b border-white/10 text-[#a69181] uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">IP / Browser</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[#e6d7c3]/90">
                    {logsAnalyticsData.loginLogs.map((log: any, i: number) => (
                      <tr key={i} className="hover:bg-white/[0.02]">
                        <td className="py-2 px-3 font-mono text-[10px] text-[#a69181]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 font-medium text-white">{log.email}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            log.role === 'admin' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {log.role}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {log.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                              <ShieldCheck className="w-3 h-3" /> SUCCESS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[10px]">
                              <ShieldX className="w-3 h-3" /> FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[10px] text-[#a69181] font-mono truncate max-w-[200px]">
                          {log.ip} • {log.userAgent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#a69181] italic">No authentication logs recorded yet.</p>
            )}
          </div>
        </section>

        {/* Hosted Events Directory */}
        <section className="glass-panel p-6 border border-[#f7f1e5]/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Hosted Events Directory</h2>
              <p className="text-xs text-[#a69181] mt-0.5">Control status visibility (`UPCOMING`, `LIVE`, `DONE`) and open form builders.</p>
            </div>
            <span className="text-xs font-mono text-[#e6c594]">Total: {events.length}</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#a69181]">
              <div className="inline-block w-6 h-6 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-[#a69181] border border-dashed border-white/10 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#a69181]">
                <CalendarX className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">No Events Created Yet</p>
              <p className="text-xs text-[#a69181] mb-6">Click "+ Create New Event" to publish your first official event!</p>
              <Link 
                href="/admin/events/create" 
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Event</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(ev => {
                const eventId = ev.id || ev._id || '';
                return (
                  <div key={eventId} className="bg-[#180509] p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-[#e6c594]/30 transition-all">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white">{ev.title}</h3>
                        
                        {/* Status Switcher Badge */}
                        <select 
                          value={ev.status || 'UPCOMING'}
                          disabled={updatingStatusId === eventId}
                          onChange={(e) => handleStatusChange(eventId, e.target.value as EventStatus)}
                          className={`text-[10px] font-bold rounded-full px-3 py-1 border outline-none cursor-pointer ${
                            ev.status === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                            ev.status === 'DONE' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                            'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          <option value="UPCOMING">UPCOMING (Registration Open)</option>
                          <option value="LIVE">LIVE NOW</option>
                          <option value="DONE">DONE (Hidden from Public)</option>
                        </select>

                        {/* Website Visibility Toggle Button */}
                        <button
                          type="button"
                          disabled={togglingVisibilityId === eventId}
                          onClick={() => handleToggleVisibility(eventId, !ev.isHidden)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold border inline-flex items-center gap-1.5 transition-all shadow-md ${
                            ev.isHidden 
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 hover:bg-rose-500/30' 
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          }`}
                          title={ev.isHidden ? 'Click to show this event on the main website' : 'Click to hide this event from the main website'}
                        >
                          {ev.isHidden ? (
                            <>
                              <EyeOff className="w-3 h-3 text-rose-400" />
                              <span>🙈 Hidden from Website</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-emerald-400" />
                              <span>👁️ Shown on Website</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-[#a69181] line-clamp-2">{ev.description}</p>
                      
                      <div className="flex items-center gap-4 text-[11px] text-[#a69181]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#e6c594]" />
                          {ev.date}
                        </span>
                        <span>📍 {ev.location}</span>
                        <span>🏢 {ev.organizer}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link 
                        href={`/admin/events/${eventId}/edit`}
                        className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                        title="Edit Details & Upload Banners"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Banners & Details</span>
                      </Link>

                      <Link 
                        href={`/admin/events/${eventId}/form-builder`}
                        className="px-3 py-2 rounded-xl bg-[#800020]/30 hover:bg-[#800020] text-[#e6c594] border border-[#e6c594]/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Form Builder</span>
                      </Link>

                      <Link 
                        href={`/admin/events/${eventId}/submissions`}
                        className="btn-secondary text-xs py-2 inline-flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Registrations</span>
                      </Link>

                      {/* Delete Event Button */}
                      <button
                        onClick={() => handleDeleteEvent(eventId, ev.title)}
                        disabled={deletingId === eventId}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all text-xs font-semibold"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Observer Credentials & Access Management */}
        <section className="glass-panel p-6 border border-[#f7f1e5]/10 mt-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#ff9933]" />
                <span>Observer & Judge Credentials Management</span>
              </h2>
              <p className="text-xs text-[#a69181] mt-0.5">
                Issue observer login credentials for viewing submissions. Deactivating or deleting an observer instantly revokes their access.
              </p>
            </div>
            <span className="text-xs font-mono text-[#e6c594]">Total Observers: {observers.length}</span>
          </div>

          {/* Form to Create New Observer */}
          <form onSubmit={handleCreateObserver} className="bg-[#180509] p-4 rounded-xl border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-[#e6c594] uppercase tracking-wider">Issue New Observer Login Credentials</h3>
            
            {obsError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {obsError}
              </div>
            )}

            {obsSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {obsSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Observer Name (e.g. Judge Srijita)"
                value={newObsName}
                onChange={e => setNewObsName(e.target.value)}
                className="form-input text-xs py-2 bg-white/5"
                required
              />
              <input 
                type="email" 
                placeholder="Observer Email"
                value={newObsEmail}
                onChange={e => setNewObsEmail(e.target.value)}
                className="form-input text-xs py-2 bg-white/5"
                required
              />
              <input 
                type="text" 
                placeholder="Observer Password"
                value={newObsPassword}
                onChange={e => setNewObsPassword(e.target.value)}
                className="form-input text-xs py-2 bg-white/5 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={obsLoading}
              className="btn-tricolour text-xs py-2 px-5 font-semibold inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{obsLoading ? 'Issuing...' : '+ Issue Observer Credentials'}</span>
            </button>
          </form>

          {/* List of Active & Revoked Observers */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#a69181] uppercase tracking-wider">Issued Observer Credentials</h3>
            
            {observers.length === 0 ? (
              <p className="text-xs text-[#a69181] italic">No observer credentials issued yet.</p>
            ) : (
              <div className="space-y-2">
                {observers.map((obs) => {
                  const obsId = obs.id || obs._id;
                  return (
                    <div key={obsId} className="bg-[#180509] p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{obs.name}</span>
                          {obs.isActive ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                              ACTIVE ACCESS
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                              ACCESS REVOKED
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#a69181] font-mono">{obs.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleObserverStatus(obsId, obs.isActive)}
                          className={`text-xs py-1 px-3 rounded-lg border font-semibold inline-flex items-center gap-1 transition-colors ${
                            obs.isActive 
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {obs.isActive ? <UserX className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                          <span>{obs.isActive ? 'Disable Access' : 'Enable Access'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteObserver(obsId, obs.email)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                          title="Revoke & Delete Credentials"
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
      </main>
    </div>
  );
}
