// World Cup 2026 – Official fixture data (draw: December 5, 2025, Washington D.C.)
// 48 teams · 12 groups (A–L) · 72 group stage matches
// All times shown in BST (UK) in 24-hour format. Source: Sky Sports fixture schedule.

export const TEAMS = {
  // Group A
  'Mexico':                { code: 'mx', confederation: 'CONCACAF' },
  'South Africa':          { code: 'za', confederation: 'CAF' },
  'South Korea':           { code: 'kr', confederation: 'AFC' },
  'Czechia':               { code: 'cz', confederation: 'UEFA' },
  // Group B
  'Canada':                { code: 'ca', confederation: 'CONCACAF' },
  'Bosnia & Herzegovina':  { code: 'ba', confederation: 'UEFA' },
  'Qatar':                 { code: 'qa', confederation: 'AFC' },
  'Switzerland':           { code: 'ch', confederation: 'UEFA' },
  // Group C
  'Brazil':                { code: 'br', confederation: 'CONMEBOL' },
  'Morocco':               { code: 'ma', confederation: 'CAF' },
  'Haiti':                 { code: 'ht', confederation: 'CONCACAF' },
  'Scotland':              { code: 'gb-sct', confederation: 'UEFA' },
  // Group D
  'USA':                   { code: 'us', confederation: 'CONCACAF' },
  'Paraguay':              { code: 'py', confederation: 'CONMEBOL' },
  'Australia':             { code: 'au', confederation: 'AFC' },
  'Turkey':                { code: 'tr', confederation: 'UEFA' },
  // Group E
  'Germany':               { code: 'de', confederation: 'UEFA' },
  'Curaçao':               { code: 'cw', confederation: 'CONCACAF' },
  'Ivory Coast':           { code: 'ci', confederation: 'CAF' },
  'Ecuador':               { code: 'ec', confederation: 'CONMEBOL' },
  // Group F
  'Netherlands':           { code: 'nl', confederation: 'UEFA' },
  'Japan':                 { code: 'jp', confederation: 'AFC' },
  'Sweden':                { code: 'se', confederation: 'UEFA' },
  'Tunisia':               { code: 'tn', confederation: 'CAF' },
  // Group G
  'Belgium':               { code: 'be', confederation: 'UEFA' },
  'Egypt':                 { code: 'eg', confederation: 'CAF' },
  'Iran':                  { code: 'ir', confederation: 'AFC' },
  'New Zealand':           { code: 'nz', confederation: 'OFC' },
  // Group H
  'Spain':                 { code: 'es', confederation: 'UEFA' },
  'Cape Verde':            { code: 'cv', confederation: 'CAF' },
  'Saudi Arabia':          { code: 'sa', confederation: 'AFC' },
  'Uruguay':               { code: 'uy', confederation: 'CONMEBOL' },
  // Group I
  'France':                { code: 'fr', confederation: 'UEFA' },
  'Senegal':               { code: 'sn', confederation: 'CAF' },
  'Iraq':                  { code: 'iq', confederation: 'AFC' },
  'Norway':                { code: 'no', confederation: 'UEFA' },
  // Group J
  'Argentina':             { code: 'ar', confederation: 'CONMEBOL' },
  'Algeria':               { code: 'dz', confederation: 'CAF' },
  'Austria':               { code: 'at', confederation: 'UEFA' },
  'Jordan':                { code: 'jo', confederation: 'AFC' },
  // Group K
  'Portugal':              { code: 'pt', confederation: 'UEFA' },
  'DR Congo':              { code: 'cd', confederation: 'CAF' },
  'Uzbekistan':            { code: 'uz', confederation: 'AFC' },
  'Colombia':              { code: 'co', confederation: 'CONMEBOL' },
  // Group L
  'England':               { code: 'gb-eng', confederation: 'UEFA' },
  'Croatia':               { code: 'hr', confederation: 'UEFA' },
  'Ghana':                 { code: 'gh', confederation: 'CAF' },
  'Panama':                { code: 'pa', confederation: 'CONCACAF' },
};

