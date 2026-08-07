'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../../components/Navbar';
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
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setCustomFields(prev => {
      const copy = [...prev];
      const opts = [...(copy[qIndex].options || [])];
      opts[optIndex] = value;
      copy[qIndex].options = opts;
      return copy;
    });
  };

  const handleAddOption = (qIndex: number) => {
    setCustomFields(prev => {
      const copy = [...prev];
      const opts = [...(copy[qIndex].options || [])];
      opts.push(`Option ${opts.length + 1}`);
      copy[qIndex].options = opts;
      return copy;
    });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setCustomFields(prev => {
      const copy = [...prev];
      copy[qIndex].options = (copy[qIndex].options || []).filter((_, i) => i !== optIndex);
      return copy;
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
      <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-[#e6c594] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#150408] text-[#fdfbf7] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-1.5 text-xs text-[#a69181] hover:text-white mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admin Console</span>
        </Link>

        <div className="glass-panel p-6 sm:p-8 border border-[#f7f1e5]/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#e6c594] px-2.5 py-0.5 rounded bg-[#800020]/30 border border-[#e6c594]/30">
                Form Builder
              </span>
              <h1 className="text-2xl font-bold text-white mt-1">
                {event?.title || 'Event Registration Form'}
              </h1>
              <p className="text-xs text-[#a69181] mt-0.5">Design questions and upload requirements. Drag handle to reorder questions.</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
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
                  className={`bg-[#180509] p-5 rounded-xl border space-y-3 transition-all ${
                    draggedIdx === qIdx ? 'border-[#e6c594] opacity-50' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing p-1 text-[#a69181] hover:text-[#e6c594]">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <span className="text-xs font-mono text-[#a69181] font-bold">Q{qIdx + 1}.</span>
                    
                    <input 
                      type="text"
                      value={q.label}
                      onChange={e => handleUpdateQuestion(qIdx, 'label', e.target.value)}
                      placeholder="Enter question title (e.g. Which track are you competing in?)..."
                      className="form-input flex-1 text-xs"
                      required
                    />

                    <select 
                      value={q.type}
                      onChange={e => handleUpdateQuestion(qIdx, 'type', e.target.value as QuestionType)}
                      className="bg-[#20070d] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
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

                    <label className="flex items-center gap-1.5 text-xs text-[#a69181] cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={q.required}
                        onChange={e => handleUpdateQuestion(qIdx, 'required', e.target.checked)}
                        className="rounded border-white/20 text-[#800020]"
                      />
                      Required
                    </label>

                    <button 
                      type="button" 
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-rose-400 p-1.5 hover:text-rose-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Options Manager for Select, Checkbox, Radio */}
                  {['select', 'checkbox', 'radio'].includes(q.type) && (
                    <div className="pl-6 space-y-2 pt-2 border-t border-white/5">
                      <div className="text-[11px] text-[#a69181] font-medium">
                        Question Options:
                      </div>
                      
                      {q.options?.map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-center">
                          <input 
                            type="text"
                            value={opt}
                            onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="form-input py-1 text-xs flex-1"
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveOption(qIdx, optIdx)}
                            className="text-rose-400 text-xs p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Add Option Button positioned at the BOTTOM of options */}
                      <button 
                        type="button" 
                        onClick={() => handleAddOption(qIdx)}
                        className="mt-2 py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#e6c594] text-xs font-medium inline-flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Option</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Question Button positioned at the BOTTOM of questions */}
            <button 
              type="button" 
              onClick={handleAddQuestion}
              className="w-full py-3 text-xs font-semibold rounded-xl bg-[#800020]/30 hover:bg-[#800020] text-[#e6c594] hover:text-white border border-[#e6c594]/30 inline-flex items-center justify-center gap-1.5 transition-all mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>

            <div className="pt-4 flex justify-between items-center border-t border-white/10">
              <Link href="/admin" className="btn-secondary text-xs">
                ← Return to Dashboard
              </Link>

              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary text-sm min-w-[160px] justify-center inline-flex items-center gap-2"
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
