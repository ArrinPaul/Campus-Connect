/**
 * Mock Data Seed Script
 * ─────────────────────
 * Creates realistic sample data across all tables for development/demo.
 * Run via: npx convex run seed:seedAll
 *
 * Creates:
 * - 12 users (diverse roles, universities, skills)
 * - 20 posts (with hashtags, reactions, comments)
 * - 30+ comments (threaded, with reactions)
 * - 40+ reactions on posts/comments
 * - Follow graph (30+ relationships)
 * - 3 communities with members
 * - 5 events with RSVPs
 * - 4 conversations (2 DM + 2 group) with messages
 * - 5 papers with co-authors
 * - 8 resources
 * - 6 questions with answers and votes
 * - 10 hashtags (linked to posts)
 * - 3 stories
 * - 5 job listings with applications
 * - 4 marketplace listings
 * - Gamification data (achievements, reputation)
 * - 3 skill endorsements
 * - Suggestions
 */

import { internalMutation, action } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// ─── Helpers ──────────────────────────────────────────────────────

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function hoursAgo(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000
}

function uuid(): string {
  return Math.random().toString(36).substring(2, 10)
}

// ─── Seed Data Definitions ───────────────────────────────────────

const USERS = [
  {
    name: "Arjun Mehta",
    username: "arjun_mehta",
    email: "arjun.mehta@iitd.ac.in",
    bio: "ML researcher at IIT Delhi. Working on transformers and NLP. Open to collaborations.",
    university: "IIT Delhi",
    role: "Research Scholar" as const,
    experienceLevel: "Advanced" as const,
    skills: ["Python", "PyTorch", "NLP", "Transformers", "TensorFlow"],
    researchInterests: ["Natural Language Processing", "Large Language Models", "AI Safety"],
    socialLinks: { github: "https://github.com/arjunmehta", linkedin: "https://linkedin.com/in/arjunmehta" },
  },
  {
    name: "Priya Sharma",
    username: "priya_sharma",
    email: "priya.s@iisc.ac.in",
    bio: "Final year CS undergrad at IISc. Full-stack dev building cool stuff.",
    university: "IISc Bangalore",
    role: "Student" as const,
    experienceLevel: "Intermediate" as const,
    skills: ["React", "TypeScript", "Next.js", "Node.js", "PostgreSQL"],
    researchInterests: ["Web Systems", "Distributed Computing"],
    socialLinks: { github: "https://github.com/priyasharma", twitter: "https://twitter.com/priya_codes" },
  },
  {
    name: "Dr. Ramesh Kumar",
    username: "dr_ramesh",
    email: "ramesh.kumar@iitb.ac.in",
    bio: "Professor of Computer Science at IIT Bombay. Research: Computer Vision, Robotics.",
    university: "IIT Bombay",
    role: "Faculty" as const,
    experienceLevel: "Expert" as const,
    skills: ["Computer Vision", "Deep Learning", "Robotics", "C++", "MATLAB"],
    researchInterests: ["Autonomous Systems", "Medical Imaging", "3D Reconstruction"],
    socialLinks: { website: "https://cse.iitb.ac.in/~ramesh", linkedin: "https://linkedin.com/in/drkramesh" },
  },
  {
    name: "Sneha Patel",
    username: "sneha_patel",
    email: "sneha.patel@nit.ac.in",
    bio: "Data science enthusiast | Kaggle Master | Love sharing knowledge through resources.",
    university: "NIT Trichy",
    role: "Student" as const,
    experienceLevel: "Intermediate" as const,
    skills: ["Python", "R", "SQL", "Tableau", "scikit-learn"],
    researchInterests: ["Data Science", "Statistical Learning"],
    socialLinks: { github: "https://github.com/snehapatel" },
  },
  {
    name: "Vikram Singh",
    username: "vikram_singh",
    email: "vikram.s@bits.ac.in",
    bio: "BITS Pilani '25 | Backend engineer intern at [startup]. Building APIs that scale.",
    university: "BITS Pilani",
    role: "Student" as const,
    experienceLevel: "Intermediate" as const,
    skills: ["Go", "Rust", "Docker", "Kubernetes", "AWS"],
    researchInterests: ["Systems Programming", "Cloud Architecture"],
    socialLinks: { github: "https://github.com/vikramsingh", linkedin: "https://linkedin.com/in/vikrams" },
  },
  {
    name: "Ananya Reddy",
    username: "ananya_reddy",
    email: "ananya.r@iiith.ac.in",
    bio: "AI/ML grad student at IIIT Hyderabad. Passionate about responsible AI.",
    university: "IIIT Hyderabad",
    role: "Research Scholar" as const,
    experienceLevel: "Advanced" as const,
    skills: ["Python", "JAX", "Transformers", "Ethics in AI", "Research Writing"],
    researchInterests: ["AI Ethics", "Fairness in ML", "Explainable AI"],
    socialLinks: { twitter: "https://twitter.com/ananya_ai", website: "https://ananyareddy.com" },
  },
  {
    name: "Rahul Gupta",
    username: "rahul_gupta",
    email: "rahul.g@vit.ac.in",
    bio: "Mobile dev | Flutter & React Native | Building apps that matter.",
    university: "VIT Vellore",
    role: "Student" as const,
    experienceLevel: "Beginner" as const,
    skills: ["Flutter", "Dart", "React Native", "Firebase", "JavaScript"],
    researchInterests: [],
    socialLinks: { github: "https://github.com/rahulgupta" },
  },
  {
    name: "Dr. Lakshmi Nair",
    username: "dr_lakshmi",
    email: "lakshmi.nair@iitm.ac.in",
    bio: "Associate Professor, IIT Madras. Quantum Computing & Cryptography.",
    university: "IIT Madras",
    role: "Faculty" as const,
    experienceLevel: "Expert" as const,
    skills: ["Quantum Computing", "Cryptography", "Mathematics", "Qiskit", "LaTeX"],
    researchInterests: ["Post-Quantum Cryptography", "Quantum Error Correction"],
    socialLinks: { website: "https://www.cse.iitm.ac.in/~lakshmi" },
  },
  {
    name: "Kavya Krishnan",
    username: "kavya_k",
    email: "kavya.k@cmi.ac.in",
    bio: "Math + CS at CMI. Competitive programmer. ICPC finalist.",
    university: "CMI Chennai",
    role: "Student" as const,
    experienceLevel: "Advanced" as const,
    skills: ["C++", "Algorithms", "Competitive Programming", "Graph Theory", "Number Theory"],
    researchInterests: ["Combinatorics", "Algorithm Design"],
    socialLinks: { github: "https://github.com/kavyak" },
  },
  {
    name: "Mohammed Farhan",
    username: "farhan_m",
    email: "farhan.m@dtu.ac.in",
    bio: "Cybersecurity researcher at DTU. Bug bounty hunter. CTF player.",
    university: "DTU Delhi",
    role: "Research Scholar" as const,
    experienceLevel: "Advanced" as const,
    skills: ["Cybersecurity", "Penetration Testing", "Python", "Network Security", "CTF"],
    researchInterests: ["Network Security", "Malware Analysis", "Vulnerability Research"],
    socialLinks: { github: "https://github.com/farhanm", twitter: "https://twitter.com/farhan_sec" },
  },
  {
    name: "Ishita Das",
    username: "ishita_das",
    email: "ishita.d@jadavpur.ac.in",
    bio: "UX/UI designer turned frontend dev. Design systems are my jam.",
    university: "Jadavpur University",
    role: "Student" as const,
    experienceLevel: "Intermediate" as const,
    skills: ["Figma", "CSS", "Tailwind", "React", "Design Systems"],
    researchInterests: ["HCI", "Accessibility"],
    socialLinks: { website: "https://ishitadas.design" },
  },
  {
    name: "Aditya Verma",
    username: "aditya_v",
    email: "aditya.v@iitk.ac.in",
    bio: "Systems engineer at IIT Kanpur. Building compilers and OS kernels for fun.",
    university: "IIT Kanpur",
    role: "Research Scholar" as const,
    experienceLevel: "Expert" as const,
    skills: ["C", "Rust", "LLVM", "Operating Systems", "Compilers"],
    researchInterests: ["Compiler Optimization", "OS Design", "Memory Safety"],
    socialLinks: { github: "https://github.com/adityav" },
  },
]

