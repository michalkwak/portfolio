// Every project on the home page is a poster. `pattern` picks the halftone
// field in src/scripts/patterns.ts; `structure` is what the x-ray lens reveals.
// A `live` poster instead runs an animated figure from src/scripts/figures/,
// whose own x-ray replaces the structure list.
import { LOW_LINE_PERCENT } from '../scripts/figures/glucose';

export type Pattern = 'glucose' | 'graph' | 'eigen' | 'squeeze' | 'finland' | 'koi';

export interface Callout {
  label: string;
  /** Point the line touches, in % of the poster. */
  at: [number, number];
  /** Where the label sits, in % of the poster. */
  from: [number, number];
  align?: 'left' | 'right';
}

export interface Project {
  id: string;
  index: string;
  kind: string;
  year: string;
  /** The giant vertical word. */
  word: string;
  title: string;
  blurb: string;
  tags: string[];
  href: string;
  pattern: Pattern;
  colors: { bg: string; ink: string; xrayBg?: string; xrayFg?: string };
  callouts: Callout[];
  /** Dashed reference line across the poster, at this % from the top. */
  rule?: { y: number; label: string };
  structure: string[];
  /** Headline result, printed on the poster. */
  finding?: string;
  live?: 'glucose' | 'squeeze';
  featured?: boolean;
}

const GITHUB = 'https://github.com/michalkwak';

export const projects: Project[] = [
  {
    id: 'cgm',
    index: '001',
    kind: 'Thesis research',
    year: '2026 — ongoing',
    word: 'Glucose',
    title: 'Predicting hypoglycaemia from CGM data',
    blurb:
      'Dave’s random forest, Shao’s BiLSTM, XGBoost and logistic regression, re-run on one public cohort with identical rows, labels and held-out participants.',
    tags: ['Python', 'PyTorch', 'scikit-learn', 'XGBoost'],
    href: '#work',
    pattern: 'glucose',
    colors: { bg: '#a597dd', ink: '#141215' },
    live: 'glucose',
    rule: { y: LOW_LINE_PERCENT, label: '70 mg/dL' },
    callouts: [],
    structure: [
      '8.29 M CGM readings · CITY trial, 153 participants',
      'split into gap-free segments',
      '6.6 M prediction times, one participant split',
      'RF · XGBoost · logistic regression · BiLSTM',
      'participant-bootstrap confidence intervals',
      'real-time alarm simulation',
    ],
    finding: 'Model choice moved AUC by ~0.3 points; evaluation choices moved AP by 20–36. Single split, so far.',
    featured: true,
  },
  {
    id: 'syllabuss',
    index: '002',
    kind: 'Startup',
    year: '2025 — now',
    word: 'Syllabuss',
    title: 'Syllabuss',
    blurb: 'Co-founder and developer of a study-planning platform that makes degree structures navigable.',
    tags: ['Full-stack', 'Git', 'User research'],
    href: '#work',
    pattern: 'graph',
    colors: { bg: '#ff6b35', ink: '#151210' },
    callouts: [{ label: 'Prerequisite', at: [42, 28], from: [96, 16], align: 'right' }],
    structure: [
      'degree structure data',
      'backend tools for processing it',
      'frontend for planning a degree',
      'outreach across faculties',
      'feedback back into the product',
    ],
  },
  {
    id: 'face',
    index: '003',
    kind: 'Algorithms',
    year: '2026',
    word: 'Eigen',
    title: 'Face recognition with a hand-written Jacobi solver',
    blurb: 'Eigenfaces on top of a cyclic Jacobi eigendecomposition written from scratch, with unit and end-to-end tests.',
    tags: ['Python', 'NumPy', 'Testing'],
    href: `${GITHUB}/Face-Recognition`,
    pattern: 'eigen',
    colors: { bg: '#121211', ink: '#e9e2d3', xrayBg: '#e9e2d3', xrayFg: '#121211' },
    callouts: [{ label: 'Eigenface 01', at: [39, 41], from: [96, 14], align: 'right' }],
    structure: [
      'face images → mean-centred matrix',
      'covariance matrix',
      'cyclic Jacobi rotations, from scratch',
      'eigenfaces',
      'project & match in face space',
    ],
  },
  {
    id: 'tomography',
    index: '004',
    kind: 'Simulation',
    year: '2026 — now',
    word: 'Squeeze',
    title: 'Gaussian state tomography of toy Hawking radiation',
    blurb: 'Simulates Hawking/Unruh radiation as a two-mode squeezed state, then reconstructs it from simulated measurements.',
    tags: ['Python', 'NumPy', 'Quantum optics'],
    href: `${GITHUB}/Gaussian-State-Tomography-of-Hawking-Unruh-Toy-Radiation`,
    pattern: 'squeeze',
    live: 'squeeze',
    colors: { bg: '#e4572e', ink: '#120f0e' },
    callouts: [{ label: 'W(x₁, x₂)', at: [66, 32], from: [96, 16], align: 'right' }],
    structure: [
      'two-mode squeezed state',
      'joint · homodyne · heterodyne detection',
      'simulated measurement samples',
      'reconstructed covariance matrix',
    ],
  },
  {
    id: 'resilience',
    index: '005',
    kind: 'Hackathon',
    year: '2026',
    word: 'Resilience',
    title: 'Finnish municipal economic resilience index',
    blurb: 'An ETL pipeline merging three open datasets into one comparable index for every Finnish municipality.',
    tags: ['Python', 'pandas', 'ETL'],
    href: `${GITHUB}/Finnish-Municipal-Economic-Resilience-Index`,
    pattern: 'finland',
    colors: { bg: '#e8e1d2', ink: '#1d3a2c' },
    callouts: [{ label: 'Helsinki', at: [46, 73], from: [96, 62], align: 'right' }],
    structure: [
      'three open datasets',
      'clean & join by municipality',
      'normalise each indicator',
      'weight income · employment · population',
      'index for trend & cross-municipality comparison',
    ],
  },
  {
    id: 'kana',
    index: '006',
    kind: 'Game',
    year: '2023 — 24',
    word: 'カナ',
    title: 'Kana Quest',
    blurb: 'A 2D Unity quiz game for practising Japanese kana.',
    tags: ['C#', 'Unity'],
    href: `${GITHUB}/Kana-Quest`,
    pattern: 'koi',
    colors: { bg: '#1f47c9', ink: '#ffcf33' },
    callouts: [{ label: 'Koi / 鯉', at: [62, 13], from: [96, 30], align: 'right' }],
    structure: ['quiz engine', 'modular game logic', 'UI systems', 'playtesting & bug tracking'],
  },
];
