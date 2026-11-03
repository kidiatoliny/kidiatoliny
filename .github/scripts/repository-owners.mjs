const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const REPOSITORIES_PER_PAGE = 100;

export const REPOSITORY_OWNERS = [
  'kidiatoliny',
  'akira-io',
  'akira-foundation',
  'Nos-Ferry',
  'Bu-Payment',
  'kriol-lang',
];

export async function requestGitHubGraphQL({ token, query, variables, subject, fetchImpl = fetch }) {
  const response = await fetchImpl(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'user-agent': 'kidiatoliny-profile-readme',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GitHub ${subject} request failed with status ${response.status}.`);
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join('; '));
  }

  return payload.data;
}

async function fetchOwnerRepositories({ token, login, filters, selection, subject, fetchImpl = fetch }) {
  const query = `
    query OwnerRepositories($login: String!, $after: String) {
      repositoryOwner(login: $login) {
        repositories(first: ${REPOSITORIES_PER_PAGE}, after: $after, ${filters}) {
          nodes {
            ${selection}
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;
  const nodes = [];
  let after = null;

  do {
    const data = await requestGitHubGraphQL({
      token,
      query,
      variables: { login, after },
      subject,
      fetchImpl,
    });
    const repositories = data?.repositoryOwner?.repositories;

    if (!repositories) {
      throw new Error(`GitHub returned no repository owner for ${login}.`);
    }

    nodes.push(...repositories.nodes);
    after = repositories.pageInfo.hasNextPage ? repositories.pageInfo.endCursor : null;
  } while (after);

  return nodes;
}

export async function fetchEveryOwnerRepositories(options) {
  const perOwner = await Promise.all(
    REPOSITORY_OWNERS.map((login) => fetchOwnerRepositories({ ...options, login })),
  );

  return perOwner.flat();
}
