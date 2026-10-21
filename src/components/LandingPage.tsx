import React from 'react';
import {
  Heart,
  MessageCircleHeart,
  Sparkles,
  ShieldCheck,
  Compass,
  Users,
  Lock,
  ArrowRight,
  EyeOff
} from 'lucide-react';

interface LandingPageProps {
  onJoin: () => void;
  onExplore: () => void;
  onOpenGuidelines: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onJoin,
  onExplore,
  onOpenGuidelines,
}) => {
  return (
    <div className="min-h-screen bg-romantic-gradient text-neutral-800 dark:text-neutral-100 flex flex-col justify-between selection:bg-rose-200 selection:text-rose-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Soft background ambient glowing orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-300/20 dark:bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-300/20 dark:bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Soul Tag Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-[#251528]/80 border border-rose-200 dark:border-rose-900/60 shadow-xs backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300">
              A Warm Space for Genuine Connections
            </span>
          </div>

          {/* Heading from requirements */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-serif-romantic text-neutral-900 dark:text-white leading-[1.15]">
            Meet Someone New.{' '}
            <span className="block mt-1 text-gradient-romantic">
              Make It Meaningful.
            </span>
          </h1>

          {/* Supporting text from requirements */}
          <p className="mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Discover people, share your world, and start conversations that matter.
            SoulConnect is a stranger social network built around authenticity, mutual respect, and heartfelt interaction.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={onJoin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:to-purple-600 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Join SoulConnect</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExplore}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-base font-medium text-neutral-700 dark:text-neutral-200 bg-white/90 dark:bg-neutral-800/80 border border-rose-100 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-neutral-800 shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-rose-500" />
              <span>Explore the Community</span>
            </button>
          </div>

          {/* Aesthetic Card Showcase */}
          <div className="mt-14 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-white/70 dark:bg-[#201222]/80 backdrop-blur-md p-5 rounded-2xl border border-rose-100 dark:border-rose-950/60 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 mb-3">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-base">Serendipitous Discovery</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Connect with verified strangers who share your passions for late-night talks, indie tunes, or stargazing.
              </p>
            </div>

            <div className="bg-white/70 dark:bg-[#201222]/80 backdrop-blur-md p-5 rounded-2xl border border-rose-100 dark:border-rose-950/60 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-500 mb-3">
                <MessageCircleHeart className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-base">Real-Time Private Chat</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Instant one-on-one messaging with active presence, read receipts, and complete end-to-end user isolation.
              </p>
            </div>

            <div className="bg-white/70 dark:bg-[#201222]/80 backdrop-blur-md p-5 rounded-2xl border border-rose-100 dark:border-rose-950/60 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/40 flex items-center justify-center text-pink-500 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white text-base">Safety & Kindness</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                One-click blocking, anonymous reporting, PII isolation, and zero-tolerance moderation for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-16 bg-white/60 dark:bg-[#1A0E1C]/60 border-y border-rose-100 dark:border-rose-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
              Designed for Meaningful Human Connection
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
              Unlike ephemeral swipe apps or chaotic forums, SoulConnect brings together slow social sharing and real conversations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#231426] border border-rose-100 dark:border-rose-900/40 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Thoughtful Profiles & Soul Tags
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Showcase your unique interests, short bio, and authentic personality. Choose what you share: you have full control over whether your age, city, and online status are visible to others.
              </p>
              <ul className="text-xs space-y-2 text-neutral-500 dark:text-neutral-400 pt-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Calculated age verification (18+ only) with birthdates stored in isolated private collections
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Curated lifestyle interests from deep conversations to literature and music
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-white dark:bg-[#231426] border border-rose-100 dark:border-rose-900/40 shadow-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Community Musings Feed
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Broadcast your midnight musings, story excerpts, and daily reflections to the community. Reply with genuine empathy and discover kindred spirits who appreciate your thoughts.
              </p>
              <ul className="text-xs space-y-2 text-neutral-500 dark:text-neutral-400 pt-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Post categories like Romantic Musing, Deep Questions, and Storytime
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Real-time interactive comments and heart reactions
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Privacy Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-500 mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-romantic text-neutral-900 dark:text-white">
            Your Privacy & Safety Come First
          </h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto">
            Meeting people online should feel safe and respectful. SoulConnect provides strong protections built into every level:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-left">
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1E1120]/80 border border-rose-100 dark:border-rose-950/60">
              <EyeOff className="w-5 h-5 text-rose-500 mb-2" />
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">Zero PII Exposure</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Your email, full date of birth, and credentials are never visible to other members.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1E1120]/80 border border-rose-100 dark:border-rose-950/60">
              <ShieldCheck className="w-5 h-5 text-rose-500 mb-2" />
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">Instant Block & Report</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Immediately block and report any inappropriate behavior. Blocked users can never see your profile or message you.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#1E1120]/80 border border-rose-100 dark:border-rose-950/60">
              <Users className="w-5 h-5 text-rose-500 mb-2" />
              <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">18+ Community</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                A mature community environment requiring age verification for a respectful experience.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={onOpenGuidelines}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Read our full Community Guidelines & Safety Tips →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-rose-100 dark:border-rose-950/40 bg-white/80 dark:bg-[#140B16]/80 py-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="font-bold text-neutral-800 dark:text-neutral-200">SoulConnect</span>
            <span>— Meet Someone New. Make It Meaningful.</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenGuidelines} className="hover:text-rose-500 transition-colors">
              Safety & Guidelines
            </button>
            <button onClick={onJoin} className="hover:text-rose-500 transition-colors">
              Create Account
            </button>
            <button onClick={onJoin} className="hover:text-rose-500 transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
