import { fetchEveryOwnerRepositories, requestGitHubGraphQL } from './repository-owners.mjs';

const TECHNOLOGY_SIGNALS = new Map([
  ['Swift', 'Swift + SwiftUI'],
  ['PHP', 'PHP + Laravel'],
  ['Go', 'Go'],
  ['Rust', 'Rust'],
  ['TypeScript', 'TypeScript'],
  ['JavaScript', 'JavaScript'],
  ['Python', 'Python'],
  ['C', 'C'],
  ['C++', 'C++'],
]);

const REQUEST_SUBJECT = 'profile statistics';

const REPOSITORY_FILTERS = `
  isFork: false
  ownerAffiliations: OWNER
  orderBy: { field: UPDATED_AT, direction: DESC }
`;

const LANGUAGE_SELECTION = `
  languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
    edges {
      size
      node {
        name
      }
    }
  }
`;

const CONTRIBUTIONS_QUERY = `
  query ProfileContributions($login: String!, $from: DateTime!, $to: DateTime!) {
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

export function normalizeGitHubProfileStats({ contributionCalendar, repositories }, today) {
  const days = contributionCalendar.weeks.flatMap((week) => week.contributionDays);
  const streaks = calculateStreaks(days, today);
  const languageSizes = new Map([...TECHNOLOGY_SIGNALS.values()].map((signal) => [signal, 0]));

  for (const repository of repositories) {
    for (const edge of repository.languages?.edges ?? []) {
      const signal = TECHNOLOGY_SIGNALS.get(edge.node.name);

      if (signal) {
        languageSizes.set(signal, languageSizes.get(signal) + edge.size);
      }
    }
  }

  const selectedLanguages = [...languageSizes.entries()]
    .sort((left, right) => right[1] - left[1]);
  const totalLanguageSize = selectedLanguages.reduce((total, [, size]) => total + size, 0);
  const languages = selectedLanguages.map(([name, size]) => ({
    name,
    share: totalLanguageSize === 0 ? 0 : Math.round((size / totalLanguageSize) * 1000) / 10,
  }));

  if (totalLanguageSize > 0) {
    const roundedTotal = languages.reduce((total, language) => total + language.share, 0);
    languages[0].share = Math.round((languages[0].share + 100 - roundedTotal) * 10) / 10;
  }

  return {
    year: Number(today.slice(0, 4)),
    contributions: contributionCalendar.totalContributions,
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
  const data = await requestGitHubGraphQL({
    token,
    query: CONTRIBUTIONS_QUERY,
    variables: {
      login: username,
      from: `${year}-01-01T00:00:00Z`,
      to: `${today}T23:59:59Z`,
    },
    subject: REQUEST_SUBJECT,
    fetchImpl,
  });

  if (!data?.user) {
    throw new Error('GitHub profile statistics did not include a user.');
  }

  const repositories = await fetchEveryOwnerRepositories({
    token,
    filters: REPOSITORY_FILTERS,
    selection: LANGUAGE_SELECTION,
    subject: REQUEST_SUBJECT,
    fetchImpl,
  });

  return normalizeGitHubProfileStats(
    { contributionCalendar: data.user.contributionsCollection.contributionCalendar, repositories },
    today,
  );
}
