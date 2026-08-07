'use client';

import React, { useState } from 'react';
import { createEventApi } from '../services/api.service';
import { EventItem, EventHighlight, CustomFormField, QuestionType } from '../types/event.types';
import { Plus, X, Calendar, Sparkles, HelpCircle } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (event: EventItem) => void;
}

export default function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    organizer: 'HITian Inside',
    hasAttendance: true,
    requireFileUpload: false
  });

  // Dynamic Highlight Cards
  const [highlights, setHighlights] = useState<EventHighlight[]>([
    { icon: 'Sparkles', title: 'Schedule Highlight', description: 'Interactive workshops & live keynotes' }
  ]);

  // Dynamic Form Questions Builder
  const [customFields, setCustomFields] = useState<CustomFormField[]>([
    { id: 'q_1', label: 'Department & Year', type: 'text', required: true }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Highlights Handler
  const handleAddHighlight = () => {
    setHighlights(prev => [...prev, { icon: 'Sparkles', title: '', description: '' }]);
  };

  const handleUpdateHighlight = (index: number, key: keyof EventHighlight, value: string) => {
    setHighlights(prev => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(prev => prev.filter((_, i) => i !== index));
  };

  // Question Builder Handler
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description || !formData.date) {
      setError('Title, Description, and Date are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        highlights: highlights.filter(h => h.title.trim()),
        customFields: customFields.filter(f => f.label.trim())
      };

      const result = await createEventApi(payload);
      if (result.success && result.data) {
        onEventCreated(result.data);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content relative max-w-2xl" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#e6d7c3] hover:text-white text-lg w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Host & Design New Event</h2>
        <p className="text-xs text-[#a69181] mb-6">Build event details, custom highlights, and dynamic registration questions.</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Event General Info */}
          <div className="space-y-4 pb-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-[#e6c594] flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>1. General Event Info</span>
            </h3>
            
            <div className="form-group">
              <label className="form-label">Event Name *</label>
              <input 
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. HITian Tech Symposium 2026"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Event Description *</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide detailed description and schedule..."
                rows={3}
                className="form-textarea"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Event Date *</label>
                <input 
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input 
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Main Auditorium / Lab 3"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Organizer Name</label>
              <input 
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                placeholder="e.g. HITian Tech Club"
                className="form-input"
              />
            </div>
          </div>

          {/* Section 2: Event Highlights Cards */}
          <div className="space-y-4 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#e6c594] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>2. Custom Event Highlights</span>
              </h3>
              <button 
                type="button" 
                onClick={handleAddHighlight}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-[#800020]/40 text-[#e6c594] border border-[#e6c594]/30 hover:bg-[#800020] inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Highlight</span>
              </button>
            </div>

            {highlights.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-[#180509] p-3 rounded-xl border border-white/5">
                <input 
                  type="text"
                  value={item.title}
                  onChange={e => handleUpdateHighlight(idx, 'title', e.target.value)}
                  placeholder="Highlight Title (e.g. Prize Pool)"
                  className="form-input flex-1 text-xs"
                />
                <input 
                  type="text"
                  value={item.description}
                  onChange={e => handleUpdateHighlight(idx, 'description', e.target.value)}
                  placeholder="Description (e.g. $5,000 Cash Prizes)"
                  className="form-input flex-1 text-xs"
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveHighlight(idx)}
                  className="text-rose-400 p-2 text-sm hover:text-rose-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Section 3: Dynamic Registration Form Questions Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#e6c594] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>3. Dynamic Registration Form Builder</span>
              </h3>
              <button 
                type="button" 
                onClick={handleAddQuestion}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-[#800020]/40 text-[#e6c594] border border-[#e6c594]/30 hover:bg-[#800020] inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {customFields.map((q, qIdx) => (
              <div key={q.id} className="bg-[#180509] p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#a69181]">Q{qIdx + 1}.</span>
                  <input 
                    type="text"
                    value={q.label}
                    onChange={e => handleUpdateQuestion(qIdx, 'label', e.target.value)}
                    placeholder="Enter question title..."
                    className="form-input flex-1 text-xs"
                    required
                  />
                  <select 
                    value={q.type}
                    onChange={e => handleUpdateQuestion(qIdx, 'type', e.target.value as QuestionType)}
                    className="bg-[#20070d] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
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

                  <label className="flex items-center gap-1 text-xs text-[#a69181]">
                    <input 
                      type="checkbox"
                      checked={q.required}
                      onChange={e => handleUpdateQuestion(qIdx, 'required', e.target.checked)}
                    />
                    Req
                  </label>

                  <button 
                    type="button" 
                    onClick={() => handleRemoveQuestion(qIdx)}
                    className="text-rose-400 text-sm hover:text-rose-300 ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Options Manager for Select, Checkbox, Radio */}
                {['select', 'checkbox', 'radio'].includes(q.type) && (
                  <div className="pl-6 space-y-2 pt-1 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-[#a69181]">
                      <span>Options:</span>
                      <button 
                        type="button" 
                        onClick={() => handleAddOption(qIdx)}
                        className="text-[#e6c594] hover:underline"
                      >
                        + Add Option
                      </button>
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
                          className="text-rose-400 text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary text-sm min-w-[140px] justify-center"
              disabled={loading}
            >
              {loading ? 'Creating Event...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
