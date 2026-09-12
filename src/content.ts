export interface Entry {
  id: string;
  title: string;
  shortTitle: string;
  paragraphs: string[];
  tools?: string[];
  url?: string;
  date?: string | null;
  role?: string | null;
  topics?: { title: string; paragraphs: string[] }[];
}
export interface Section { id: string; title: string; entries: Entry[] }

export const person = {
  name: 'Arunesh Waran',
  title: 'AI, ML & Web Application Developer',
  location: 'Coimbatore, Tamil Nadu, India',
  summary: 'B.Tech Artificial Intelligence & Machine Learning student building AI-powered applications end to end: retrieval pipelines, model integration, async APIs, database design, and containerized deployment.',
  publicLinks: {
    linkedin: 'https://www.linkedin.com/in/arunesh-waran-2a6846300/',
    github: 'https://github.com/ANONYMOUSZED-beep'
  }
};

export const missingInformation = {
  projectDates: null,
  projectRoles: null,
  projectPublicDemoUrls: null,
  certificationDatesAndVerificationUrls: null,
  employmentHistory: null,
  approvedPublicEmail: null,
  approvedPublicPhone: null
};

export const sections: Section[] = [
  { id: 'about', title: 'About', entries: [
    { id: 'profile', title: person.name, shortTitle: 'Profile', paragraphs: [person.title, person.summary, 'Built a full-stack RAG assistant and a reliability auditor for AI agent workflows, both covered by automated tests in CI.', 'Eager to contribute to live AI, data, and automation projects.', person.location] }
  ] },
  { id: 'projects', title: 'Projects', entries: [
    { id: 'ai-assistant', url: 'https://github.com/ANONYMOUSZED-beep/ai-dev-assistant', topics: [
        { title: 'Overview', paragraphs: ['An AI assistant for programming questions. Answers cite official documentation and indexed GitHub repositories.'] },
        { title: 'Architecture', paragraphs: ['Hybrid dense + BM25 retrieval with a cross-encoder reranker, LangChain, and FAISS/ChromaDB.', 'Async FastAPI, PostgreSQL, Redis, and a Next.js + TypeScript interface.'] },
        { title: 'Reliability', paragraphs: ['Source citations, API-key authentication, rate limiting, and health probes. Containerized with Docker Compose and gated by CI.'] }
      ], shortTitle: 'AI Assistant', title: 'AI Developer Assistant - RAG + LLM Full-Stack Platform', date: null, role: null,
      paragraphs: ['A full-stack assistant answering programming questions from official documentation and indexed GitHub repositories. Answers cite their exact source to reduce hallucinations.', 'LangChain, sentence-transformer embeddings, and FAISS/ChromaDB storage power hybrid dense + BM25 retrieval. A cross-encoder reranker supports semantic code search and stack-trace debugging.', 'Async FastAPI backend with PostgreSQL, Redis, API-key authentication, rate limiting, and health probes. Next.js + TypeScript UI, Docker Compose deployment, and CI gates.'],
      tools: ['Python', 'FastAPI', 'LangChain', 'FAISS/ChromaDB', 'PostgreSQL', 'Redis', 'Next.js', 'TypeScript', 'Docker', 'GitHub Actions'] },
    { id: 'replayguard', url: 'https://github.com/ANONYMOUSZED-beep/ReplayGuard', topics: [
        { title: 'Overview', paragraphs: ['A zero-dependency Python CLI that crash-tests AI-agent side effects and reports duplicate or lost effects.'] },
        { title: 'Recovery', paragraphs: ['Records action intent before execution and reconciles against external truth.', 'SQLite WAL, synchronous=FULL, cross-process leases, dead-holder reclamation, and three replay policies.'] },
        { title: 'Testing', paragraphs: ['90%+ coverage with property-based and concurrency tests. Strict mypy and ruff gates.', 'Python 3.11-3.13 on Linux, macOS, and Windows in GitHub Actions.'] }
      ], shortTitle: 'ReplayGuard', title: 'ReplayGuard - Reliability Auditor for AI Agent Workflows', date: null, role: null,
      paragraphs: ['A zero-dependency Python CLI that crash-tests AI agent workflows performing real side effects. Records intent before execution and reconciles against external truth to report duplicate or lost effects.', 'SQLite WAL and synchronous=FULL underpin idempotency and recovery, with cross-process leases, dead-holder reclamation, three replay policies, and process-death fault injection.', 'Property-based and concurrency tests across Python 3.11-3.13 on Linux, macOS, and Windows in GitHub Actions. Maintained 90%+ coverage with strict mypy and ruff gates.'],
      tools: ['Python', 'SQLite', 'CLI tooling', 'pytest', 'Hypothesis', 'mypy', 'GitHub Actions'] },
    { id: 'traffic', url: 'https://github.com/ANONYMOUSZED-beep/aerial-vehicle-detection', topics: [
        { title: 'Overview', paragraphs: ['Computer vision that detects and tracks vehicles in aerial footage to analyze traffic flow.'] },
        { title: 'Pipeline', paragraphs: ['Reusable detection, tracking, and reporting modules. Automated workflows surface vehicle-flow insights for real-time decisions.'] },
        { title: 'Repository', paragraphs: ['The public repository is named aerial-vehicle-detection. Its documentation identifies the Smart Traffic Monitoring System.', 'Repository documentation includes RF-DETR and YOLOv8 workflows. No measured accuracy is claimed here.'] }
      ], shortTitle: 'Traffic Vision', title: 'Smart Traffic Monitoring System - Computer Vision & Automation', date: null, role: null,
      paragraphs: ['Python computer vision that automatically detects and tracks vehicles in aerial footage to analyze traffic flow.', 'Built and tested deep-learning object detection in reusable detection, tracking, and reporting modules. Automated the workflow to surface vehicle-flow insights for real-time decisions.'],
      tools: ['Python', 'OpenCV', 'TensorFlow', 'Deep Learning', 'Data Analysis'] }
  ] },
  { id: 'skills', title: 'Skills', entries: [
    { id: 'languages', title: 'Languages', shortTitle: 'Languages', paragraphs: ['Python, TypeScript/JavaScript, SQL'] },
    { id: 'ai', title: 'AI / ML', shortTitle: 'AI / ML', paragraphs: ['RAG, LLM Integration, LangChain, Prompt Engineering, NLP, Machine Learning, Deep Learning, Scikit-learn, PyTorch, TensorFlow, OpenCV'] },
    { id: 'web', title: 'Web Development', shortTitle: 'Web', paragraphs: ['FastAPI, Flask, async Python, REST API design, Pydantic, Next.js, React, Tailwind CSS'] },
    { id: 'databases', title: 'Databases', shortTitle: 'Databases', paragraphs: ['PostgreSQL, MySQL, MongoDB, SQLite, Redis, SQLAlchemy, FAISS, ChromaDB (vector search)'] },
    { id: 'devops', title: 'Testing & DevOps', shortTitle: 'Test / DevOps', paragraphs: ['pytest, Vitest, Hypothesis, mypy, ruff, Docker, GitHub Actions (CI/CD), Git, Linux, Postman'] },
    { id: 'core', title: 'Core Competencies', shortTitle: 'Core', paragraphs: ['Python programming, LLM & RAG systems, machine learning & NLP, backend & REST APIs, full-stack web development, SQL & NoSQL databases, testing & CI/CD, data structures & algorithms.'] }
  ] },
  { id: 'education', title: 'Education', entries: [
    { id: 'btech', title: 'B.Tech in Artificial Intelligence and Machine Learning', shortTitle: 'B.Tech AI/ML', date: 'Sep 2023 - Sep 2027', paragraphs: ['Sri Shakthi Institute of Engineering and Technology, Coimbatore.', 'Sep 2023 - Sep 2027. CGPA: 8.1/10.', 'Relevant coursework: Data Structures and Algorithms, Database Management Systems, Python Programming, Machine Learning, Natural Language Processing, Deep Learning.'] },
    { id: 'school', title: 'Higher Secondary (Class XII)', shortTitle: 'Class XII', date: '2023', paragraphs: ['Sri Aanoor Vidyalaya Matric Higher Secondary School.', '2023. Percentage: 88%.'] }
  ] },
  { id: 'certificates', title: 'Certificates', entries: [
    { id: 'nvidia', title: 'Building LLM Applications With Prompt Engineering', shortTitle: 'NVIDIA', paragraphs: ['Building LLM Applications With Prompt Engineering. NVIDIA.'] },
    { id: 'microsoft', title: 'Career Essentials in Generative AI', shortTitle: 'Microsoft', paragraphs: ['Career Essentials in Generative AI. Microsoft.'] },
    { id: 'datacamp', title: 'Intermediate Deep Learning with PyTorch', shortTitle: 'DataCamp', paragraphs: ['Intermediate Deep Learning with PyTorch. DataCamp.'] },
    { id: 'kaggle', title: 'Machine Learning Intermediate', shortTitle: 'Kaggle', paragraphs: ['Machine Learning Intermediate. Kaggle.'] },
    { id: 'huggingface', title: 'The MCP Course', shortTitle: 'Hugging Face', paragraphs: ['The MCP Course. Hugging Face.'] }
  ] },
  { id: 'contact', title: 'Contact', entries: [
    { id: 'linkedin', title: 'LinkedIn', shortTitle: 'LinkedIn', paragraphs: ['Arunesh Waran on LinkedIn.'], url: person.publicLinks.linkedin },
    { id: 'github', title: 'GitHub', shortTitle: 'GitHub', paragraphs: ['ANONYMOUSZED-beep on GitHub.'], url: person.publicLinks.github }
  ] },
  { id: 'extras', title: 'Extras', entries: [
    { id: 'help', title: 'Help', shortTitle: 'Help', paragraphs: ['Up / down: browse. Blue Navi key or Enter: select. C or Escape: back.', '1-7: main sections. 8: Help. 9: Phone info. 0: home. Star: sound. Hash: reduced motion.', 'Top power key: switch off or on. In details, Navi advances the page. Up goes to the previous page.', 'The magnifying glass enlarges the LCD. Text view opens full-size reading.', 'Enter always selects on the phone. Space activates the focused key. Project menus include topics and View source.'] },
    { id: 'info', title: 'Phone Info', shortTitle: 'Phone Info', paragraphs: ['Portfolio version 1.0. Original Nokia 3310: 2000. 113 x 48 x 22 mm. 133 g. 84 x 48 LCD.', 'Handset photo: Rainer Knapper / smial. Retouch: Multicherry. Free Art License 1.3. Adapted for this interactive display.', 'Independent portfolio. Not affiliated with or endorsed by Nokia. Original pixel lettering and optional synthesized key tone.'] }
  ] }
];