const POST_CONTENTS = [
  "Just published my paper on attention mechanisms in low-resource languages! 🎉 Super excited about the results. Check it out on arXiv. #NLP #DeepLearning #Research",
  "Hot take: Rust > Go for systems programming. Fight me. 🦀 #Rust #SystemsProgramming #CodingDebate",
  "Anyone else struggling with the new Convex query syntax? Here's a quick guide I wrote for common patterns. Link in comments. #Convex #WebDev",
  "Just got accepted into the GSoC program with Mozilla! 🎊 Can't wait to contribute to Firefox. Tips for future applicants in thread below. #GSoC #OpenSource",
  "Attended an amazing workshop on quantum error correction today. Dr. Lakshmi's explanation of surface codes was mind-blowing. #QuantumComputing #IITMadras",
  "My Kaggle score just jumped 200 places after implementing gradient boosted trees instead of random forests. The power of feature engineering! #DataScience #Kaggle",
  "Looking for collaborators on a drone swarm intelligence project. We're implementing consensus algorithms for multi-agent systems. DM if interested! #Robotics #AI",
  "Just deployed my first production app on Vercel + Convex + Clerk. The DX is incredible. Total setup time: ~2 hours. #WebDev #NextJS #Convex",
  "The difference between a CS degree and self-taught coding isn't the knowledge — it's the problem-solving framework. Both paths are valid. #CodingJourney #CS",
  "TIL: You can use TypeScript template literal types to create type-safe SQL query builders. Mind = blown. #TypeScript #TIL",
  "Our research group just got a ₹50L grant for autonomous vehicle research! Hiring 3 PhD students. Apply through our lab website. #Hiring #Research #AutonomousVehicles",
  "Night coding session + Lo-fi beats + Coffee = Peak productivity 🎵☕ What's your coding setup? #CodingLife",
  "Published a comprehensive guide on setting up CI/CD pipelines with GitHub Actions for Next.js projects. No more broken deployments! #DevOps #CI/CD",
  "The ICPC regionals are next week. Our team has been practicing 6 hours daily. Wish us luck! 💪 #ICPC #CompetitiveProgramming",
  "Just completed Stanford's CS229 Machine Learning course. The mathematical rigor is exactly what online courses usually miss. Highly recommend. #MachineLearning #OnlineLearning",
  "Interesting debate: Should university CS programs teach more practical skills (web dev, cloud) or stick to fundamentals (algorithms, theory)? #Education #CS",
  "Built a real-time collaborative code editor using CRDTs. Performance is actually better than I expected. Writeup coming soon! #DistributedSystems #CRDT",
  "My study resource on Dynamic Programming has crossed 1000 downloads on the platform! Thank you all for the support. 📚 #DSA #StudyResources",
  "CTF writeup: how we exploited a race condition in the authentication flow to escalate privileges. Detailed analysis in the blog. #Cybersecurity #CTF",
  "Excited to announce I'll be TAing CS101 next semester! Office hours will include coding practice sessions and doubt-clearing. #Teaching #CS101",
]

const COMMENT_CONTENTS = [
  "This is incredibly insightful! Thanks for sharing.",
  "Great work! The methodology section is particularly well written.",
  "I had a similar experience. Here's what worked for me...",
  "Could you elaborate on the training process? Specifically the hyperparameter tuning.",
  "Congrats! Well deserved 🎉",
  "This is exactly what I needed. Bookmarked!",
  "Interesting perspective. I would add that the fundamentals matter more in the long run.",
  "Have you considered using a transformer-based approach instead?",
  "The benchmarks look promising. Any plans to open-source the code?",
  "I disagree — the traditional approach still has merits in production environments.",
  "Following for updates. This is fascinating work.",
  "Can you share the dataset you used? Would love to replicate the results.",
  "This aligns with what Prof. Kumar discussed in last week's seminar.",
  "Amazing resource! Shared with my study group.",
  "How does this compare to the approach described in the 2023 ICML paper?",
]

