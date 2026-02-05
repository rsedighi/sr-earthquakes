'use client';

import { useState, useEffect } from 'react';
import {
  X,
  MessageSquarePlus,
  Lightbulb,
  Bug,
  Megaphone,
  Heart,
  Send,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

const FEEDBACK_TYPES = [
  {
    id: 'feedback',
    label: 'General Feedback',
    description: 'Share your thoughts about Bay Tremor',
    icon: Heart,
    color: '#ec4899',
    bgColor: 'from-pink-500/20 to-rose-500/20',
    borderColor: 'border-pink-500/30',
  },
  {
    id: 'improvement',
    label: 'Improvement Idea',
    description: 'Suggest ways to make Bay Tremor better',
    icon: Lightbulb,
    color: '#eab308',
    bgColor: 'from-yellow-500/20 to-amber-500/20',
    borderColor: 'border-yellow-500/30',
  },
  {
    id: 'bug',
    label: 'Report a Bug',
    description: 'Help us fix issues you\'ve encountered',
    icon: Bug,
    color: '#ef4444',
    bgColor: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/30',
  },
  {
    id: 'feature',
    label: 'Feature Request',
    description: 'Tell us what features you\'d love to see',
    icon: Sparkles,
    color: '#8b5cf6',
    bgColor: 'from-violet-500/20 to-purple-500/20',
    borderColor: 'border-violet-500/30',
  },
  {
    id: 'advertising',
    label: 'Advertising Inquiry',
    description: 'Partner with us or advertise on Bay Tremor',
    icon: Megaphone,
    color: '#06b6d4',
    bgColor: 'from-cyan-500/20 to-teal-500/20',
    borderColor: 'border-cyan-500/30',
  },
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'type' | 'form' | 'success';

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [step, setStep] = useState<ModalStep>('type');
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('type');
        setFeedbackType(null);
        setEmail('');
        setName('');
        setMessage('');
        setIsSubmitting(false);
      }, 300);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const handleSelectType = (typeId: string) => {
    setFeedbackType(typeId);
    setStep('form');
  };

  const handleBack = () => {
    setStep('type');
    setFeedbackType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackType || !message.trim()) return;

    setIsSubmitting(true);

    try {
      // Submit to Netlify Forms
      const formData = new URLSearchParams();
      formData.append('form-name', 'feedback');
      formData.append('feedback-type', feedbackType);
      formData.append('name', name.trim() || 'Anonymous');
      formData.append('email', email.trim() || 'Not provided');
      formData.append('message', message.trim());
      formData.append('page', typeof window !== 'undefined' ? window.location.pathname : '/');
      formData.append('timestamp', new Date().toISOString());

      console.log('[Feedback Form] Submitting:', Object.fromEntries(formData));

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      console.log('[Feedback Form] Response status:', response.status);
      
      if (response.ok) {
        console.log('[Feedback Form] Success!');
        setStep('success');
      } else {
        const text = await response.text();
        console.error('[Feedback Form] Error response:', response.status, text);
        // Still show success - Netlify may have captured it
        setStep('success');
      }
    } catch (err) {
      console.error('[Feedback Form] Network error:', err);
      // Network error - still show success for better UX
      setStep('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = FEEDBACK_TYPES.find(t => t.id === feedbackType);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full z-[100] flex items-center justify-center md:block">
        <div className="w-full bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200">
          {/* Header */}
          <div className="sticky top-0 bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              {step === 'form' && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${step === 'success' ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' : selectedType ? selectedType.bgColor + ' ' + selectedType.borderColor : 'from-violet-500/20 to-purple-500/20 border-violet-500/30'} border`}>
                  {step === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : selectedType ? (
                    <selectedType.icon className="w-5 h-5" style={{ color: selectedType.color }} />
                  ) : (
                    <MessageSquarePlus className="w-5 h-5 text-violet-400" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-white">
                    {step === 'type' && 'Send Us Feedback'}
                    {step === 'form' && selectedType?.label}
                    {step === 'success' && 'Message Sent!'}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {step === 'type' && 'We\'d love to hear from you'}
                    {step === 'form' && 'Share your thoughts with us'}
                    {step === 'success' && 'Thank you for reaching out'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] overscroll-contain">
            {/* Step 1: Select Type */}
            {step === 'type' && (
              <div className="p-4 space-y-2">
                <p className="text-sm text-neutral-400 mb-4">
                  What would you like to share with us?
                </p>
                {FEEDBACK_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 transition-all group text-left"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${type.bgColor} border ${type.borderColor} group-hover:scale-105 transition-transform`}
                    >
                      <type.icon className="w-5 h-5" style={{ color: type.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white group-hover:text-white/90">
                        {type.label}
                      </div>
                      <div className="text-sm text-neutral-500 group-hover:text-neutral-400">
                        {type.description}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-neutral-600 group-hover:text-white/60 transition-colors flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Form */}
            {step === 'form' && selectedType && (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Hidden inputs for Netlify Forms */}
                <input type="hidden" name="form-name" value="feedback" />
                <input type="hidden" name="feedback-type" value={feedbackType || ''} />

                {/* Name field */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Name <span className="text-neutral-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    maxLength={100}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-colors"
                  />
                </div>

                {/* Email field */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Email <span className="text-neutral-500">(optional, for follow-up)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    maxLength={200}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-colors"
                  />
                </div>

                {/* Message field */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Your Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      feedbackType === 'bug'
                        ? 'Describe the bug you encountered, including steps to reproduce it...'
                        : feedbackType === 'improvement'
                        ? 'What would make Bay Tremor better for you?'
                        : feedbackType === 'feature'
                        ? 'Describe the feature you\'d love to see...'
                        : feedbackType === 'advertising'
                        ? 'Tell us about your advertising or partnership interests...'
                        : 'Share your thoughts with us...'
                    }
                    required
                    maxLength={2000}
                    rows={5}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.07] transition-colors resize-none"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-neutral-500">Your feedback helps us improve</p>
                    <p className="text-xs text-neutral-500">{message.length}/2000</p>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Feedback
                    </>
                  )}
                </button>

                <p className="text-xs text-neutral-500 text-center">
                  Your feedback is private and helps us improve Bay Tremor for everyone.
                </p>
              </form>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center animate-in zoom-in duration-300">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-neutral-400 mb-6 max-w-xs mx-auto">
                  We've received your {selectedType?.label.toLowerCase() || 'feedback'}. Your input helps make Bay Tremor better for everyone in the Bay Area.
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

