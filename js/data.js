// All site content lives here. Edit this file to change text, links or projects.
// Experience and projects show newest first, in the order written below.

window.PORTFOLIO = {
  name: "Michał Kwak",

  location: {
    city: "Helsinki",
    coords: "60.17° N · 24.94° E",
    timeZone: "Europe/Helsinki",
  },

  // "Currently" line in the bottom-left corner. `project` is the id of an
  // entry in `projects` that opens when it is clicked.
  now: {
    text: "Forecasting glucose 30 min ahead",
    project: "cgm-prediction",
  },

  // Text that circles the centrepiece. It repeats to fill the ring.
  ringText: "Spiral out · Keep going · Computer & Data Science · Machine learning · Software · ",

  // Bottom-right corner. Put the PDF in /cv and uncomment the CV line to show it.
  links: [
    { label: "GitHub", url: "https://github.com/michalkwak" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/michalkwak" },
    { label: "Email", url: "mailto:michal.kwak2806@gmail.com" },
    // { label: "CV", url: "cv/Michal_Kwak_CV.pdf" },
  ],

  about: {
    lead:
      "I build software for real problems: forecasting glucose with neural networks, simulating quantum states, and helping students find their way through a degree.",
    paragraphs: [
      "I'm a Computer & Data Science student at the University of Helsinki and a co-founder of Syllabuss. I'm happiest where data, algorithms and people meet: machine learning, numerical methods, and tools people actually use.",
      "Lately I've been focused on continuous glucose monitoring and diabetes technology. Away from the keyboard, visionary art shapes how I see things, Alex Grey's work above all, and Tool is usually playing. This page is a small nod to both.",
    ],
    facts: [
      ["Based in", "Helsinki, Finland"],
      ["Studying", "BSc Computer & Data Science, University of Helsinki, 2024 – present"],
      ["Building", "Syllabuss, Helsinki Incubator Program"],
      ["Languages", "English C2 · Polish native · Finnish A1 · Japanese JLPT N5"],
    ],
    skills: [
      {
        group: "Data & ML",
        items: ["Python", "pandas", "NumPy", "scikit-learn", "PyTorch", "XGBoost", "SQL", "R", "Statistical modelling", "Jupyter"],
      },
      {
        group: "Web & software",
        items: ["JavaScript", "React", "Node.js", "Express", "REST", "HTML/CSS", "C#", "Unity", "Postman"],
      },
      {
        group: "Tools & practice",
        items: ["Git & GitHub", "Linux", "VS Code", "Testing & debugging", "Agile"],
      },
      {
        group: "Research",
        items: ["CGM forecasting", "Quantum-state tomography", "Numerical linear algebra"],
      },
    ],
    courses: [
      "Data Analysis in Python",
      "Full Stack Web Development",
      "Data Structures and Algorithms I & II",
      "Introduction to Artificial Intelligence",
      "Databases",
      "Statistics and R I & II",
      "Software Engineering (Aalto University)",
      "Probability Calculus",
      "Linear Algebra",
    ],
  },

  experience: [
    {
      id: "syllabuss",
      period: "09/2025 – present",
      title: "Syllabuss",
      role: "Co-founder & developer · Helsinki Incubator Program",
      summary: "A student platform that makes academic planning and degree structures easier to navigate.",
      bullets: [
        "Co-founded the platform; I work across the frontend, backend and the data structures behind academic information.",
        "Built backend tools for processing and presenting course and degree data.",
        "Ran student outreach across faculties, then gathered and analysed feedback to steer the product.",
        "Team development with Git and GitHub.",
      ],
      tags: ["Frontend", "Backend", "Data modelling", "User research"],
    },
    {
      id: "ambassador",
      period: "03/2026 – present",
      title: "Study in Finland Ambassador",
      role: "Study in Finland",
      summary: "Showing international students what studying in Finland is really like.",
      bullets: [
        "Create social media content about student life in Finland for international audiences.",
        "Promote Finnish higher education and campus life at international events.",
      ],
      tags: ["Communication", "Content"],
    },
    {
      id: "tutor-coordinator",
      period: "01/2026 – present",
      title: "International Tutor Coordinator",
      role: "University of Helsinki",
      summary: "Running the international tutor programme for the Bachelor's Programme in Science.",
      bullets: [
        "Ran the selection process and interviews for the 2026 international tutors.",
        "Coordinated the programme and activities for the 2026 Orientation Week.",
      ],
      tags: ["Coordination", "Interviewing"],
    },
    {
      id: "teaching-assistant",
      period: "01/2026 – 05/2026",
      title: "Teaching Assistant",
      role: "Computer and Internet · University of Helsinki",
      summary: "Lab sessions on programming and technical problem solving.",
      bullets: [
        "Helped students debug their programs during practical lab sessions.",
        "Explained technical concepts to international student groups.",
      ],
      tags: ["Teaching", "Debugging"],
    },
  ],

  projects: [
    {
      id: "cgm-prediction",
      featured: true,
      period: "09/2026 – present",
      title: "CGM Prediction",
      role: "Diabetes ML research",
      summary: "Forecasting hypo- and hyperglycaemia 30 minutes ahead from continuous glucose monitor data.",
      bullets: [
        "LSTM on the OhioT1DM dataset: an hour of 5-minute CGM readings predicts whether glucose leaves 70–180 mg/dL in the next 30 minutes.",
        "Beats a 'current value' baseline on hypo recall (0.95 vs 0.61) on the test split; with tuned thresholds F1 is 0.73 for hypo and 0.93 for hyper.",
        "Manchester multimodal study: causal 5-minute feature tables for 17 participants (insulin, meals, activity, wearables, sleep).",
        "Leave-one-participant-out XGBoost comparing glucose-only and multimodal inputs. The extra modalities moved average precision by less than 0.005: glucose history carries the signal.",
      ],
      tags: ["Python", "PyTorch", "XGBoost", "pandas", "scikit-learn"],
      links: [{ label: "Repository", url: "https://github.com/michalkwak/CGM-Prediction" }],
    },
    {
      id: "eigenfaces",
      period: "06/2026 – 08/2026",
      title: "Eigenfaces via a hand-written Jacobi",
      role: "Algorithms project",
      summary: "Face recognition with eigenfaces, on top of a cyclic Jacobi eigendecomposition written from scratch.",
      bullets: [
        "Implemented the cyclic Jacobi eigenvalue algorithm from scratch.",
        "Built the eigenface recognition pipeline on top of it.",
        "Unit and end-to-end tests cover the whole program.",
      ],
      tags: ["Python", "Linear algebra", "Testing"],
      links: [{ label: "Repository", url: "https://github.com/michalkwak/Face-Recognition" }],
    },
    {
      id: "horizon-tomography",
      period: "05/2026 – present",
      title: "Horizon Radiation Tomography",
      role: "Research project · quantum simulation",
      summary: "Simulating and reconstructing toy Hawking/Unruh radiation with Gaussian quantum-state tomography.",
      bullets: [
        "Models the horizon as a two-mode squeezed state and simulates noisy measurements of the accessible mode.",
        "Modular engine for joint, homodyne and heterodyne detection, with missing-data covariance estimation for homodyne.",
        "Estimates squeezing, particle number and entanglement entropy, and sweeps noise and sample size to measure recovery error.",
        "Interactive Streamlit app for exploring the sweeps.",
      ],
      tags: ["Python", "NumPy", "JAX", "Streamlit"],
      links: [
        {
          label: "Repository",
          url: "https://github.com/michalkwak/Gaussian-State-Tomography-of-Hawking-Unruh-Toy-Radiation",
        },
      ],
    },
    {
      id: "full-stack-open",
      period: "05/2026 – 07/2026",
      title: "Full Stack Open",
      role: "University of Helsinki MOOC",
      summary: "Modern web development, from React frontends to Node.js REST backends.",
      bullets: [
        "React apps: Unicafe feedback, anecdotes, a country data browser and a phonebook.",
        "Phonebook backend and a blog list app with Node.js and Express REST APIs.",
      ],
      tags: ["JavaScript", "React", "Node.js", "Express", "REST"],
      links: [{ label: "Repository", url: "https://github.com/michalkwak/Full-Stack-Open" }],
    },
    {
      id: "resilience-index",
      period: "02/2026",
      title: "Municipal Economic Resilience Index",
      role: "Hackathon project",
      summary: "A composite economic resilience index for every Finnish municipality, built from open data.",
      bullets: [
        "Built a Python ETL pipeline that merges three Finnish open datasets (income, employment, population).",
        "Designed the index with normalisation and feature weighting.",
        "Automated outputs for trend analysis and comparisons between municipalities.",
      ],
      tags: ["Python", "pandas", "ETL", "Open data"],
      links: [
        { label: "Repository", url: "https://github.com/michalkwak/Finnish-Municipal-Economic-Resilience-Index" },
      ],
    },
    {
      id: "gym-similarity",
      period: "01/2026",
      title: "Gym Exercise Similarity Finder",
      role: "Final project · Building AI",
      summary: "Explainable exercise recommendations: find substitutes by movement pattern, muscle group and equipment.",
      bullets: [
        "Encoded exercises as feature vectors (body region, target muscles, compound vs isolation, push/pull, equipment).",
        "Ranks alternatives by similarity and explains why each one matches.",
      ],
      tags: ["Python", "Similarity search"],
      links: [{ label: "Repository", url: "https://github.com/michalkwak/gym-exercise-similarity-finder" }],
    },
    {
      id: "dna",
      period: "06/2025",
      title: "DNA Sequence Analysis",
      role: "Course project · Data Analysis in Python",
      summary: "Python tools for DNA and RNA sequence analysis with algorithmic and statistical methods.",
      bullets: [
        "Implemented k-mer indexing, codon translation and frequency analysis.",
        "Applied probabilistic models (Markov chains, probability distributions) to biological sequences.",
      ],
      tags: ["Python", "NumPy", "pandas", "Jupyter"],
      links: [{ label: "Repository", url: "https://github.com/michalkwak/DNA-Sequence-Analysis" }],
    },
    {
      id: "kana-quest",
      period: "07/2023 – 05/2024",
      title: "Kana Quest",
      role: "Educational game · Unity",
      summary: "A 2D quiz game that helps players learn and practise Japanese kana.",
      bullets: [
        "Developed a quiz-based educational game in C# with modular game logic and UI systems.",
        "Designed and implemented every feature myself, across the full software lifecycle.",
        "Debugged gameplay logic and UI issues through iterative testing.",
        "Ran playtesting and bug tracking to improve reliability and usability.",
      ],
      tags: ["C#", "Unity"],
      links: [{ label: "Repository", url: "https://github.com/michalkwak/Kana-Quest" }],
    },
  ],
};