const COMMUNITY_DATA = [
  {
    name: "ML Research Hub",
    slug: "ml-research",
    description: "A community for machine learning researchers to share papers, discuss models, and collaborate on projects.",
    type: "public" as const,
    category: "Research",
    rules: ["Be respectful", "Cite sources", "No self-promotion spam", "Use appropriate tags"],
  },
  {
    name: "Competitive Programming",
    slug: "competitive-prog",
    description: "Practice problems, contest discussions, and algorithm tutorials. All skill levels welcome.",
    type: "public" as const,
    category: "Academic",
    rules: ["No spoilers for ongoing contests", "Use code blocks", "Help newcomers", "Share approaches, not just solutions"],
  },
  {
    name: "IIT Delhi CS '25",
    slug: "iitd-cs-25",
    description: "Official community for IIT Delhi CS batch of 2025. Placements, academics, and campus life.",
    type: "private" as const,
    category: "Social",
    rules: ["IIT Delhi students only", "No sharing placement details externally", "Keep it professional"],
  },
]

const EVENT_DATA = [
  {
    title: "AI/ML Research Symposium 2025",
    description: "Annual research symposium featuring talks from leading AI researchers across Indian institutions.",
    eventType: "hybrid" as const,
    location: "IIT Delhi Main Auditorium",
    virtualLink: "https://meet.google.com/abc-defg-hij",
    daysFromNow: 14,
  },
  {
    title: "Web Dev Hackathon",
    description: "48-hour hackathon focused on building production-ready web applications. ₹50K prize pool.",
    eventType: "in_person" as const,
    location: "BITS Pilani, Innovation Lab",
    daysFromNow: 7,
  },
  {
    title: "Intro to Quantum Computing Workshop",
    description: "Hands-on workshop on quantum computing fundamentals using Qiskit.",
    eventType: "virtual" as const,
    virtualLink: "https://zoom.us/j/123456",
    daysFromNow: 3,
  },
  {
    title: "Resume Review & Mock Interview Session",
    description: "Get your resume reviewed by industry professionals. Mock interview slots available.",
    eventType: "in_person" as const,
    location: "NIT Trichy, Placement Cell",
    daysFromNow: 21,
  },
  {
    title: "Open Source Contribution Sprint",
    description: "Guided session on making your first open source contribution. Beginner-friendly!",
    eventType: "virtual" as const,
    virtualLink: "https://discord.gg/opensprint",
    daysFromNow: 5,
  },
]

const PAPER_DATA = [
  {
    title: "Efficient Attention Mechanisms for Low-Resource Languages",
    abstract: "We propose a novel attention mechanism that reduces computational cost by 40% while maintaining accuracy on low-resource language tasks. Our approach leverages sparse attention patterns learned from linguistic structure.",
    authors: ["Arjun Mehta", "Ananya Reddy"],
    doi: "10.1234/arxiv.2025.001",
    tags: ["nlp", "attention", "low-resource"],
  },
  {
    title: "Consensus Algorithms for Drone Swarm Navigation",
    abstract: "This paper presents a distributed consensus algorithm for autonomous drone swarms operating in GPS-denied environments. We demonstrate convergence guarantees under partial communication failures.",
    authors: ["Dr. Ramesh Kumar", "Vikram Singh", "Aditya Verma"],
    doi: "10.1234/arxiv.2025.002",
    tags: ["robotics", "consensus", "drones"],
    lookingForCollaborators: true,
  },
  {
    title: "Post-Quantum Key Exchange Using Isogeny Graphs",
    abstract: "We introduce a new key exchange protocol based on supersingular isogeny graphs that achieves forward secrecy and resistance to quantum attacks.",
    authors: ["Dr. Lakshmi Nair", "Mohammed Farhan"],
    doi: "10.1234/arxiv.2025.003",
    tags: ["quantum", "cryptography", "isogeny"],
  },
  {
    title: "Fairness Metrics for Multi-Label Classification in Healthcare",
    abstract: "We analyze existing fairness metrics and propose new evaluation criteria specifically designed for multi-label healthcare classification tasks.",
    authors: ["Ananya Reddy"],
    tags: ["fairness", "ml", "healthcare"],
    lookingForCollaborators: true,
  },
  {
    title: "Memory-Safe Kernel Module Development with Rust",
    abstract: "We evaluate the feasibility and performance implications of writing Linux kernel modules in Rust. Our modules achieve comparable performance to C implementations with zero memory-safety violations.",
    authors: ["Aditya Verma"],
    doi: "10.1234/arxiv.2025.005",
    tags: ["rust", "kernel", "memory-safety"],
  },
]

const QUESTION_DATA = [
  {
    title: "How to implement attention mechanisms from scratch in PyTorch?",
    content: "I'm trying to implement multi-head attention without using nn.MultiheadAttention. Can someone explain the matrix multiplication steps?",
    tags: ["pytorch", "attention", "deep-learning"],
    course: "CS6910 Deep Learning",
  },
  {
    title: "Best practices for Convex schema design with many-to-many relationships?",
    content: "I have users and communities with a many-to-many relationship. Should I use a junction table or embed IDs in arrays?",
    tags: ["convex", "schema-design", "database"],
    course: "CS3450 Database Systems",
  },
  {
    title: "Difference between BFS and Dijkstra for shortest path?",
    content: "When should I use BFS vs Dijkstra? Both find shortest paths, but I'm confused about when weights matter.",
    tags: ["algorithms", "graph-theory", "bfs", "dijkstra"],
    course: "CS2100 Data Structures",
  },
  {
    title: "How to set up GitHub Actions CI/CD for a Next.js + Convex project?",
    content: "Looking for a working GitHub Actions workflow that runs tests, type-checks, and deploys to Vercel for a Next.js project using Convex as backend.",
    tags: ["devops", "github-actions", "nextjs", "convex"],
  },
  {
    title: "Understanding CRDT conflict resolution strategies",
    content: "I've been reading about CRDTs for my distributed systems course. Can someone explain the difference between state-based and operation-based CRDTs with examples?",
    tags: ["distributed-systems", "crdt", "conflict-resolution"],
    course: "CS6450 Distributed Systems",
  },
  {
    title: "Rust borrow checker: why does this code fail?",
    content: "```rust\nlet mut v = vec![1, 2, 3];\nlet first = &v[0];\nv.push(4);\nprintln!(\"{}\", first);\n```\nThe borrow checker complains but I don't understand why pushing to the vector invalidates the reference.",
    tags: ["rust", "borrow-checker", "memory-safety"],
    course: "CS5320 Systems Programming",
  },
]

