import type {
  ConvertedTable,
  GameLibrary,
  GameResources,
  OperatorRow,
  WeaponRow,
  RelicRow,
  EnemyRow,
  BossRow,
  WaveRow,
  SkillNodeRow,
  SynergyCardRow,
  TableResource
} from './types';

let cache: GameResources | null = null;

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`无法加载 ${path}`);
  }
  return response.json();
}

export async function loadResources(): Promise<GameResources> {
  if (cache) return cache;
  const [operators, weapons, relics, enemies, bosses, waves, skillTree, synergyCards] = await Promise.all([
    loadJson<TableResource<OperatorRow>>('./operators.json'),
    loadJson<TableResource<WeaponRow>>('./weapons.json'),
    loadJson<TableResource<RelicRow>>('./relics.json'),
    loadJson<TableResource<EnemyRow>>('./enemies.json'),
    loadJson<TableResource<BossRow>>('./bosses.json'),
    loadJson<TableResource<WaveRow>>('./waves.json'),
    loadJson<TableResource<SkillNodeRow>>('./skill_tree.json'),
    loadJson<TableResource<SynergyCardRow>>('./synergy_cards.json')
  ]);
  cache = { operators, weapons, relics, enemies, bosses, waves, skillTree, synergyCards };
  return cache;
}

export function tableToArray<T extends { tid: string }>(resource: TableResource<T>): T[] {
  const result = (resource as ConvertedTable<T>).result || {};
  return Object.entries(result).map(([tid, payload]) => ({ ...(payload as object), tid } as T));
}

export function parseLibrary(resources: GameResources): GameLibrary {
  const operators = tableToArray(resources.operators).sort((a, b) => a.tid.localeCompare(b.tid));
  const weapons = tableToArray(resources.weapons).sort((a, b) => a.tid.localeCompare(b.tid));
  const relics = tableToArray(resources.relics).sort((a, b) => a.tid.localeCompare(b.tid));
  const enemies = tableToArray(resources.enemies);
  const bosses = tableToArray(resources.bosses);
  const waves = tableToArray(resources.waves).sort((a, b) => a.timestamp - b.timestamp);
  const skillTree = tableToArray(resources.skillTree);
  const synergyCards = tableToArray(resources.synergyCards);
  return { operators, weapons, relics, enemies, bosses, waves, skillTree, synergyCards };
}

export function resetResourceCache(): void {
  cache = null;
}
