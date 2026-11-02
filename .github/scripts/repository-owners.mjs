export const REPOSITORY_OWNERS = [
  'kidiatoliny',
  'akira-io',
  'akira-foundation',
  'Nos-Ferry',
  'Bu-Payment',
  'kriol-lang',
];

export function ownerAlias(login) {
  return `owner${login.replace(/[^A-Za-z0-9]/gu, '')}`;
}

export function ownerVariables() {
  return Object.fromEntries(REPOSITORY_OWNERS.map((login) => [ownerAlias(login), login]));
}

export function ownerQueryArguments() {
  return REPOSITORY_OWNERS.map((login) => `$${ownerAlias(login)}: String!`).join('\n    ');
}

export function ownerQueryFields(fragment) {
  return REPOSITORY_OWNERS
    .map((login) => `${ownerAlias(login)}: repositoryOwner(login: $${ownerAlias(login)}) {\n      ...${fragment}\n    }`)
    .join('\n    ');
}

export function ownerNodes(data) {
  return REPOSITORY_OWNERS.map((login) => data?.[ownerAlias(login)]).filter(Boolean);
}

export function assertOwnersResolved(data) {
  const unresolved = REPOSITORY_OWNERS.filter((login) => !data?.[ownerAlias(login)]);

  if (unresolved.length > 0) {
    throw new Error(`GitHub returned no repository owner for ${unresolved.join(', ')}.`);
  }
}