const RESOURCE_DATA = [
  { title: "Dynamic Programming Masterclass Notes", description: "Comprehensive DP notes covering all patterns: knapsack, LCS, matrix chain, state machines. Includes 50+ solved problems.", course: "CS2100 Data Structures", subject: "Algorithms" },
  { title: "Machine Learning Cheat Sheet", description: "One-page cheat sheet covering all ML algorithms, their assumptions, and when to use them.", course: "CS4200 Machine Learning", subject: "ML" },
  { title: "Operating Systems Exam Notes", description: "Complete notes for OS course covering processes, memory management, file systems, and synchronization.", course: "CS3100 Operating Systems", subject: "OS" },
  { title: "Database Normalization Guide", description: "Step-by-step guide to database normalization from 1NF to 5NF with examples.", course: "CS3450 Database Systems", subject: "Databases" },
  { title: "Graph Theory Problem Set Solutions", description: "Solved problem set for graph theory including BFS, DFS, MST, shortest paths, and network flows.", course: "CS2100 Data Structures", subject: "Graph Theory" },
  { title: "Cryptography Fundamentals Slides", description: "Lecture slides covering symmetric/asymmetric encryption, hash functions, digital signatures, and PKI.", course: "CS5100 Cryptography", subject: "Security" },
  { title: "React + TypeScript Best Practices", description: "Guide covering React patterns, TypeScript generics in components, custom hooks, and performance optimization.", course: "CS4500 Web Development", subject: "Frontend" },
  { title: "Research Paper Writing Template", description: "LaTeX template and guide for writing academic CS papers. Includes sections, citations, and common patterns.", course: "CS6000 Research Methodology", subject: "Writing" },
]

const JOB_DATA = [
  { title: "ML Engineer Intern", company: "DeepMind India", type: "internship" as const, location: "Bangalore", remote: false, duration: "6 months", skillsRequired: ["Python", "PyTorch", "NLP"], salary: "₹80K/month" },
  { title: "Full-Stack Developer", company: "Razorpay", type: "job" as const, location: "Bangalore", remote: true, skillsRequired: ["React", "Node.js", "PostgreSQL"], salary: "₹18-25 LPA" },
  { title: "Backend Engineering Intern", company: "Flipkart", type: "internship" as const, location: "Bangalore", remote: false, duration: "3 months", skillsRequired: ["Java", "Spring Boot", "MySQL"], salary: "₹60K/month" },
  { title: "Security Analyst", company: "Cisco India", type: "job" as const, location: "Hyderabad", remote: true, skillsRequired: ["Cybersecurity", "Network Security", "Python"], salary: "₹15-22 LPA" },
  { title: "Research Assistant — Quantum Computing Lab", company: "IIT Madras Research Park", type: "job" as const, location: "Chennai", remote: false, skillsRequired: ["Quantum Computing", "Qiskit", "Mathematics"], salary: "₹8-12 LPA" },
]

const LISTING_DATA = [
  { title: "CLRS Algorithms Textbook (3rd Edition)", description: "Excellent condition. Used for one semester. Minor highlighted sections.", category: "books" as const, price: 400, condition: "good" as const },
  { title: "Mechanical Keyboard — Cherry MX Blue", description: "Keychron K2 wireless mechanical keyboard. 6 months old, works perfectly.", category: "electronics" as const, price: 3500, condition: "like_new" as const },
  { title: "Study Desk + Chair Combo", description: "Moving out of hostel. Selling study desk and ergonomic chair together.", category: "furniture" as const, price: 2000, condition: "good" as const },
  { title: "Python Tutoring Services", description: "Offering 1-on-1 Python tutoring for beginners. ₹200/hour. Covered DSA basics to advanced topics.", category: "services" as const, price: 200, condition: "new" as const },
]

// ─── Main Seed Function ──────────────────────────────────────────

