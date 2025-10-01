// 快速验证数据结构
const fs = require('fs');
const path = require('path');

const enemies = JSON.parse(fs.readFileSync(path.join(__dirname, 'out/enemies.json'), 'utf8'));
const waves = JSON.parse(fs.readFileSync(path.join(__dirname, 'out/waves.json'), 'utf8'));

console.log('=== Enemies ===');
console.log('Total enemies:', Object.keys(enemies.result).length);
console.log('Enemy IDs (keys):', Object.keys(enemies.result));
console.log('\nFirst enemy:', enemies.result['40060001']);

console.log('\n=== Waves ===');
console.log('Total waves:', Object.keys(waves.result).length);
console.log('\nFirst 3 waves:');
Object.entries(waves.result).slice(0, 3).forEach(([id, wave]) => {
  console.log(`  ${id}: timestamp=${wave.timestamp}, enemyId=${wave.enemyId} (type: ${typeof wave.enemyId}), count=${wave.count}`);
});

console.log('\n=== Validation ===');
const enemyIds = new Set(Object.keys(enemies.result));
let allValid = true;

for (const [waveId, wave] of Object.entries(waves.result)) {
  const enemyIdStr = String(wave.enemyId);
  if (!enemyIds.has(enemyIdStr)) {
    console.error(`✗ Wave ${waveId} references invalid enemy ${wave.enemyId}`);
    allValid = false;
  }
}

if (allValid) {
  console.log('✓ All wave references are valid!');
}

console.log('\n=== Simulated toArray ===');
function toArray(converted) {
  return Object.entries(converted.result || {}).map(([tid, payload]) => ({ tid, ...payload }));
}

const enemyArray = toArray(enemies);
console.log('enemyArray[0]:', enemyArray[0]);
console.log('enemyArray[0].tid type:', typeof enemyArray[0].tid);

const waveArray = toArray(waves).sort((a, b) => a.timestamp - b.timestamp);
console.log('\nwaveArray[0]:', waveArray[0]);
console.log('waveArray[0].enemyId type:', typeof waveArray[0].enemyId);
