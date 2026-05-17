const fs = require("fs");
const path = require("path");

const USERNAME = process.env.LEETCODE_USERNAME || "username";

const STATS_QUERY = `
query userPublicProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { realName ranking }
    submitStats { acSubmissionNum { difficulty count submissions } }
    userCalendar(year: ${new Date().getFullYear()}) { streak totalActiveDays submissionCalendar }
  }
}`;

const RECENT_QUERY = `
query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id title titleSlug timestamp lang
  }
}`;

// New query to fetch question specific details
const QUESTION_DETAILS_QUERY = `
query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionId
    title
    difficulty
    content
    topicTags { name slug }
  }
}`;

async function fetchGraphQL(query, variables) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function run() {
  console.log(`Fetching data for: ${USERNAME}`);

  const [statsData, recentData] = await Promise.all([
    fetchGraphQL(STATS_QUERY, { username: USERNAME }),
    fetchGraphQL(RECENT_QUERY, { username: USERNAME, limit: 20 }),
  ]);

  const user = statsData.matchedUser;
  if (!user) throw new Error(`User "${USERNAME}" not found.`);

  const recentList = (recentData && recentData.recentAcSubmissionList) || [];

  // Get details for all recent questions to include problem descriptions
  const detailedRecent = await Promise.all(
    recentList.map(async (sub) => {
      try {
        const qData = await fetchGraphQL(QUESTION_DETAILS_QUERY, { titleSlug: sub.titleSlug });
        const question = qData.question || {};
        return {
          id: sub.id,
          title: sub.title,
          slug: sub.titleSlug,
          lang: sub.lang,
          solvedAt: sub.timestamp ? new Date(parseInt(sub.timestamp, 10) * 1000).toISOString() : null,
          difficulty: question.difficulty || "Unknown",
          tags: (question.topicTags || []).map(t => t.name),
          description: question.content || "", // HTML problem statement
          leetcodeLink: `https://leetcode.com/problems/${sub.titleSlug}/`
        };
      } catch (err) {
        console.warn(`Skipped details for ${sub.titleSlug}:`, err.message);
        return {
          id: sub.id,
          title: sub.title,
          slug: sub.titleSlug,
          lang: sub.lang,
          solvedAt: sub.timestamp ? new Date(parseInt(sub.timestamp, 10) * 1000).toISOString() : null,
          difficulty: "Unknown",
          tags: [],
          description: "",
          leetcodeLink: `https://leetcode.com/problems/${sub.titleSlug}/`
        };
      }
    })
  );

  // Parse your stats...
  const acList = (user.submitStats && user.submitStats.acSubmissionNum) || [];
  const stats = acList.reduce((acc, item) => {
    const key = String(item.difficulty || "").toLowerCase();
    acc[key] = { count: item.count || 0, submissions: item.submissions || 0 };
    acc.totalCount = (acc.totalCount || 0) + (item.count || 0);
    acc.totalSubmissions = (acc.totalSubmissions || 0) + (item.submissions || 0);
    return acc;
  }, {});

  // Parse submission calendar safely
  const rawCalendar = (user.userCalendar && user.userCalendar.submissionCalendar) || {};
  const calendarFormatted = {};
  try {
    const entries = typeof rawCalendar === 'string' ? JSON.parse(rawCalendar) : rawCalendar;
    Object.entries(entries || {}).forEach(([ts, count]) => {
      const date = new Date(parseInt(ts, 10) * 1000).toISOString().split('T')[0];
      calendarFormatted[date] = count;
    });
  } catch (e) {
    // ignore parse errors and leave calendar empty
  }

  // Language breakdown from recent submissions
  const languageCounts = recentList.reduce((acc, sub) => {
    const lang = sub.lang || 'unknown';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  const output = {
    meta: {
      username: user.username || USERNAME,
      realName: (user.profile && user.profile.realName) || null,
      ranking: (user.profile && user.profile.ranking) || null,
      lastUpdated: new Date().toISOString(),
    },
    stats: {
      easy: stats.easy || { count: 0, submissions: 0 },
      medium: stats.medium || { count: 0, submissions: 0 },
      hard: stats.hard || { count: 0, submissions: 0 },
      total: { count: stats.totalCount/2 || 0, submissions: stats.totalSubmissions || 0 },
    },
    streak: {
      current: (user.userCalendar && user.userCalendar.streak) || 0,
      totalActiveDays: (user.userCalendar && user.userCalendar.totalActiveDays) || 0,
    },
    calendar: calendarFormatted,
    languageBreakdown: languageCounts,
    recentSolved: detailedRecent // All recent submissions with problem descriptions
  };

  const dataDir = path.join(__dirname, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "stats.json"), JSON.stringify(output, null, 2));
  console.log("✅ stats.json updated with problem details.");
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});