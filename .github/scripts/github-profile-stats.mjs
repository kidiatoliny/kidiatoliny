import { ownerNodes, ownerQueryArguments, ownerQueryFields, ownerVariables } from './repository-owners.mjs';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const TECHNOLOGY_SIGNALS = new Map([
  ['Swift', 'Swift + SwiftUI'],
  ['PHP', 'PHP + Laravel'],
  ['Go', 'Go'],
  ['Rust', 'Rust'],
  ['TypeScript', 'TypeScript'],
  ['JavaScript', 'JavaScript'],
  ['Python', 'Python'],
]);

const PROFILE_STATS_QUERY = `
  query ProfileStats(
    $login: String!
    $from: DateTime!
    $to: DateTime!
    ${ownerQueryArguments()}
  ) {
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
    ${ownerQueryFields('RepositoryLanguages')}
  }

  fragment RepositoryLanguages on RepositoryOwner {
    repositories(
        first: 100
        isFork: false
        ownerAffiliations: OWNER
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
  const languageSizes = new Map([...TECHNOLOGY_SIGNALS.keys()].map((language) => [language, 0]));
  const repositoryOwners = ownerNodes(payload.data);

  for (const owner of repositoryOwners) {
    for (const repository of owner.repositories?.nodes ?? []) {
      for (const edge of repository.languages?.edges ?? []) {
        if (TECHNOLOGY_SIGNALS.has(edge.node.name)) {
          languageSizes.set(edge.node.name, languageSizes.get(edge.node.name) + edge.size);
        }
      }
    }
  }

  const selectedLanguages = [...languageSizes.entries()]
    .sort((left, right) => right[1] - left[1]);
  const totalLanguageSize = selectedLanguages.reduce((total, [, size]) => total + size, 0);
  const languages = selectedLanguages.map(([language, size]) => ({
    name: TECHNOLOGY_SIGNALS.get(language),
    share: totalLanguageSize === 0 ? 0 : Math.round((size / totalLanguageSize) * 1000) / 10,
  }));

  if (languages.length > 0) {
    const roundedTotal = languages.reduce((total, language) => total + language.share, 0);
    languages[0].share = Math.round((languages[0].share + 100 - roundedTotal) * 10) / 10;
  }

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
        ...ownerVariables(),
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
