/**
 * Intelligent Script & Metadata Generator
 *
 * Takes any prompt or idea provided by the user and dynamically constructs
 * a cohesive 4-scene video script, title, caption, CTA, and hashtags tailored
 * to the creator's voice (Tech / CSE / Educational).
 */

export interface GeneratedScriptScene {
  scene: string;
  text: string;
  subtitle?: string;
  codeSnippet?: string;
}

export interface GeneratedVideoScript {
  title: string;
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  topic: string;
  scenes: GeneratedScriptScene[];
}

/**
 * Common tech keywords and their associated contextual explanations and tags.
 */
interface TopicPattern {
  keywords: RegExp;
  topic: string;
  hookPrefix: string;
  explanation: string;
  tip: string;
  hashtags: string[];
  codeSnippet?: string;
}

const TOPIC_PATTERNS: TopicPattern[] = [
  {
    keywords: /python/i,
    topic: 'Python',
    hookPrefix: '3 Python secrets senior developers use every day',
    explanation:
      'Python list comprehensions and generators let you process massive datasets in memory-efficient single lines.',
    tip: 'Use enumerate() instead of range(len()) and use f-strings for 2x faster string formatting.',
    hashtags: ['#Python', '#CodingTips', '#Programming', '#SoftwareEngineer', '#CSE'],
    codeSnippet: 'squares = [x**2 for x in range(10) if x % 2 == 0]',
  },
  {
    keywords: /react|useeffect|hook|frontend/i,
    topic: 'React',
    hookPrefix: 'The one mistake 90% of devs make with React hooks',
    explanation:
      'Effects are for synchronizing with external systems, not for computing state derived from existing props.',
    tip: 'Always declare your dependencies exhaustively and clean up subscriptions in the return function.',
    hashtags: ['#ReactJS', '#WebDev', '#JavaScript', '#Frontend', '#CodeNewbie'],
    codeSnippet: 'useEffect(() => {\n  const sub = api.subscribe(id);\n  return () => sub.unsubscribe();\n}, [id]);',
  },
  {
    keywords: /javascript|js|typescript|ts/i,
    topic: 'JavaScript',
    hookPrefix: 'Why JavaScript event loop breaks your intuition',
    explanation:
      'Microtasks like Promise callbacks always run before macrotasks like setTimeout, regardless of delay.',
    tip: 'Avoid blocking the call stack with heavy loops; use Web Workers for CPU-intensive calculations.',
    hashtags: ['#JavaScript', '#TypeScript', '#WebDevelopment', '#TechLife', '#Coding'],
    codeSnippet: 'console.log("1");\nsetTimeout(() => console.log("2"), 0);\nPromise.resolve().then(() => console.log("3"));',
  },
  {
    keywords: /interview|dsa|algorithm|binary search|leetcode/i,
    topic: 'Coding Interviews',
    hookPrefix: 'How to crack technical interview questions in 3 simple steps',
    explanation:
      'Never jump straight into code: clarify the input bounds, talk through your brute force approach, then optimize with two pointers or binary search.',
    tip: 'Writing clean test cases before coding guarantees you catch edge cases like empty arrays and overflow.',
    hashtags: ['#DSA', '#LeetCode', '#CodingInterview', '#CSMajor', '#TechCareers'],
    codeSnippet: 'mid = left + (right - left) // 2\nif arr[mid] == target: return mid',
  },
  {
    keywords: /ai|machine learning|llm|gemini|gpt/i,
    topic: 'Artificial Intelligence',
    hookPrefix: 'The AI architecture change everyone will be talking about',
    explanation:
      'Modern multimodal agents combine low-latency text reasoning with real-time tool calling and streaming speech synthesis.',
    tip: 'Anchor your prompts with structured schema outputs to ensure reliable parsing in production pipelines.',
    hashtags: ['#ArtificialIntelligence', '#GeminiAI', '#MachineLearning', '#TechTrends', '#BuildWithAI'],
    codeSnippet: 'const response = await ai.models.generateContent({\n  model: "gemini-2.0-flash",\n  contents: prompt\n});',
  },
  {
    keywords: /web|api|backend|rest|websocket|node/i,
    topic: 'Backend APIs',
    hookPrefix: 'WebSockets vs REST: when should you actually switch?',
    explanation:
      'Use REST for transactional state changes and cacheable queries; use WebSockets only for bidirectional sub-100ms streaming.',
    tip: 'Always implement heartbeat pings and auto-reconnect backoff to survive unstable mobile connections.',
    hashtags: ['#Backend', '#WebSockets', '#NodeJS', '#APIDesign', '#CloudComputing'],
    codeSnippet: 'ws.on("open", () => ws.send(JSON.stringify({ type: "ping" })));',
  },
  {
    keywords: /study|student|routine|college|exam/i,
    topic: 'Student Productivity',
    hookPrefix: 'The exact study system that got me through CSE without burning out',
    explanation:
      'Passive re-reading has a 10% retention rate. Active recall combined with spaced repetition boosts recall to over 85%.',
    tip: 'Do 50-minute focused code sprints followed by 10-minute walks without your phone.',
    hashtags: ['#StudentLife', '#StudyWithMe', '#CSE', '#CollegeHacks', '#Productivity'],
  },
];

