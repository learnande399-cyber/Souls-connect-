import React from 'react';
import { X, ShieldCheck, Heart, Lock, AlertCircle, EyeOff } from 'lucide-react';

interface SafetyGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyGuidelinesModal: React.FC<SafetyGuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1E1120] rounded-3xl shadow-2xl border border-rose-100 dark:border-rose-950/60 p-6 sm:p-8 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
                Community Guidelines & Safety
              </h2>
              <p className="text-xs text-rose-500 font-medium">SoulConnect Trust & Safety Pledge</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5 space-y-6 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed pr-1">
          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>1. Lead with Kindness and Empathy</span>
            </h3>
            <p>
              SoulConnect exists for real people seeking thoughtful conversations. Treat every member with respect and basic human decency. We do not tolerate harassment, bullying, derogatory remarks, or hate speech of any kind.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-rose-500" />
              <span>2. Safeguard Your Personal Information</span>
            </h3>
            <p>
              Never share sensitive financial information, passwords, exact home addresses, phone numbers, or government IDs with strangers online. SoulConnect never asks for your password in chat.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-500" />
              <span>3. 18+ Adult Community</span>
            </h3>
            <p>
              SoulConnect is strictly for adults aged 18 and older. Any profile discovered to belong to a minor will be removed immediately.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>4. Anti-Scam & Commercial Solicitation</span>
            </h3>
            <p>
              Using SoulConnect to solicit money, promote commercial services, send spam links, or impersonate other individuals is grounds for immediate, permanent suspension.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>5. Proactive Blocking & Reporting</span>
            </h3>
            <p>
              If anyone makes you feel uncomfortable, you can instantly block them using the profile menu. Blocked members can never view your profile or message you. Reports are reviewed by our moderation team anonymously.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-rose-100 dark:border-rose-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/25"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
