export const REPOSITORY_OWNERS = [
  'kidiatoliny',
  'akira-io',
  'akira-foundation',
  'Nos-Ferry',
  'Bu-Payment',
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
