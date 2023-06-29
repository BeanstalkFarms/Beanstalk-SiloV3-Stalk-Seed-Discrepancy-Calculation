const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/seed-stalk-discrepencies.json'))

const disrepancies = {};
const stalkDiscrepencies = {};
const seedDiscrepencies = {};

data.forEach((v) => { 
  disrepancies[v[0]] = {
    stalk: v[1],
    seed: v[2]
  };
  stalkDiscrepencies[v[0]] = v[1];
  seedDiscrepencies[v[0]] = v[2];
});

fs.writeFileSync(`./data/discrepencies.json`, JSON.stringify(disrepancies, null, 4));
fs.writeFileSync(`./data/stalk-discrepencies.json`, JSON.stringify(stalkDiscrepencies, null, 4));
fs.writeFileSync(`./data/seed-discrepencies.json`, JSON.stringify(seedDiscrepencies, null, 4));
