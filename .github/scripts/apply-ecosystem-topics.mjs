import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_MAPPING_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../data/ecosystem-topics.json');

export function readTopicMapping(path = DEFAULT_MAPPING_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function groupTopicsByRepository(mapping) {
  const byRepository = new Map();

  for (const [topic, repositories] of Object.entries(mapping)) {
    for (const repository of repositories) {
      byRepository.set(repository, [...(byRepository.get(repository) ?? []), topic]);
    }
  }

  return byRepository;
}

export function mergeTopics(existing, wanted) {
  return [...new Set([...existing, ...wanted])].sort();
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const dryRun = process.argv.includes('--dry-run');
  const byRepository = groupTopicsByRepository(readTopicMapping());

  for (const [repository, wanted] of byRepository) {
    const existing = JSON.parse(gh(['api', `repos/${repository}/topics`, '--jq', '.names'])) ?? [];
    const merged = mergeTopics(existing, wanted);

    if (merged.length === existing.length && merged.every((topic, index) => topic === existing[index])) {
      process.stdout.write(`unchanged ${repository}\n`);
      continue;
    }

    if (dryRun) {
      process.stdout.write(`would set ${repository} -> ${merged.join(', ')}\n`);
      continue;
    }

    gh(['api', `repos/${repository}/topics`, '-X', 'PUT', ...merged.flatMap((topic) => ['-f', `names[]=${topic}`])]);
    process.stdout.write(`set ${repository} -> ${merged.join(', ')}\n`);
  }
}