export const GROUPS = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czechia'],
  B: ['Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['USA', 'Paraguay', 'Australia', 'Turkey'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

// 72 group stage fixtures — all times in BST (UK). Sorted chronologically.
// Round 3 matches within the same group kick off simultaneously (marked simultaneous: true)
export const FIXTURES = [
  // ── GROUP A ──────────────────────────────────────────────────────────────
  { id: 'A1', group: 'A', round: 1, homeTeam: 'Mexico',       awayTeam: 'South Africa', date: '2026-06-11', kickoff: '20:00 BST',   stadium: 'Estadio Azteca',           city: 'Mexico City',         hostCountry: 'Mexico' },
  { id: 'A2', group: 'A', round: 1, homeTeam: 'South Korea',  awayTeam: 'Czechia',      date: '2026-06-12', kickoff: '03:00 BST',   stadium: 'Estadio AKRON',            city: 'Guadalajara',         hostCountry: 'Mexico' },
  { id: 'A3', group: 'A', round: 2, homeTeam: 'Czechia',      awayTeam: 'South Africa', date: '2026-06-18', kickoff: '17:00 BST',   stadium: 'Mercedes-Benz Stadium',    city: 'Atlanta, GA',         hostCountry: 'USA' },
  { id: 'A4', group: 'A', round: 2, homeTeam: 'Mexico',       awayTeam: 'South Korea',  date: '2026-06-19', kickoff: '02:00 BST',   stadium: 'Estadio AKRON',            city: 'Guadalajara',         hostCountry: 'Mexico' },
  { id: 'A5', group: 'A', round: 3, homeTeam: 'Czechia',      awayTeam: 'Mexico',       date: '2026-06-25', kickoff: '02:00 BST',   stadium: 'Estadio Azteca',           city: 'Mexico City',         hostCountry: 'Mexico',  simultaneous: true },
  { id: 'A6', group: 'A', round: 3, homeTeam: 'South Africa', awayTeam: 'South Korea',  date: '2026-06-25', kickoff: '02:00 BST',   stadium: 'Estadio BBVA',             city: 'Monterrey',           hostCountry: 'Mexico',  simultaneous: true },

  // ── GROUP B ──────────────────────────────────────────────────────────────
  { id: 'B1', group: 'B', round: 1, homeTeam: 'Canada',               awayTeam: 'Bosnia & Herzegovina', date: '2026-06-12', kickoff: '20:00 BST',   stadium: 'BMO Field',                city: 'Toronto, ON',         hostCountry: 'Canada' },
  { id: 'B2', group: 'B', round: 1, homeTeam: 'Qatar',                awayTeam: 'Switzerland',          date: '2026-06-13', kickoff: '20:00 BST',   stadium: "Levi's Stadium",           city: 'Santa Clara, CA',     hostCountry: 'USA' },
  { id: 'B3', group: 'B', round: 2, homeTeam: 'Switzerland',          awayTeam: 'Bosnia & Herzegovina', date: '2026-06-18', kickoff: '20:00 BST',   stadium: 'SoFi Stadium',             city: 'Inglewood, CA',       hostCountry: 'USA' },
  { id: 'B4', group: 'B', round: 2, homeTeam: 'Canada',               awayTeam: 'Qatar',                date: '2026-06-18', kickoff: '23:00 BST',  stadium: 'BC Place',                 city: 'Vancouver, BC',       hostCountry: 'Canada' },
  { id: 'B5', group: 'B', round: 3, homeTeam: 'Switzerland',          awayTeam: 'Canada',               date: '2026-06-24', kickoff: '20:00 BST',   stadium: 'BC Place',                 city: 'Vancouver, BC',       hostCountry: 'Canada',  simultaneous: true },
  { id: 'B6', group: 'B', round: 3, homeTeam: 'Bosnia & Herzegovina', awayTeam: 'Qatar',                date: '2026-06-24', kickoff: '20:00 BST',   stadium: 'Lumen Field',              city: 'Seattle, WA',         hostCountry: 'USA',     simultaneous: true },

  // ── GROUP C ──────────────────────────────────────────────────────────────
  { id: 'C1', group: 'C', round: 1, homeTeam: 'Brazil',   awayTeam: 'Morocco',  date: '2026-06-13', kickoff: '23:00 BST',  stadium: 'MetLife Stadium',          city: 'East Rutherford, NJ', hostCountry: 'USA' },
  { id: 'C2', group: 'C', round: 1, homeTeam: 'Haiti',    awayTeam: 'Scotland', date: '2026-06-14', kickoff: '02:00 BST',   stadium: 'Gillette Stadium',         city: 'Foxborough, MA',      hostCountry: 'USA' },
  { id: 'C3', group: 'C', round: 2, homeTeam: 'Scotland', awayTeam: 'Morocco',  date: '2026-06-19', kickoff: '23:00 BST',  stadium: 'Gillette Stadium',         city: 'Foxborough, MA',      hostCountry: 'USA' },
  { id: 'C4', group: 'C', round: 2, homeTeam: 'Brazil',   awayTeam: 'Haiti',    date: '2026-06-20', kickoff: '02:00 BST',   stadium: 'Lincoln Financial Field',  city: 'Philadelphia, PA',    hostCountry: 'USA' },
  { id: 'C5', group: 'C', round: 3, homeTeam: 'Scotland', awayTeam: 'Brazil',   date: '2026-06-24', kickoff: '23:00 BST',  stadium: 'Hard Rock Stadium',        city: 'Miami Gardens, FL',   hostCountry: 'USA',     simultaneous: true },
  { id: 'C6', group: 'C', round: 3, homeTeam: 'Morocco',  awayTeam: 'Haiti',    date: '2026-06-24', kickoff: '23:00 BST',  stadium: 'Mercedes-Benz Stadium',    city: 'Atlanta, GA',         hostCountry: 'USA',     simultaneous: true },

  // ── GROUP D ──────────────────────────────────────────────────────────────
  { id: 'D1', group: 'D', round: 1, homeTeam: 'USA',       awayTeam: 'Paraguay',  date: '2026-06-13', kickoff: '02:00 BST',   stadium: 'SoFi Stadium',             city: 'Inglewood, CA',       hostCountry: 'USA' },
  { id: 'D2', group: 'D', round: 1, homeTeam: 'Australia', awayTeam: 'Turkey',    date: '2026-06-14', kickoff: '05:00 BST',   stadium: 'BC Place',                 city: 'Vancouver, BC',       hostCountry: 'Canada' },
  { id: 'D3', group: 'D', round: 2, homeTeam: 'USA',       awayTeam: 'Australia', date: '2026-06-19', kickoff: '20:00 BST',   stadium: 'Lumen Field',              city: 'Seattle, WA',         hostCountry: 'USA' },
  { id: 'D4', group: 'D', round: 2, homeTeam: 'Turkey',    awayTeam: 'Paraguay',  date: '2026-06-20', kickoff: '05:00 BST',   stadium: "Levi's Stadium",           city: 'Santa Clara, CA',     hostCountry: 'USA' },
  { id: 'D5', group: 'D', round: 3, homeTeam: 'Turkey',    awayTeam: 'USA',       date: '2026-06-26', kickoff: '03:00 BST',   stadium: 'SoFi Stadium',             city: 'Inglewood, CA',       hostCountry: 'USA',     simultaneous: true },
  { id: 'D6', group: 'D', round: 3, homeTeam: 'Paraguay',  awayTeam: 'Australia', date: '2026-06-26', kickoff: '03:00 BST',   stadium: "Levi's Stadium",           city: 'Santa Clara, CA',     hostCountry: 'USA',     simultaneous: true },

  // ── GROUP E ──────────────────────────────────────────────────────────────
  { id: 'E1', group: 'E', round: 1, homeTeam: 'Germany',      awayTeam: 'Curaçao',      date: '2026-06-14', kickoff: '18:00 BST',   stadium: 'NRG Stadium',              city: 'Houston, TX',         hostCountry: 'USA' },
  { id: 'E2', group: 'E', round: 1, homeTeam: 'Ivory Coast',  awayTeam: 'Ecuador',      date: '2026-06-15', kickoff: '00:00 BST',  stadium: 'Lincoln Financial Field',  city: 'Philadelphia, PA',    hostCountry: 'USA' },
  { id: 'E3', group: 'E', round: 2, homeTeam: 'Germany',      awayTeam: 'Ivory Coast',  date: '2026-06-20', kickoff: '21:00 BST',   stadium: 'BMO Field',                city: 'Toronto, ON',         hostCountry: 'Canada' },
  { id: 'E4', group: 'E', round: 2, homeTeam: 'Ecuador',      awayTeam: 'Curaçao',      date: '2026-06-21', kickoff: '01:00 BST',   stadium: 'Arrowhead Stadium',        city: 'Kansas City, MO',     hostCountry: 'USA' },
  { id: 'E5', group: 'E', round: 3, homeTeam: 'Curaçao',      awayTeam: 'Ivory Coast',  date: '2026-06-25', kickoff: '21:00 BST',   stadium: 'Lincoln Financial Field',  city: 'Philadelphia, PA',    hostCountry: 'USA',     simultaneous: true },
  { id: 'E6', group: 'E', round: 3, homeTeam: 'Ecuador',      awayTeam: 'Germany',      date: '2026-06-25', kickoff: '21:00 BST',   stadium: 'MetLife Stadium',          city: 'East Rutherford, NJ', hostCountry: 'USA',     simultaneous: true },

  // ── GROUP F ──────────────────────────────────────────────────────────────
  { id: 'F1', group: 'F', round: 1, homeTeam: 'Netherlands', awayTeam: 'Japan',    date: '2026-06-14', kickoff: '21:00 BST',   stadium: 'AT&T Stadium',             city: 'Arlington, TX',       hostCountry: 'USA' },
  { id: 'F2', group: 'F', round: 1, homeTeam: 'Sweden',      awayTeam: 'Tunisia',  date: '2026-06-15', kickoff: '03:00 BST',   stadium: 'Estadio BBVA',             city: 'Monterrey',           hostCountry: 'Mexico' },
  { id: 'F3', group: 'F', round: 2, homeTeam: 'Netherlands', awayTeam: 'Sweden',   date: '2026-06-20', kickoff: '18:00 BST',   stadium: 'NRG Stadium',              city: 'Houston, TX',         hostCountry: 'USA' },
  { id: 'F4', group: 'F', round: 2, homeTeam: 'Tunisia',     awayTeam: 'Japan',    date: '2026-06-21', kickoff: '05:00 BST',   stadium: 'Estadio BBVA',             city: 'Monterrey',           hostCountry: 'Mexico' },
  { id: 'F5', group: 'F', round: 3, homeTeam: 'Japan',       awayTeam: 'Sweden',   date: '2026-06-26', kickoff: '00:00 BST',  stadium: 'AT&T Stadium',             city: 'Arlington, TX',       hostCountry: 'USA',     simultaneous: true },
  { id: 'F6', group: 'F', round: 3, homeTeam: 'Tunisia',     awayTeam: 'Netherlands', date: '2026-06-26', kickoff: '00:00 BST', stadium: 'Arrowhead Stadium',       city: 'Kansas City, MO',     hostCountry: 'USA',     simultaneous: true },

  // ── GROUP G ──────────────────────────────────────────────────────────────
  { id: 'G1', group: 'G', round: 1, homeTeam: 'Belgium',     awayTeam: 'Egypt',       date: '2026-06-15', kickoff: '20:00 BST',   stadium: 'Lumen Field',              city: 'Seattle, WA',         hostCountry: 'USA' },
  { id: 'G2', group: 'G', round: 1, homeTeam: 'Iran',        awayTeam: 'New Zealand', date: '2026-06-16', kickoff: '02:00 BST',   stadium: 'SoFi Stadium',             city: 'Inglewood, CA',       hostCountry: 'USA' },
  { id: 'G3', group: 'G', round: 2, homeTeam: 'Belgium',     awayTeam: 'Iran',        date: '2026-06-21', kickoff: '20:00 BST',   stadium: 'SoFi Stadium',             city: 'Inglewood, CA',       hostCountry: 'USA' },
  { id: 'G4', group: 'G', round: 2, homeTeam: 'New Zealand', awayTeam: 'Egypt',       date: '2026-06-22', kickoff: '02:00 BST',   stadium: 'BC Place',                 city: 'Vancouver, BC',       hostCountry: 'Canada' },
  { id: 'G5', group: 'G', round: 3, homeTeam: 'Egypt',       awayTeam: 'Iran',        date: '2026-06-27', kickoff: '04:00 BST',   stadium: 'Lumen Field',              city: 'Seattle, WA',         hostCountry: 'USA',     simultaneous: true },
  { id: 'G6', group: 'G', round: 3, homeTeam: 'New Zealand', awayTeam: 'Belgium',     date: '2026-06-27', kickoff: '04:00 BST',   stadium: 'BC Place',                 city: 'Vancouver, BC',       hostCountry: 'Canada',  simultaneous: true },

  // ── GROUP H ──────────────────────────────────────────────────────────────
  { id: 'H1', group: 'H', round: 1, homeTeam: 'Spain',        awayTeam: 'Cape Verde',   date: '2026-06-15', kickoff: '17:00 BST',   stadium: 'Mercedes-Benz Stadium',    city: 'Atlanta, GA',         hostCountry: 'USA' },
  { id: 'H2', group: 'H', round: 1, homeTeam: 'Saudi Arabia', awayTeam: 'Uruguay',      date: '2026-06-15', kickoff: '23:00 BST',  stadium: 'Hard Rock Stadium',        city: 'Miami Gardens, FL',   hostCountry: 'USA' },
  { id: 'H3', group: 'H', round: 2, homeTeam: 'Spain',        awayTeam: 'Saudi Arabia', date: '2026-06-21', kickoff: '17:00 BST',   stadium: 'Mercedes-Benz Stadium',    city: 'Atlanta, GA',         hostCountry: 'USA' },
  { id: 'H4', group: 'H', round: 2, homeTeam: 'Uruguay',      awayTeam: 'Cape Verde',   date: '2026-06-21', kickoff: '23:00 BST',  stadium: 'Hard Rock Stadium',        city: 'Miami Gardens, FL',   hostCountry: 'USA' },
  { id: 'H5', group: 'H', round: 3, homeTeam: 'Cape Verde',   awayTeam: 'Saudi Arabia', date: '2026-06-27', kickoff: '01:00 BST',   stadium: 'NRG Stadium',              city: 'Houston, TX',         hostCountry: 'USA',     simultaneous: true },
  { id: 'H6', group: 'H', round: 3, homeTeam: 'Uruguay',      awayTeam: 'Spain',        date: '2026-06-27', kickoff: '01:00 BST',   stadium: 'Estadio AKRON',            city: 'Guadalajara',         hostCountry: 'Mexico',  simultaneous: true },

  // ── GROUP I ──────────────────────────────────────────────────────────────
  { id: 'I1', group: 'I', round: 1, homeTeam: 'France',   awayTeam: 'Senegal', date: '2026-06-16', kickoff: '20:00 BST',   stadium: 'MetLife Stadium',          city: 'East Rutherford, NJ', hostCountry: 'USA' },
  { id: 'I2', group: 'I', round: 1, homeTeam: 'Iraq',     awayTeam: 'Norway',  date: '2026-06-16', kickoff: '23:00 BST',  stadium: 'Gillette Stadium',         city: 'Foxborough, MA',      hostCountry: 'USA' },
  { id: 'I3', group: 'I', round: 2, homeTeam: 'France',   awayTeam: 'Iraq',    date: '2026-06-22', kickoff: '22:00 BST',  stadium: 'Lincoln Financial Field',  city: 'Philadelphia, PA',    hostCountry: 'USA' },
  { id: 'I4', group: 'I', round: 2, homeTeam: 'Norway',   awayTeam: 'Senegal', date: '2026-06-23', kickoff: '01:00 BST',   stadium: 'BMO Field',                city: 'Toronto, ON',         hostCountry: 'Canada' },
  { id: 'I5', group: 'I', round: 3, homeTeam: 'Norway',   awayTeam: 'France',  date: '2026-06-26', kickoff: '20:00 BST',   stadium: 'Gillette Stadium',         city: 'Foxborough, MA',      hostCountry: 'USA',     simultaneous: true },
  { id: 'I6', group: 'I', round: 3, homeTeam: 'Senegal',  awayTeam: 'Iraq',    date: '2026-06-26', kickoff: '20:00 BST',   stadium: 'BMO Field',                city: 'Toronto, ON',         hostCountry: 'Canada',  simultaneous: true },

  // ── GROUP J ──────────────────────────────────────────────────────────────
  { id: 'J1', group: 'J', round: 1, homeTeam: 'Argentina', awayTeam: 'Algeria',   date: '2026-06-17', kickoff: '02:00 BST',   stadium: 'Arrowhead Stadium',        city: 'Kansas City, MO',     hostCountry: 'USA' },
  { id: 'J2', group: 'J', round: 1, homeTeam: 'Austria',   awayTeam: 'Jordan',    date: '2026-06-17', kickoff: '05:00 BST',   stadium: "Levi's Stadium",           city: 'Santa Clara, CA',     hostCountry: 'USA' },
  { id: 'J3', group: 'J', round: 2, homeTeam: 'Argentina', awayTeam: 'Austria',   date: '2026-06-22', kickoff: '18:00 BST',   stadium: 'AT&T Stadium',             city: 'Arlington, TX',       hostCountry: 'USA' },
  { id: 'J4', group: 'J', round: 2, homeTeam: 'Jordan',    awayTeam: 'Algeria',   date: '2026-06-23', kickoff: '04:00 BST',   stadium: "Levi's Stadium",           city: 'Santa Clara, CA',     hostCountry: 'USA' },
  { id: 'J5', group: 'J', round: 3, homeTeam: 'Jordan',    awayTeam: 'Argentina', date: '2026-06-28', kickoff: '03:00 BST',   stadium: 'AT&T Stadium',             city: 'Arlington, TX',       hostCountry: 'USA',     simultaneous: true },
  { id: 'J6', group: 'J', round: 3, homeTeam: 'Algeria',   awayTeam: 'Austria',   date: '2026-06-28', kickoff: '03:00 BST',   stadium: 'Arrowhead Stadium',        city: 'Kansas City, MO',     hostCountry: 'USA',     simultaneous: true },

  // ── GROUP K ──────────────────────────────────────────────────────────────
  { id: 'K1', group: 'K', round: 1, homeTeam: 'Portugal',   awayTeam: 'DR Congo',    date: '2026-06-17', kickoff: '18:00 BST',   stadium: 'NRG Stadium',              city: 'Houston, TX',         hostCountry: 'USA' },
  { id: 'K2', group: 'K', round: 1, homeTeam: 'Uzbekistan', awayTeam: 'Colombia',    date: '2026-06-18', kickoff: '03:00 BST',   stadium: 'Estadio Azteca',           city: 'Mexico City',         hostCountry: 'Mexico' },
  { id: 'K3', group: 'K', round: 2, homeTeam: 'Portugal',   awayTeam: 'Uzbekistan',  date: '2026-06-23', kickoff: '18:00 BST',   stadium: 'NRG Stadium',              city: 'Houston, TX',         hostCountry: 'USA' },
  { id: 'K4', group: 'K', round: 2, homeTeam: 'Colombia',   awayTeam: 'DR Congo',    date: '2026-06-24', kickoff: '03:00 BST',   stadium: 'Estadio AKRON',            city: 'Guadalajara',         hostCountry: 'Mexico' },
  { id: 'K5', group: 'K', round: 3, homeTeam: 'Colombia',   awayTeam: 'Portugal',    date: '2026-06-28', kickoff: '00:30 BST',  stadium: 'Hard Rock Stadium',        city: 'Miami Gardens, FL',   hostCountry: 'USA',     simultaneous: true },
  { id: 'K6', group: 'K', round: 3, homeTeam: 'DR Congo',   awayTeam: 'Uzbekistan',  date: '2026-06-28', kickoff: '00:30 BST',  stadium: 'Mercedes-Benz Stadium',    city: 'Atlanta, GA',         hostCountry: 'USA',     simultaneous: true },

  // ── GROUP L ──────────────────────────────────────────────────────────────
  { id: 'L1', group: 'L', round: 1, homeTeam: 'England', awayTeam: 'Croatia', date: '2026-06-17', kickoff: '21:00 BST',   stadium: 'AT&T Stadium',             city: 'Arlington, TX',       hostCountry: 'USA' },
  { id: 'L2', group: 'L', round: 1, homeTeam: 'Ghana',   awayTeam: 'Panama',  date: '2026-06-18', kickoff: '00:00 BST',  stadium: 'BMO Field',                city: 'Toronto, ON',         hostCountry: 'Canada' },
  { id: 'L3', group: 'L', round: 2, homeTeam: 'England', awayTeam: 'Ghana',   date: '2026-06-23', kickoff: '21:00 BST',   stadium: 'Gillette Stadium',         city: 'Foxborough, MA',      hostCountry: 'USA' },
  { id: 'L4', group: 'L', round: 2, homeTeam: 'Panama',  awayTeam: 'Croatia', date: '2026-06-24', kickoff: '00:00 BST',  stadium: 'BMO Field',                city: 'Toronto, ON',         hostCountry: 'Canada' },
  { id: 'L5', group: 'L', round: 3, homeTeam: 'Panama',  awayTeam: 'England', date: '2026-06-27', kickoff: '22:00 BST',  stadium: 'MetLife Stadium',          city: 'East Rutherford, NJ', hostCountry: 'USA',     simultaneous: true },
  { id: 'L6', group: 'L', round: 3, homeTeam: 'Croatia', awayTeam: 'Ghana',   date: '2026-06-27', kickoff: '22:00 BST',  stadium: 'Lincoln Financial Field',  city: 'Philadelphia, PA',    hostCountry: 'USA',     simultaneous: true },
];

// Knockout stage placeholder fixtures (read-only preview — teams TBD)
export const KNOCKOUT_ROUNDS = [
  {
    name: 'Round of 32',
    dates: 'Jul 1–7, 2026',
    matches: Array.from({ length: 16 }, (_, i) => ({ id: `R32-${i + 1}`, homeTeam: 'TBD', awayTeam: 'TBD' })),
  },
  {
    name: 'Round of 16',
    dates: 'Jul 9–12, 2026',
    matches: Array.from({ length: 8 }, (_, i) => ({ id: `R16-${i + 1}`, homeTeam: 'TBD', awayTeam: 'TBD' })),
  },
  {
    name: 'Quarter-finals',
    dates: 'Jul 15–16, 2026',
    matches: Array.from({ length: 4 }, (_, i) => ({ id: `QF-${i + 1}`, homeTeam: 'TBD', awayTeam: 'TBD' })),
  },
  {
    name: 'Semi-finals',
    dates: 'Jul 19–20, 2026',
    matches: [
      { id: 'SF-1', homeTeam: 'TBD', awayTeam: 'TBD', note: 'MetLife Stadium, NJ' },
      { id: 'SF-2', homeTeam: 'TBD', awayTeam: 'TBD', note: 'AT&T Stadium, TX' },
    ],
  },
  {
    name: 'Third-place Play-off',
    dates: 'Jul 23, 2026',
    matches: [{ id: '3RD', homeTeam: 'TBD', awayTeam: 'TBD', note: 'Hard Rock Stadium, FL' }],
  },
  {
    name: 'Final',
    dates: 'Jul 26, 2026',
    matches: [{ id: 'FINAL', homeTeam: 'TBD', awayTeam: 'TBD', note: 'MetLife Stadium, East Rutherford NJ' }],
  },
];