const seedAllInternal = internalMutation({
  handler: async (ctx) => {
    const now = Date.now()

    // ── 1. Create Users ──────────────────────────────────────
    const userIds: Id<"users">[] = []
    for (let i = 0; i < USERS.length; i++) {
      const u = USERS[i]
      const userId = await ctx.db.insert("users", {
        clerkId: `seed_clerk_${i}_${uuid()}`,
        email: u.email,
        name: u.name,
        username: u.username,
        bio: u.bio,
        university: u.university,
        role: u.role,
        experienceLevel: u.experienceLevel,
        skills: u.skills,
        socialLinks: u.socialLinks,
        followerCount: 0,
        followingCount: 0,
        notificationPreferences: { reactions: true, comments: true, mentions: true, follows: true },
        status: randomPick(["online", "away", "online", "online"]),
        lastSeenAt: now - randomInt(0, 3600000),
        showOnlineStatus: true,
        researchInterests: u.researchInterests,
        reputation: randomInt(10, 300),
        level: randomInt(1, 8),
        onboardingComplete: true,
        createdAt: daysAgo(randomInt(30, 365)),
        updatedAt: now,
      })
      userIds.push(userId)
    }

    // ── 2. Create Follow Graph ───────────────────────────────
    const followPairs = new Set<string>()
    for (let i = 0; i < 35; i++) {
      const followerIdx = randomInt(0, userIds.length - 1)
      let followingIdx = randomInt(0, userIds.length - 1)
      while (followingIdx === followerIdx) followingIdx = randomInt(0, userIds.length - 1)
      const key = `${followerIdx}-${followingIdx}`
      if (followPairs.has(key)) continue
      followPairs.add(key)

      await ctx.db.insert("follows", {
        followerId: userIds[followerIdx],
        followingId: userIds[followingIdx],
        createdAt: daysAgo(randomInt(1, 60)),
      })
    }
    // Update follower/following counts
    for (let i = 0; i < userIds.length; i++) {
      let followerCount = 0
      let followingCount = 0
      followPairs.forEach((pair) => {
        const [a, b] = pair.split("-").map(Number)
        if (b === i) followerCount++
        if (a === i) followingCount++
      })
      await ctx.db.patch(userIds[i], { followerCount, followingCount })
    }

    // ── 3. Create Hashtags ───────────────────────────────────
    const hashtagNames = [
      "machinelearning", "deeplearning", "nlp", "webdev", "nextjs",
      "rust", "python", "cybersecurity", "quantumcomputing", "competitiveprogramming",
      "datastructures", "devops", "opensource", "research", "coding",
    ]
    const hashtagIds: Id<"hashtags">[] = []
    for (const tag of hashtagNames) {
      const hId = await ctx.db.insert("hashtags", {
        tag,
        postCount: 0,
        lastUsedAt: daysAgo(randomInt(0, 7)),
        trendingScore: randomInt(0, 50),
      })
      hashtagIds.push(hId)
    }

    // ── 4. Create Posts ──────────────────────────────────────
    const postIds: Id<"posts">[] = []
    for (let i = 0; i < POST_CONTENTS.length; i++) {
      const authorIdx = i % userIds.length
      const postId = await ctx.db.insert("posts", {
        authorId: userIds[authorIdx],
        content: POST_CONTENTS[i],
        likeCount: randomInt(0, 30),
        commentCount: 0, // will be updated
        shareCount: randomInt(0, 5),
        reactionCounts: {
          like: randomInt(2, 15),
          love: randomInt(0, 8),
          laugh: randomInt(0, 3),
          wow: randomInt(0, 5),
          sad: 0,
          scholarly: randomInt(0, 4),
        },
        createdAt: daysAgo(randomInt(0, 30)),
        updatedAt: daysAgo(randomInt(0, 30)),
      })
      postIds.push(postId)

      // Link 1-3 random hashtags to each post
      const numTags = randomInt(1, 3)
      for (let t = 0; t < numTags; t++) {
        const hashIdx = randomInt(0, hashtagIds.length - 1)
        await ctx.db.insert("postHashtags", {
          postId,
          hashtagId: hashtagIds[hashIdx],
          createdAt: daysAgo(randomInt(0, 30)),
        })
        // Increment hashtag postCount
        const hashtag = await ctx.db.get(hashtagIds[hashIdx])
        if (hashtag) {
          await ctx.db.patch(hashtagIds[hashIdx], { postCount: hashtag.postCount + 1 })
        }
      }
    }

    // ── 5. Create Reactions on Posts ─────────────────────────
    const reactionTypes = ["like", "love", "laugh", "wow", "sad", "scholarly"] as const
    for (let i = 0; i < 50; i++) {
      const userIdx = randomInt(0, userIds.length - 1)
      const postIdx = randomInt(0, postIds.length - 1)
      await ctx.db.insert("reactions", {
        userId: userIds[userIdx],
        targetId: postIds[postIdx] as unknown as string,
        targetType: "post",
        type: randomPick([...reactionTypes]),
        createdAt: daysAgo(randomInt(0, 25)),
      })
    }

    // ── 6. Create Comments ───────────────────────────────────
    const commentIds: Id<"comments">[] = []
    // Add 2-3 top-level comments on first 10 posts
    for (let p = 0; p < Math.min(10, postIds.length); p++) {
      const numComments = randomInt(2, 4)
      for (let c = 0; c < numComments; c++) {
        const authorIdx = randomInt(0, userIds.length - 1)
        const commentId = await ctx.db.insert("comments", {
          postId: postIds[p],
          authorId: userIds[authorIdx],
          content: randomPick(COMMENT_CONTENTS),
          depth: 0,
          replyCount: 0,
          createdAt: daysAgo(randomInt(0, 20)),
        })
        commentIds.push(commentId)
      }
      // Update post commentCount
      await ctx.db.patch(postIds[p], { commentCount: numComments })
    }

    // Add some replies to first 5 comments
    for (let c = 0; c < Math.min(5, commentIds.length); c++) {
      const parentComment = await ctx.db.get(commentIds[c])
      if (!parentComment) continue
      const replyAuthorIdx = randomInt(0, userIds.length - 1)
      await ctx.db.insert("comments", {
        postId: parentComment.postId,
        authorId: userIds[replyAuthorIdx],
        content: randomPick(COMMENT_CONTENTS),
        parentCommentId: commentIds[c],
        depth: 1,
        replyCount: 0,
        createdAt: daysAgo(randomInt(0, 15)),
      })
      await ctx.db.patch(commentIds[c], { replyCount: 1 })
    }

    // ── 7. Create Bookmarks ──────────────────────────────────
    for (let i = 0; i < 15; i++) {
      const userIdx = randomInt(0, userIds.length - 1)
      const postIdx = randomInt(0, postIds.length - 1)
      await ctx.db.insert("bookmarks", {
        userId: userIds[userIdx],
        postId: postIds[postIdx],
        collectionName: randomPick(["Saved", "Read Later", "Research", "Inspiration"]),
        createdAt: daysAgo(randomInt(0, 20)),
      })
    }

    // ── 8. Create Reposts ────────────────────────────────────
    for (let i = 0; i < 8; i++) {
      const userIdx = randomInt(0, userIds.length - 1)
      const postIdx = randomInt(0, postIds.length - 1)
      await ctx.db.insert("reposts", {
        userId: userIds[userIdx],
        originalPostId: postIds[postIdx],
        quoteContent: i % 3 === 0 ? "Great insights here! Sharing with my network." : undefined,
        createdAt: daysAgo(randomInt(0, 15)),
      })
    }

    // ── 9. Create Communities ────────────────────────────────
    const communityIds: Id<"communities">[] = []
    for (let i = 0; i < COMMUNITY_DATA.length; i++) {
      const c = COMMUNITY_DATA[i]
      const creatorIdx = i
      const communityId = await ctx.db.insert("communities", {
        name: c.name,
        slug: c.slug,
        description: c.description,
        type: c.type,
        category: c.category,
        rules: c.rules,
        memberCount: 0,
        createdBy: userIds[creatorIdx],
        createdAt: daysAgo(randomInt(30, 90)),
      })
      communityIds.push(communityId)

      // Add creator as owner
      await ctx.db.insert("communityMembers", {
        communityId,
        userId: userIds[creatorIdx],
        role: "owner",
        joinedAt: daysAgo(randomInt(30, 90)),
      })

      // Add 3-5 random members
      const numMembers = randomInt(3, 5)
      const memberSet = new Set<number>([creatorIdx])
      for (let m = 0; m < numMembers; m++) {
        let memberIdx = randomInt(0, userIds.length - 1)
        while (memberSet.has(memberIdx)) memberIdx = randomInt(0, userIds.length - 1)
        memberSet.add(memberIdx)
        await ctx.db.insert("communityMembers", {
          communityId,
          userId: userIds[memberIdx],
          role: "member",
          joinedAt: daysAgo(randomInt(1, 60)),
        })
      }
      await ctx.db.patch(communityId, { memberCount: memberSet.size })
    }

    // ── 10. Create Events ────────────────────────────────────
    const eventIds: Id<"events">[] = []
    for (let i = 0; i < EVENT_DATA.length; i++) {
      const e = EVENT_DATA[i]
      const organizerIdx = i % userIds.length
      const startDate = now + e.daysFromNow * 24 * 60 * 60 * 1000
      const eventId = await ctx.db.insert("events", {
        title: e.title,
        description: e.description,
        organizerId: userIds[organizerIdx],
        communityId: i < communityIds.length ? communityIds[i % communityIds.length] : undefined,
        eventType: e.eventType,
        startDate,
        endDate: startDate + 3 * 60 * 60 * 1000, // 3 hours
        location: e.location,
        virtualLink: e.virtualLink,
        isRecurring: false,
        maxAttendees: randomInt(30, 200),
        attendeeCount: 0,
        createdAt: daysAgo(randomInt(5, 30)),
      })
      eventIds.push(eventId)

      // Add 2-4 RSVPs
      const numRsvps = randomInt(2, 4)
      for (let r = 0; r < numRsvps; r++) {
        const rsvpUserIdx = randomInt(0, userIds.length - 1)
        await ctx.db.insert("eventRSVPs", {
          eventId,
          userId: userIds[rsvpUserIdx],
          status: randomPick(["going", "going", "maybe"]),
          createdAt: daysAgo(randomInt(1, 10)),
        })
      }
      await ctx.db.patch(eventId, { attendeeCount: numRsvps })
    }

    // ── 11. Create Conversations & Messages ──────────────────
    // DM 1: Arjun ↔ Priya
    const conv1 = await ctx.db.insert("conversations", {
      type: "direct",
      participantIds: [userIds[0], userIds[1]],
      lastMessageAt: hoursAgo(1),
      lastMessagePreview: "Shall we meet tomorrow to discuss the project?",
      createdAt: daysAgo(10),
    })
    for (const uid of [userIds[0], userIds[1]]) {
      await ctx.db.insert("conversationParticipants", {
        conversationId: conv1,
        userId: uid,
        isMuted: false,
        joinedAt: daysAgo(10),
      })
    }
    const dmMessages1 = [
      { sender: 0, content: "Hey Priya, I saw your recent project. Looks impressive!" },
      { sender: 1, content: "Thanks Arjun! Yeah, it was a fun build. Any feedback?" },
      { sender: 0, content: "The UI is clean. Maybe add a dark mode toggle?" },
      { sender: 1, content: "Good idea! I'll work on that this weekend." },
      { sender: 0, content: "Shall we meet tomorrow to discuss the project?" },
    ]
    let lastMsgId1: Id<"messages"> | undefined
    for (let m = 0; m < dmMessages1.length; m++) {
      lastMsgId1 = await ctx.db.insert("messages", {
        conversationId: conv1,
        senderId: userIds[dmMessages1[m].sender],
        content: dmMessages1[m].content,
        messageType: "text",
        status: "read",
        isDeleted: false,
        createdAt: hoursAgo(5 - m),
      })
    }
    if (lastMsgId1) await ctx.db.patch(conv1, { lastMessageId: lastMsgId1 })

    // DM 2: Vikram ↔ Mohammed
    const conv2 = await ctx.db.insert("conversations", {
      type: "direct",
      participantIds: [userIds[4], userIds[9]],
      lastMessageAt: hoursAgo(3),
      lastMessagePreview: "Let's start the CTF practice this evening!",
      createdAt: daysAgo(5),
    })
    for (const uid of [userIds[4], userIds[9]]) {
      await ctx.db.insert("conversationParticipants", {
        conversationId: conv2,
        userId: uid,
        isMuted: false,
        joinedAt: daysAgo(5),
      })
    }
    const dmMessages2 = [
      { sender: 4, content: "Hey Farhan, want to team up for the CTF this weekend?" },
      { sender: 9, content: "Absolutely! I've been practicing binary exploitation." },
      { sender: 4, content: "Nice, I'll handle the web challenges. We'll make a great team." },
      { sender: 9, content: "Let's start the CTF practice this evening!" },
    ]
    let lastMsgId2: Id<"messages"> | undefined
    for (let m = 0; m < dmMessages2.length; m++) {
      lastMsgId2 = await ctx.db.insert("messages", {
        conversationId: conv2,
        senderId: userIds[dmMessages2[m].sender],
        content: dmMessages2[m].content,
        messageType: "text",
        status: "delivered",
        isDeleted: false,
        createdAt: hoursAgo(8 - m * 2),
      })
    }
    if (lastMsgId2) await ctx.db.patch(conv2, { lastMessageId: lastMsgId2 })

    // Group Chat: ML Research Discussion
    const groupConv = await ctx.db.insert("conversations", {
      type: "group",
      participantIds: [userIds[0], userIds[2], userIds[5], userIds[7]],
      name: "ML Research Group",
      description: "Discussion on current ML research trends",
      createdBy: userIds[0],
      lastMessageAt: hoursAgo(2),
      lastMessagePreview: "Has anyone looked at the new Mamba architecture paper?",
      createdAt: daysAgo(20),
    })
    for (const [idx, uid] of [userIds[0], userIds[2], userIds[5], userIds[7]].entries()) {
      await ctx.db.insert("conversationParticipants", {
        conversationId: groupConv,
        userId: uid,
        role: idx === 0 ? "owner" : "member",
        isMuted: false,
        joinedAt: daysAgo(20),
      })
    }
    const groupMessages = [
      { sender: 0, content: "Team, let's discuss potential papers for the upcoming deadline." },
      { sender: 2, content: "I have some ideas on extending our attention mechanism work." },
      { sender: 5, content: "What about exploring the fairness implications?" },
      { sender: 7, content: "Interesting angle. We could tie it to quantum-inspired optimization." },
      { sender: 0, content: "Has anyone looked at the new Mamba architecture paper?" },
    ]
    for (let m = 0; m < groupMessages.length; m++) {
      await ctx.db.insert("messages", {
        conversationId: groupConv,
        senderId: userIds[groupMessages[m].sender],
        content: groupMessages[m].content,
        messageType: "text",
        status: "read",
        isDeleted: false,
        createdAt: hoursAgo(10 - m * 2),
      })
    }

    // ── 12. Create Papers ────────────────────────────────────
    for (let i = 0; i < PAPER_DATA.length; i++) {
      const p = PAPER_DATA[i]
      const uploaderIdx = i < userIds.length ? i : 0
      const paperId = await ctx.db.insert("papers", {
        title: p.title,
        abstract: p.abstract,
        authors: p.authors,
        doi: p.doi,
        uploadedBy: userIds[uploaderIdx],
        tags: p.tags,
        citationCount: randomInt(0, 25),
        lookingForCollaborators: p.lookingForCollaborators ?? false,
        createdAt: daysAgo(randomInt(10, 60)),
      })
      await ctx.db.insert("paperAuthors", { paperId, userId: userIds[uploaderIdx] })
      // Add a co-author
      if (i < userIds.length - 1) {
        await ctx.db.insert("paperAuthors", { paperId, userId: userIds[uploaderIdx + 1] })
      }
    }

    // ── 13. Create Resources ─────────────────────────────────
    for (let i = 0; i < RESOURCE_DATA.length; i++) {
      const r = RESOURCE_DATA[i]
      const uploaderIdx = i % userIds.length
      await ctx.db.insert("resources", {
        title: r.title,
        description: r.description,
        course: r.course,
        subject: r.subject,
        uploadedBy: userIds[uploaderIdx],
        rating: Math.round((3 + Math.random() * 2) * 10) / 10,
        ratingCount: randomInt(5, 50),
        downloadCount: randomInt(20, 500),
        createdAt: daysAgo(randomInt(5, 90)),
      })
    }

    // ── 14. Create Questions & Answers ───────────────────────
    for (let i = 0; i < QUESTION_DATA.length; i++) {
      const q = QUESTION_DATA[i]
      const askerIdx = i % userIds.length
      const questionId = await ctx.db.insert("questions", {
        title: q.title,
        content: q.content,
        askedBy: userIds[askerIdx],
        course: q.course,
        tags: q.tags,
        viewCount: randomInt(10, 200),
        upvotes: randomInt(1, 20),
        downvotes: randomInt(0, 3),
        answerCount: 0,
        createdAt: daysAgo(randomInt(1, 30)),
      })

      // Add 1-2 answers per question
      const numAnswers = randomInt(1, 2)
      for (let a = 0; a < numAnswers; a++) {
        let answererIdx = (askerIdx + a + 1) % userIds.length
        const answerId = await ctx.db.insert("answers", {
          questionId,
          content: `Here's how I'd approach this: ${randomPick(COMMENT_CONTENTS)}`,
          answeredBy: userIds[answererIdx],
          upvotes: randomInt(0, 10),
          downvotes: 0,
          isAccepted: a === 0 && i % 2 === 0, // Accept first answer on even questions
          createdAt: daysAgo(randomInt(0, 15)),
        })

        if (a === 0 && i % 2 === 0) {
          await ctx.db.patch(questionId, { acceptedAnswerId: answerId })
        }
      }
      await ctx.db.patch(questionId, { answerCount: numAnswers })
    }

    // ── 15. Create Stories ───────────────────────────────────
    const storyContents = [
      { content: "Just finished my finals! Time to code some side projects 🎉", bg: "#1a73e8" },
      { content: "Beautiful sunset from the campus library rooftop 🌅", bg: "#e91e63" },
      { content: "Coffee + Code = ❤️", bg: "#388e3c" },
    ]
    for (let i = 0; i < storyContents.length; i++) {
      const s = storyContents[i]
      await ctx.db.insert("stories", {
        authorId: userIds[i],
        content: s.content,
        backgroundColor: s.bg,
        expiresAt: now + 20 * 60 * 60 * 1000, // 20 hours from now
        viewCount: randomInt(5, 40),
        createdAt: hoursAgo(randomInt(1, 20)),
      })
    }

    // ── 16. Create Jobs ──────────────────────────────────────
    for (let i = 0; i < JOB_DATA.length; i++) {
      const j = JOB_DATA[i]
      const posterIdx = randomInt(0, userIds.length - 1)
      const jobId = await ctx.db.insert("jobs", {
        title: j.title,
        company: j.company,
        description: `We are looking for a ${j.title} to join our team. ${j.remote ? "Remote work available." : "On-site in " + j.location + "."}`,
        type: j.type,
        location: j.location,
        remote: j.remote,
        duration: j.duration,
        skillsRequired: j.skillsRequired,
        salary: j.salary,
        postedBy: userIds[posterIdx],
        applicantCount: 0,
        expiresAt: now + 30 * 24 * 60 * 60 * 1000,
        createdAt: daysAgo(randomInt(1, 15)),
      })

      // Add 1-2 applications
      const numApps = randomInt(1, 2)
      for (let a = 0; a < numApps; a++) {
        let applicantIdx = (posterIdx + a + 1) % userIds.length
        await ctx.db.insert("jobApplications", {
          jobId,
          userId: userIds[applicantIdx],
          coverLetter: "I'm excited about this opportunity and believe my skills align well with the requirements.",
          status: randomPick(["applied", "viewed", "shortlisted"]),
          createdAt: daysAgo(randomInt(0, 10)),
        })
      }
      await ctx.db.patch(jobId, { applicantCount: numApps })
    }

    // ── 17. Create Marketplace Listings ──────────────────────
    for (let i = 0; i < LISTING_DATA.length; i++) {
      const l = LISTING_DATA[i]
      const sellerIdx = randomInt(0, userIds.length - 1)
      await ctx.db.insert("listings", {
        title: l.title,
        description: l.description,
        category: l.category,
        price: l.price,
        condition: l.condition,
        sellerId: userIds[sellerIdx],
        university: USERS[sellerIdx].university,
        status: "active",
        expiresAt: now + 60 * 24 * 60 * 60 * 1000,
        createdAt: daysAgo(randomInt(1, 20)),
      })
    }

    // ── 18. Create Achievements ──────────────────────────────
    const achievementDefs = [
      { badge: "first_post", name: "First Post", description: "Published your first post" },
      { badge: "first_comment", name: "Commentator", description: "Left your first comment" },
      { badge: "contributor", name: "Top Contributor", description: "Reached 100 reputation" },
    ]
    for (let i = 0; i < Math.min(5, userIds.length); i++) {
      for (const def of achievementDefs) {
        if (Math.random() > 0.4) { // 60% chance each user gets each badge
          await ctx.db.insert("achievements", {
            userId: userIds[i],
            badge: def.badge,
            name: def.name,
            description: def.description,
            earnedAt: daysAgo(randomInt(1, 30)),
          })
        }
      }
    }

    // ── 19. Create Skill Endorsements ────────────────────────
    // Arjun endorses Priya's React skill
    await ctx.db.insert("skillEndorsements", {
      skillName: "react",
      userId: userIds[1],
      endorserId: userIds[0],
      createdAt: daysAgo(5),
    })
    // Priya endorses Arjun's NLP skill
    await ctx.db.insert("skillEndorsements", {
      skillName: "nlp",
      userId: userIds[0],
      endorserId: userIds[1],
      createdAt: daysAgo(3),
    })
    // Dr. Ramesh endorses Vikram's Docker skill
    await ctx.db.insert("skillEndorsements", {
      skillName: "docker",
      userId: userIds[4],
      endorserId: userIds[2],
      createdAt: daysAgo(7),
    })

    // ── 20. Create Notifications ─────────────────────────────
    const notifTypes = ["reaction", "comment", "mention", "follow"] as const
    for (let i = 0; i < 15; i++) {
      const recipientIdx = randomInt(0, userIds.length - 1)
      let actorIdx = randomInt(0, userIds.length - 1)
      while (actorIdx === recipientIdx) actorIdx = randomInt(0, userIds.length - 1)
      const type = randomPick([...notifTypes])
      const messages: Record<string, string> = {
        reaction: `${USERS[actorIdx].name} reacted to your post`,
        comment: `${USERS[actorIdx].name} commented on your post`,
        mention: `${USERS[actorIdx].name} mentioned you in a post`,
        follow: `${USERS[actorIdx].name} started following you`,
      }
      await ctx.db.insert("notifications", {
        recipientId: userIds[recipientIdx],
        actorId: userIds[actorIdx],
        type,
        referenceId: type !== "follow" ? (postIds[randomInt(0, postIds.length - 1)] as unknown as string) : undefined,
        message: messages[type],
        isRead: Math.random() > 0.6,
        createdAt: daysAgo(randomInt(0, 14)),
      })
    }

    // ── 21. Create Suggestions ───────────────────────────────
    for (let i = 0; i < 5; i++) {
      let suggestedIdx = (i + 3) % userIds.length
      await ctx.db.insert("suggestions", {
        userId: userIds[i],
        suggestedUserId: userIds[suggestedIdx],
        score: Math.round(Math.random() * 100) / 100,
        reasons: [
          randomPick(["Same university", "Shared skills", "Mutual connections", "Similar research interests"]),
          randomPick(["Active in same community", "Both studying ML", "Complementary skills"]),
        ],
        isDismissed: false,
        computedAt: now,
      })
    }

    // ── 22. Create Polls ─────────────────────────────────────
    // Attach a poll to the 16th post (education debate)
    if (postIds.length > 15) {
      const pollId = await ctx.db.insert("polls", {
        postId: postIds[15],
        authorId: userIds[15 % userIds.length],
        question: "Should CS programs teach more practical skills or stick to fundamentals?",
        options: [
          { id: uuid(), text: "More practical skills (web dev, cloud)", voteCount: 12 },
          { id: uuid(), text: "Stick to fundamentals (algorithms, theory)", voteCount: 18 },
          { id: uuid(), text: "A balanced mix of both", voteCount: 25 },
        ],
        totalVotes: 55,
        isAnonymous: false,
        createdAt: daysAgo(5),
      })
      await ctx.db.patch(postIds[15], { pollId })
    }

    return {
      success: true,
      summary: {
        users: userIds.length,
        posts: postIds.length,
        comments: commentIds.length,
        follows: followPairs.size,
        communities: communityIds.length,
        events: eventIds.length,
        hashtags: hashtagNames.length,
      },
    }
  },
})

/**
 * Clear all seed data (for re-seeding)
 * WARNING: Deletes ALL data in ALL tables!
 */
export const clearAll = internalMutation({
  handler: async (ctx) => {
    const tables = [
      "pushSubscriptions", "adClicks", "adImpressions", "ads",
      "listings", "jobApplications", "jobs", "questionVotes",
      "answers", "questions", "resources", "paperAuthors", "papers",
      "skillEndorsements", "suggestions", "achievements",
      "eventRSVPs", "events", "communityMembers", "communities",
      "pollVotes", "polls", "postHashtags", "hashtags",
      "storyViews", "stories", "notifications",
      "typingIndicators", "calls", "messages", "conversationParticipants", "conversations",
      "reposts", "bookmarks", "reactions", "likes", "comments",
      "follows", "subscriptions", "posts", "users",
    ] as const

    let totalDeleted = 0
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect()
      for (const doc of docs) {
        await ctx.db.delete(doc._id)
        totalDeleted++
      }
    }

    return { success: true, totalDeleted }
  },
})

// Export as action so it can be run via `npx convex run seed:seedAll`
export const seedAll = action({
  handler: async (ctx) => {
    await ctx.runMutation(seedAllInternal)
    return { success: true }
  },
})
