const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";

async function callClaude(messages, system, apiKey, maxTokens = 1500) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return data.content.map((b) => b.text || "").join("");
}

function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function generateLesson(topic, history = [], apiKey) {
  const recentTitles = history
    .slice(0, 5)
    .map((s) => s.lessonTitle || s.topic)
    .join(", ");

  const system = `You are MicroLearn, an expert at delivering punchy, insight-dense microlessons.
Lessons are:
- 300–450 words total — scannable on a phone
- Practical: readers can apply the idea TODAY
- Structured: hook → insight sections → takeaway → action prompt
Always respond with raw JSON only. No markdown fences, no preamble.`;

  const prompt = `Generate a microlesson on the topic: "${topic}"
${
  recentTitles
    ? `User recently studied: ${recentTitles} — pick a fresh angle.`
    : ""
}

Return EXACTLY this JSON:
{
  "title": "Compelling lesson title (max 8 words)",
  "subtitle": "One-sentence teaser that makes them want to read",
  "topic": "${topic}",
  "readTime": "3 min",
  "hook": "Opening sentence — surprising stat, bold claim, or relatable scenario",
  "sections": [
    { "heading": "Section title", "content": "2–3 sentences of concrete insight" },
    { "heading": "Section title", "content": "2–3 sentences of concrete insight" },
    { "heading": "Section title", "content": "2–3 sentences of concrete insight" }
  ],
  "keyTakeaway": "The single sentence someone should remember tomorrow",
  "doThisNow": "One specific action they can do in the next 10 minutes",
  "funFact": "A surprising, memorable fact related to the topic"
}`;

  const text = await callClaude(
    [{ role: "user", content: prompt }],
    system,
    apiKey
  );
  try {
    return parseJSON(text);
  } catch {
    throw new Error("Could not parse lesson from AI response.");
  }
}

export async function generateQuiz(lesson, apiKey) {
  const system = `You generate concise multiple-choice quiz questions.
Always respond with raw JSON only. No markdown fences, no preamble.`;

  const prompt = `Create a 3-question quiz for this lesson:
Title: ${lesson.title}
Key takeaway: ${lesson.keyTakeaway}
Content summary: ${lesson.sections?.map((s) => s.content).join(" ")}

Return EXACTLY this JSON:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correct": 0,
      "explanation": "Short reason why the correct answer is right"
    }
  ]
}
Make questions test genuine understanding, not trivia.`;

  const text = await callClaude(
    [{ role: "user", content: prompt }],
    system,
    apiKey
  );
  try {
    return parseJSON(text);
  } catch {
    throw new Error("Could not parse quiz from AI response.");
  }
}

export async function generateSuggestions(userProfile, history = [], apiKey) {
  const system = `You are a personalised learning advisor. Suggest what to study next.
Always respond with raw JSON only. No markdown fences, no preamble.`;

  const topicCounts = {};
  history.forEach((s) => {
    topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1;
  });

  const prompt = `Suggest 3 next microlessons for this learner:
Interests: ${userProfile.interests?.join(", ") || "General"}
Topic history (counts): ${JSON.stringify(topicCounts)}
Total XP: ${userProfile.xp || 0}
Streak: ${userProfile.streak || 0} days

Rules:
- Vary topics — don't repeat the most-studied one
- Match difficulty to XP (low XP = beginner friendly)
- Give a compelling reason each time

Return EXACTLY this JSON:
{
  "suggestions": [
    {
      "topic": "one of: Productivity|Soft Skills|Tech|Health|Mindfulness|STEM",
      "title": "Specific, enticing lesson title",
      "reason": "One sentence: why this is perfect for them right now",
      "difficulty": "Beginner|Intermediate|Advanced"
    }
  ]
}`;

  const text = await callClaude(
    [{ role: "user", content: prompt }],
    system,
    apiKey
  );
  try {
    return parseJSON(text);
  } catch {
    return { suggestions: [] };
  }
}
