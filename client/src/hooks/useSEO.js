import { useEffect } from 'react';

const SITE = 'World Cup 2026 Predictor';
const BASE_URL = 'https://www.playworldcup26.com';

const PAGE_META = {
  signin: {
    title: `Sign In | ${SITE}`,
    description: 'Sign in to your World Cup 2026 Predictor account to manage your predictions and league standings.',
  },
  signup: {
    title: `Create Account | ${SITE}`,
    description: 'Create a free account and start predicting scores for every World Cup 2026 match.',
  },
  predictions: {
    title: `Make Your Predictions | ${SITE}`,
    description: 'Pick your scores for every World Cup 2026 group stage and knockout match. Earn points for correct results, goal differences, and exact scorelines.',
  },
  results: {
    title: `My Results | ${SITE}`,
    description: 'See how your World Cup 2026 predictions are stacking up. Track your points, exact scores, and correct results match by match.',
  },
  leaderboard: {
    title: `Global Leaderboard | ${SITE}`,
    description: 'See where you rank against all players on the World Cup 2026 Predictor global leaderboard.',
  },
  league: {
    title: `My League | ${SITE}`,
    description: 'Compete in private mini leagues with friends and family. Create a league, share your code, and track your standings.',
  },
  rules: {
    title: `How to Play | ${SITE}`,
    description: 'Learn the scoring rules for the World Cup 2026 Predictor. Find out how points are awarded for exact scores, correct results, and goal differences.',
  },
  admin: {
    title: `Admin | ${SITE}`,
    description: 'World Cup 2026 Predictor admin panel.',
  },
  preferences: {
    title: `Preferences | ${SITE}`,
    description: 'Customise your World Cup 2026 Predictor experience — theme, notifications, favourite team and more.',
  },
  settings: {
    title: `Account Settings | ${SITE}`,
    description: 'Manage your World Cup 2026 Predictor account — update your display name, email, and password.',
  },
};

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setOGMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSEO(activeTab) {
  useEffect(() => {
    const meta = PAGE_META[activeTab] ?? PAGE_META.predictions;

    document.title = meta.title;
    setMeta('description', meta.description);

    // Update OG tags for sharing current page
    setOGMeta('og:title', meta.title);
    setOGMeta('og:description', meta.description);
    setOGMeta('og:url', `${BASE_URL}/${activeTab}`);

    // Update Twitter tags
    setMeta('twitter:title', meta.title);
    setMeta('twitter:description', meta.description);
  }, [activeTab]);
}
