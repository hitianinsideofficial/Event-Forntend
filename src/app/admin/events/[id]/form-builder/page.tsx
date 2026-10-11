'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminNavbar from '../../../../../components/AdminNavbar';
import { fetchEventById, updateEventFormApi } from '../../../../../services/api.service';
import { EventItem, CustomFormField, QuestionType } from '../../../../../types/event.types';
import { ArrowLeft, Plus, X, Save, CheckCircle2, GripVertical } from 'lucide-react';

export default function EventFormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [customFields, setCustomFields] = useState<CustomFormField[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  useEffect(() => {
    if (!eventId || !isAuthenticated) return;

    const loadEventData = async () => {
      setLoading(true);
      try {
        const data = await fetchEventById(eventId);
        setEvent(data);
        if (data.customFields && data.customFields.length > 0) {
          setCustomFields(data.customFields);
        } else {
          setCustomFields([
            { id: 'q_1', label: 'Department & Year', type: 'text', required: true }
          ]);
        }
      } catch (err) {
        setError('Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, isAuthenticated]);

  if (!isAuthenticated) return null;

  const handleAddQuestion = () => {
    const newId = `q_${Date.now()}`;
    setCustomFields(prev => [
      ...prev,
      { id: newId, label: '', type: 'text', required: false, options: ['Option 1', 'Option 2'] }
    ]);
  };

  const handleUpdateQuestion = (index: number, key: keyof CustomFormField, value: any) => {
    setCustomFields(prev => {
      return prev.map((q, idx) => {
        if (idx !== index) return q;
        const updated = { ...q, [key]: value };
        if (key === 'type' && ['select', 'checkbox', 'radio'].includes(value as string) && (!updated.options || updated.options.length === 0)) {
          updated.options = ['Option 1', 'Option 2'];
        }
        return updated;
      });
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setCustomFields(prev => {
      return prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const currentOpts = [...(q.options || [])];
        currentOpts[optIndex] = value;
        return {
          ...q,
          options: currentOpts
        };
      });
    });
  };

  const handleAddOption = (e: React.MouseEvent, qIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomFields(prev => {
      return prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        const currentOpts = q.options ? [...q.options] : [];
        return {
          ...q,
          options: [...currentOpts, `Option ${currentOpts.length + 1}`]
        };
      });
    });
  };

  const handleRemoveOption = (e: React.MouseEvent, qIndex: number, optIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomFields(prev => {
      return prev.map((q, idx) => {
        if (idx !== qIndex) return q;
        return {
          ...q,
          options: (q.options || []).filter((_, i) => i !== optIndex)
        };
      });
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  // Drag & Drop Reordering for Questions
  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    setCustomFields(prev => {
      const copy = [...prev];
      const draggedItem = copy[draggedIdx];
      copy.splice(draggedIdx, 1);
      copy.splice(index, 0, draggedItem);
      return copy;
    });
    setDraggedIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    setSaving(true);
    try {
      const validFields = customFields.filter(f => f.label.trim());
      const res = await updateEventFormApi(eventId, validFields);
      if (res.success) {
        setMessage('Registration form updated successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save registration form.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
        <AdminNavbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-slate-900 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 mb-6 transition-colors font-bold uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-700 px-2.5 py-0.5 bg-slate-100 border border-slate-300">
                Form Builder Schema
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
                {event?.title || 'Event Registration Form'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Design questions and upload requirements. Drag handle to reorder fields.</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveForm} className="space-y-6">
            <div className="space-y-4">
              {customFields.map((q, qIdx) => (
                <div 
                  key={q.id}
                  draggable
                  onDragStart={() => handleDragStart(qIdx)}
                  onDragOver={(e) => handleDragOver(e, qIdx)}
                  onDragEnd={handleDragEnd}
                  className={`bg-slate-50 p-5 border space-y-3 transition-all ${
                    draggedIdx === qIdx ? 'border-slate-900 opacity-50' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-800">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <span className="text-xs font-mono text-slate-700 font-bold">Q{qIdx + 1}.</span>
                    
                    <input 
                      type="text"
                      value={q.label}
                      onChange={e => handleUpdateQuestion(qIdx, 'label', e.target.value)}
                      placeholder="Enter question title (e.g. Which track are you competing in?)..."
                      className="flex-1 bg-white border border-slate-300 p-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                      required
                    />

                    <select 
                      value={q.type}
                      onChange={e => handleUpdateQuestion(qIdx, 'type', e.target.value as QuestionType)}
                      className="bg-white border border-slate-300 px-3 py-2 text-xs text-slate-900 outline-none focus:border-slate-900 font-bold"
                    >
                      <option value="text">Short Answer</option>
                      <option value="textarea">Long Answer</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox (Multi-select)</option>
                      <option value="radio">Radio Option</option>
                      <option value="url">URL Link</option>
                      <option value="file">File Upload</option>
                      <option value="image">Image Upload (PNG/JPG)</option>
                      <option value="video">Video Upload (MP4)</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={q.required}
                        onChange={e => handleUpdateQuestion(qIdx, 'required', e.target.checked)}
                        className="border-slate-300 text-slate-900 focus:ring-0"
                      />
                      Required
                    </label>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-rose-600 p-1.5 hover:text-rose-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options Manager for Select, Checkbox, Radio */}
                  {['select', 'checkbox', 'radio'].includes(q.type) && (
                    <div className="pl-6 space-y-2 pt-2 border-t border-slate-200">
                      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                        Question Options:
                      </div>
                      
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-center">
                          <input 
                            type="text"
                            value={opt}
                            onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="w-full bg-white border border-slate-300 p-1.5 text-xs text-slate-900 outline-none focus:border-slate-900"
                          />
                          <button 
                            type="button" 
                            onClick={(e) => handleRemoveOption(e, qIdx, optIdx)}
                            className="text-rose-600 text-xs p-1 hover:text-rose-800 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add Option Button */}
                      <button 
                        type="button" 
                        onClick={(e) => handleAddOption(e, qIdx)}
                        className="mt-2 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer uppercase tracking-wider"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Option</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Question Button */}
            <button 
              type="button" 
              onClick={handleAddQuestion}
              className="w-full py-3 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center justify-center gap-1.5 transition-all mt-2 cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question Field</span>
            </button>

            <div className="pt-4 flex justify-between items-center border-t border-slate-200">
              <Link href="/admin" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold uppercase tracking-wider">
                ← Return to Dashboard
              </Link>

              <button 
                type="submit" 
                disabled={saving}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider min-w-[180px] justify-center inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Form...' : 'Save Form Schema'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
