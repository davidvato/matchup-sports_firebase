function test(N) {
  const allPairs = Array.from({ length: N }, (_, i) => ({ id: `id-${i}`, name: String.fromCharCode(65 + i) }));
  const numPlayers = N % 2 === 0 ? N : N + 1;
  const players = Array.from({ length: numPlayers }, (_, i) => i);
  const rounds = numPlayers - 1;
  
  const matches = [];
  const sitouts = [];
  const pairingsUsed = new Set();

  for (let r = 0; r < rounds; r++) {
    const roundPairings = [];
    for (let i = 0; i < numPlayers / 2; i++) {
      const p1 = players[i];
      const p2 = players[numPlayers - 1 - i];
      
      if (p1 < N && p2 < N) {
        roundPairings.push([p1, p2]);
      } else {
        const realPlayer = p1 < N ? p1 : p2;
        sitouts.push(`Round ${r}: ${allPairs[realPlayer].name} sits alone`);
      }
    }

    // Partition roundPairings into matches of 2 pairs each
    for (let i = 0; i < roundPairings.length; i += 2) {
      if (i + 1 < roundPairings.length) {
        const t1 = [roundPairings[i][0], roundPairings[i][1]].sort((a,b) => a-b);
        const t2 = [roundPairings[i+1][0], roundPairings[i+1][1]].sort((a,b) => a-b);
        matches.push(`Round ${r}: ${allPairs[t1[0]].name}/${allPairs[t1[1]].name} vs ${allPairs[t2[0]].name}/${allPairs[t2[1]].name}`);
        pairingsUsed.add(t1.join('-'));
        pairingsUsed.add(t2.join('-'));
      } else {
        const t = [roundPairings[i][0], roundPairings[i][1]].sort((a,b) => a-b);
        sitouts.push(`Round ${r}: Pair ${allPairs[t[0]].name}/${allPairs[t[1]].name} sit together`);
        pairingsUsed.add(t.join('-'));
      }
    }

    const last = players.pop();
    players.splice(1, 0, last);
  }

  console.log(`--- Result for N=${N} ---`);
  console.log("Total Pairs Generated:", pairingsUsed.size);
  console.log("Expected Unique Pairs:", (N * (N - 1)) / 2);
  
  const bc = "1-2"; // B/C
  if (pairingsUsed.has(bc)) {
    console.log("Found B/C pairing!");
    // Find where it is
    const inMatch = matches.find(m => m.includes("B/C") || m.includes("C/B"));
    const inSitout = sitouts.find(s => s.includes("B/C") || s.includes("C/B"));
    if (inMatch) console.log("It's in a match:", inMatch);
    if (inSitout) console.log("It's in a sitout:", inSitout);
  } else {
    console.log("FAILURE: B/C pairing NOT FOUND");
  }
}

test(7);
