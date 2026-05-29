const trophyImg = '/world-cup-2026-trophy.webp';

const ERROR_CONFIG = {
  404: {
    title: 'Page Not Found',
    message: "We couldn't find the page you're looking for. It may have been moved or never existed.",
    icon: '🔍',
  },
  401: {
    title: 'Sign In Required',
    message: "You need to be signed in to view this page.",
    icon: '🔒',
  },
  403: {
    title: 'Access Denied',
    message: "You don't have permission to view this page.",
    icon: '⛔',
  },
  500: {
    title: 'Something Went Wrong',
    message: "We hit an unexpected error on our end. Please try refreshing the page.",
    icon: '⚙️',
  },
};

export default function ErrorPage({ code = 404, onGoHome }) {
  const config = ERROR_CONFIG[code] ?? ERROR_CONFIG[404];

  return (
    <div className="min-h-screen bg-pitch-900 flex flex-col items-center justify-center px-4 text-center">

      {/* Trophy */}
      <img
        src={trophyImg}
        alt="World Cup Trophy"
        className="h-20 w-auto mb-6 opacity-60"
      />

      {/* Error code */}
      <div className="text-8xl font-black text-pitch-700 leading-none mb-2 select-none">
        {code}
      </div>

      {/* Icon + title */}
      <div className="text-4xl mb-3">{config.icon}</div>
      <h1 className="text-2xl font-black text-white mb-3">{config.title}</h1>

      {/* Message */}
      <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
        {config.message}
      </p>

      {/* Branding */}
      <p className="text-gold-400 text-xs font-semibold mb-8 tracking-wide uppercase">
        World Cup 2026 · Match Predictor
      </p>

      {/* CTA */}
      <button
        onClick={onGoHome}
        className="btn-primary px-8 py-3 font-bold text-sm"
      >
        ← Back to Home
      </button>
    </div>
  );
}