/**
 * Extracts key nouns / words from prompt to generate tags.
 */
function extractCustomTags(prompt: string): string[] {
  const words = prompt
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 4)
    .map((w) => `#${w.charAt(0).toUpperCase()}${w.slice(1)}`);

  const defaults = ['#CSE', '#TechTips', '#CodingLife', '#HackBriven', '#LearnInPublic'];
  const merged = Array.from(new Set([...words, ...defaults]));
  return merged.slice(0, 5);
}

/**
 * Generates an end-to-end 9:16 short video script from any user prompt.
 */
export function generateScriptFromPrompt(rawPrompt: string): GeneratedVideoScript {
  const prompt = rawPrompt.trim();
  if (prompt.length === 0) {
    return {
      title: 'Binary Search Made Easy ✨',
      hook: 'POV: You finally understand Binary Search after 3 days 😅',
      caption: 'Binary Search Made Easy ✨ #CSE #CodingLife',
      hashtags: ['#CSE', '#CodingLife', '#StudyWithMe', '#BinarySearch', '#StudentsLife'],
      cta: 'Save this for your next coding interview & follow for daily CSE tips!',
      topic: 'Binary Search',
      scenes: [
        {
          scene: 'Hook',
          text: 'POV: You finally understand Binary Search after 3 days 😅',
          subtitle: 'Binary search splits the search interval in half every single step.',
        },
        {
          scene: 'Explanation',
          text: 'Instead of checking every element one by one in O(n) time, binary search cuts the sorted array in half each time in O(log n).',
          codeSnippet: 'while (left <= right) {\n  const mid = (left + right) >> 1;\n  if (arr[mid] === target) return mid;\n}',
        },
        {
          scene: 'Pro Tip',
          text: 'Remember: the array MUST be sorted first, and calculate mid using left + (right - left) / 2 to avoid integer overflow.',
        },
        {
          scene: 'CTA',
          text: 'Save this for your next interview and follow for more daily coding shortcuts!',
        },
      ],
    };
  }

  // Find matching pattern
  const matched = TOPIC_PATTERNS.find((p) => p.keywords.test(prompt));

  const cleanTitle = prompt.length > 50 ? `${prompt.slice(0, 47)}...` : prompt;
  const topic = matched?.topic ?? cleanTitle;
  const hook =
    matched !== undefined && !prompt.toLowerCase().startsWith('pov')
      ? `${matched.hookPrefix}: ${prompt}`
      : prompt;

  const explanation =
    matched?.explanation ??
    `Here is how ${cleanTitle} actually works: breaking down the core principles into simple mental models makes complex technical concepts stick instantly.`;

  const tip =
    matched?.tip ??
    `Pro tip: Always benchmark your assumptions with real metrics and test edge cases early in your development cycle.`;

  const cta = `Save this guide on ${topic} & follow for daily developer breakdowns!`;

  const hashtags = matched?.hashtags ?? extractCustomTags(prompt);
  const caption = `${hook.slice(0, 180)} ✨\n\n${explanation.slice(0, 120)}...`;

  const scenes: GeneratedScriptScene[] = [
    {
      scene: 'Hook',
      text: hook,
      subtitle: `Let's break down ${topic} in 30 seconds.`,
    },
    {
      scene: 'Core Concept',
      text: explanation,
      codeSnippet: matched?.codeSnippet,
    },
    {
      scene: 'Key Insight',
      text: tip,
    },
    {
      scene: 'Next Steps',
      text: cta,
    },
  ];

  return {
    title: cleanTitle,
    hook,
    caption,
    hashtags,
    cta,
    topic,
    scenes,
  };
}
