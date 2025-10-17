let cache = null;
async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`无法加载 ${path}`);
    }
    return response.json();
}
export async function loadResources() {
    if (cache)
        return cache;
    const [operators, weapons, relics, enemies, bosses, waves, skillTree, synergyCards] = await Promise.all([
        loadJson('./operators.json'),
        loadJson('./weapons.json'),
        loadJson('./relics.json'),
        loadJson('./enemies.json'),
        loadJson('./bosses.json'),
        loadJson('./waves.json'),
        loadJson('./skill_tree.json'),
        loadJson('./synergy_cards.json')
    ]);
    cache = { operators, weapons, relics, enemies, bosses, waves, skillTree, synergyCards };
    return cache;
}
export function tableToArray(resource) {
    const result = resource.result || {};
    return Object.entries(result).map(([tid, payload]) => ({ ...payload, tid }));
}
export function parseLibrary(resources) {
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
export function resetResourceCache() {
    cache = null;
}
