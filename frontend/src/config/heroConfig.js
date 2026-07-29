/**
 * heroConfig.js — edit this file to change the hero section seasonally.
 * No code logic needed: just update the text, emojis, and theme colors here.
 */

export const HERO = {
  /* ── Badge (top pill) ────────────────────── */
  badge: {
    emoji: '🌿',
    text:  '100% Organic',
  },

  /* ── Headline ────────────────────────────── */
  headline: [
    { text: 'Farm-Fresh Dairy, ',   accent: false              },
    { text: 'Pure & Fast',         accent: true               },
    { text: 'at Your Door by 7 AM', accent: false, newLine: true },
  ],

  /* ── Subtitle ────────────────────────────── */
  subtitle: 'Milk, paneer, ghee & more — zero adulteration, doorstep delivery every morning.',

  /* ── Mobile/tablet hero (≤1024px dedicated design) ── */
  mobileHero: {
    accent:   '100% FRESH & ORGANIC',
    headline: ['Moo-re Fresh,', 'Moo-re Happy! 🐄'],
  },

  /* ── CTA Buttons ─────────────────────────── */
  cta: {
    primary:   '🛒 Shop Now',
    secondary: 'Explore Products →',
  },

  /* ── Trust row ───────────────────────────── */
  trust: [
    { emoji: '⭐',       text: '4.8/5 Rating'   },
    { emoji: '👨‍👩‍👧', text: '50K+ Families'  },
    { emoji: '🚚',       text: 'Before 7 AM'    },
  ],

  /* ── "How It Works" steps (right card) ───── */
  steps: [
    { num: 1, emoji: '🛒', title: 'Browse & Choose',   desc: 'Explore 50+ fresh dairy products — milk, paneer, ghee, curd, eggs and more.' },
    { num: 2, emoji: '📅', title: 'Set Your Schedule',  desc: 'Choose daily, alternate days, or custom delivery days to fit your lifestyle.' },
    { num: 3, emoji: '🚚', title: 'Doorstep Delivery',  desc: 'Wake up to fresh dairy products at your door — before 7 AM, every day.' },
  ],

  /* ── Stats grid (bottom of right card) ───── */
  stats: [
    { emoji: '👨‍👩‍👧', val: '50,000+', label: 'Happy Families'        },
    { emoji: '🥛',       val: '100%',    label: 'Farm Fresh Guaranteed' },
    { emoji: '🔬',       val: '18+',     label: 'Quality Tests Daily'   },
    { emoji: '⏰',       val: '< 7 AM',  label: 'Morning Delivery'      },
  ],

  /* ── Theme ───────────────────────────────── */
  theme: {
    bg:     'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 45%, #ecfdf5 75%, #f0fdf4 100%)',
    accent: '#16a34a',
  },
}
