import { useState } from 'react';
import { COUNTRIES } from '../data/countries';

// Defined outside UserSetup so React never remounts it on re-render (which would steal focus)
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-300 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function getDaysInMonth(month, year) {
  if (!month || !year) return 31;
  return new Date(Number(year), Number(month), 0).getDate();
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 120 }, (_, i) => currentYear - i);

export default function UserSetup({ onComplete }) {
  const [form, setForm] = useState({ name: '', country: '' });
  const [dob, setDob] = useState({ day: '', month: '', year: '' });
  const [errors, setErrors] = useState({});

  const daysInMonth = getDaysInMonth(dob.month, dob.year);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Please enter your name';
    if (!dob.day || !dob.month || !dob.year) {
      e.dob = 'Please complete your date of birth';
    } else {
      const dobDate = new Date(Number(dob.year), Number(dob.month) - 1, Number(dob.day));
      const age = (Date.now() - dobDate.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (age < 5 || age > 120) e.dob = 'Please enter a valid date of birth';
    }
    if (!form.country) e.country = 'Please select your country';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const dobStr = `${dob.year}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`;
    onComplete({ ...form, name: form.name.trim(), dob: dobStr, joinedAt: new Date().toISOString() });
  }

  const inputClass = "w-full bg-pitch-900 border-2 border-pitch-600 rounded-lg px-4 py-2.5 text-white " +
    "placeholder-slate-500 focus:border-gold-400 focus:outline-none transition-colors";
  const selectClass = "bg-pitch-900 border-2 border-pitch-600 rounded-lg px-3 py-2.5 text-white " +
    "focus:border-gold-400 focus:outline-none transition-colors";

  return (
    <div className="min-h-screen bg-pitch-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-500 opacity-5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600 opacity-5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-3xl font-black text-white tracking-tight">World Cup 2026</h1>
          <p className="text-gold-400 font-bold text-lg mt-1">Match Predictor</p>
          <p className="text-slate-400 text-sm mt-2">USA · Canada · Mexico</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-white mb-1">Create your profile</h2>
          <p className="text-slate-400 text-sm mb-6">Set up your predictor account to get started</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            <Field label="Your Name" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(v => ({ ...v, name: '' })); }}
                placeholder="e.g. Jamie Clarke"
                autoComplete="given-name"
                className={inputClass}
              />
            </Field>

            <Field label="Date of Birth" error={errors.dob}>
              <div className="grid grid-cols-3 gap-2">
                {/* Day */}
                <select
                  value={dob.day}
                  onChange={e => { setDob(d => ({ ...d, day: e.target.value })); setErrors(v => ({ ...v, dob: '' })); }}
                  className={selectClass + ' w-full'}
                >
                  <option value="">Day</option>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Month */}
                <select
                  value={dob.month}
                  onChange={e => {
                    const newMonth = e.target.value;
                    const maxDay = getDaysInMonth(newMonth, dob.year);
                    setDob(d => ({ ...d, month: newMonth, day: d.day > maxDay ? '' : d.day }));
                    setErrors(v => ({ ...v, dob: '' }));
                  }}
                  className={selectClass + ' w-full'}
                >
                  <option value="">Month</option>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>

                {/* Year */}
                <select
                  value={dob.year}
                  onChange={e => {
                    const newYear = e.target.value;
                    const maxDay = getDaysInMonth(dob.month, newYear);
                    setDob(d => ({ ...d, year: newYear, day: d.day > maxDay ? '' : d.day }));
                    setErrors(v => ({ ...v, dob: '' }));
                  }}
                  className={selectClass + ' w-full'}
                >
                  <option value="">Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Country of Residence" error={errors.country}>
              <select
                value={form.country}
                onChange={e => { setForm(f => ({ ...f, country: e.target.value })); setErrors(v => ({ ...v, country: '' })); }}
                className={inputClass}
              >
                <option value="">Select your country…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <button type="submit" className="btn-primary w-full py-3 text-base mt-2">
              Start Predicting →
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          Your data is stored locally in your browser only
        </p>
      </div>
    </div>
  );
}
