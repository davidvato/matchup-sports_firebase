function testGreedy(N) {
  const players = Array.from({ length: N }, (_, i) => String.fromCharCode(65 + i));
  const pairings = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      pairings.push([i, j]);
    }
  }

  const matches = [];
  const sitouts = [];
  const usedPairings = new Set();
  const playerMatchCount = Array(N).fill(0);

  // Sort pairings to prioritize those with fewer matches?
  // For now, just go through them.
  
  let attempts = 0;
  const pairingsToProcess = [...pairings];

  while (pairingsToProcess.length > 0 && attempts < 100) {
    const p1 = pairingsToProcess.shift();
    const p1Key = p1.sort((a,b)=>a-b).join('-');
    
    // Find a disjoint p2
    let foundIdx = -1;
    for (let i = 0; i < pairingsToProcess.length; i++) {
      const p2 = pairingsToProcess[i];
      if (p1[0] !== p2[0] && p1[0] !== p2[1] && p1[1] !== p2[0] && p1[1] !== p2[1]) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx !== -1) {
      const p2 = pairingsToProcess.splice(foundIdx, 1)[0];
      matches.push(`${players[p1[0]]}/${players[p1[1]]} vs ${players[p2[0]]}/${players[p2[1]]}`);
      p1.concat(p2).forEach(idx => playerMatchCount[idx]++);
    } else {
      sitouts.push(`Pair ${players[p1[0]]}/${players[p1[1]]} sits`);
    }
    attempts++;
  }

  console.log("Matches:", matches);
  console.log("Sitouts:", sitouts);
  console.log("Player Match Counts:", playerMatchCount);
}

testGreedy(7);
