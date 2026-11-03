export const CONTRIBUTION_CALENDAR = {
  totalContributions: 42,
  weeks: [
    {
      contributionDays: [
        { date: '2026-07-18', contributionCount: 0 },
        { date: '2026-07-19', contributionCount: 3 },
        { date: '2026-07-20', contributionCount: 4 },
        { date: '2026-07-21', contributionCount: 0 },
      ],
    },
  ],
};

export const OWNER_REPOSITORY_PAGES = {
  kidiatoliny: [
    {
      cursor: 'kidiatoliny-page-2',
      nodes: [
        repository(['PHP', 900], ['TypeScript', 500], ['Swift', 200]),
        repository(['TypeScript', 400], ['Rust', 150], ['Go', 100], ['Shell', 50]),
      ],
    },
    { cursor: null, nodes: [repository(['PHP', 600], ['C', 200])] },
  ],
  'akira-io': [{ cursor: null, nodes: [repository(['PHP', 600], ['Go', 500], ['JavaScript', 300])] }],
  'akira-foundation': [
    { cursor: null, nodes: [repository(['Swift', 800], ['TypeScript', 300], ['Rust', 400])] },
  ],
  'Nos-Ferry': [
    {
      cursor: null,
      nodes: [repository(['PHP', 1500], ['TypeScript', 700], ['JavaScript', 200], ['Go', 200])],
    },
  ],
  'Bu-Payment': [{ cursor: null, nodes: [repository(['PHP', 900], ['TypeScript', 250])] }],
  'kriol-lang': [{ cursor: null, nodes: [repository(['C++', 700], ['C', 400], ['Shell', 100])] }],
};

function repository(...languages) {
  return { languages: { edges: languages.map(([name, size]) => ({ size, node: { name } })) } };
}

export function everyFixtureRepository() {
  return Object.values(OWNER_REPOSITORY_PAGES).flatMap((pages) => pages.flatMap((page) => page.nodes));
}

export function createFetchImpl(requests = [], { unresolved = [], danglingCursor, stuckCursor } = {}) {
  return async (_url, request) => {
    requests.push(request);

    const { variables } = JSON.parse(request.body);

    if (!Object.hasOwn(variables, 'after')) {
      return respond({ user: { contributionsCollection: { contributionCalendar: CONTRIBUTION_CALENDAR } } });
    }

    if (unresolved.includes(variables.login)) {
      return respond({ repositoryOwner: null });
    }

    if (variables.login === danglingCursor) {
      return respondWithPage([], { hasNextPage: true, endCursor: null });
    }

    if (variables.login === stuckCursor) {
      return respondWithPage([], { hasNextPage: true, endCursor: 'stuck' });
    }

    const pages = OWNER_REPOSITORY_PAGES[variables.login];
    const page = variables.after === null
      ? pages[0]
      : pages.find((_candidate, index) => index > 0 && pages[index - 1].cursor === variables.after);

    return respondWithPage(page.nodes, { hasNextPage: page.cursor !== null, endCursor: page.cursor });
  };
}

function respondWithPage(nodes, pageInfo) {
  return respond({ repositoryOwner: { repositories: { nodes, pageInfo } } });
}

function respond(data) {
  return { ok: true, json: async () => ({ data }) };
}
