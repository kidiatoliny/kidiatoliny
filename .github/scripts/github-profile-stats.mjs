const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const PROFILE_STATS_QUERY = `
  query ProfileStats($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      repositories(
        first: 100
        isFork: false
        ownerAffiliations: OWNER
        privacy: PUBLIC
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
              }
            }
          }
        }
      }
    }
  }
`;

export function calculateStreaks(days, today) {
  const sortedDays = [...days]
    .filter((day) => day.date <= today)
    .sort((left, right) => left.date.localeCompare(right.date));
  let longest = 0;
  let running = 0;

  for (const day of sortedDays) {
    if (day.contributionCount > 0) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  let currentIndex = sortedDays.length - 1;

  if (sortedDays[currentIndex]?.date === today && sortedDays[currentIndex].contributionCount === 0) {
    currentIndex -= 1;
  }

  let current = 0;

  while (currentIndex >= 0 && sortedDays[currentIndex].contributionCount > 0) {
    current += 1;
    currentIndex -= 1;
  }

  return { current, longest };
}

export function normalizeGitHubProfileStats(payload, today) {
  const user = payload?.data?.user;

  if (!user) {
    throw new Error('GitHub profile statistics did not include a user.');
  }

  const calendar = user.contributionsCollection.contributionCalendar;
  const days = calendar.weeks.flatMap((week) => week.contributionDays);
  const streaks = calculateStreaks(days, today);
  const languageSizes = new Map();

  for (const repository of user.repositories.nodes) {
    for (const edge of repository.languages?.edges ?? []) {
      languageSizes.set(edge.node.name, (languageSizes.get(edge.node.name) ?? 0) + edge.size);
    }
  }

  const languages = [...languageSizes.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5)
    .map(([language]) => language);

  return {
    year: Number(today.slice(0, 4)),
    contributions: calendar.totalContributions,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    languages,
  };
}

export async function fetchGitHubProfileStats({
  token,
  username,
  year,
  today = new Date().toISOString().slice(0, 10),
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'kidiatoliny-profile-readme',
    },
    body: JSON.stringify({
      query: PROFILE_STATS_QUERY,
      variables: {
        login: username,
        from: `${year}-01-01T00:00:00Z`,
        to: `${today}T23:59:59Z`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub profile statistics request failed with status ${response.status}.`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  return normalizeGitHubProfileStats(payload, today);
}
