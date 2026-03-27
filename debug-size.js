const { generateHistoricalSummary } = require('./lib/server-data');

async function debug() {
  const summary = await generateHistoricalSummary();
  const json = JSON.stringify(summary);
  console.log('HistoricalSummary size:', (json.length / 1024).toFixed(2), 'KB');
  // console.log(json.slice(0, 1000));
}

debug();
