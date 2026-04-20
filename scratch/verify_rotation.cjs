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
        sitouts.push(`Round ${r}: ${allPairs[realPlayer].name} sits`);
      }
    }

    for (let i = 0; i < roundPairings.length; i += 2) {
      if (i + 1 < roundPairings.length) {
        const team1 = [roundPairings[i][0], roundPairings[i][1]].sort();
        const team2 = [roundPairings[i+1][0], roundPairings[i+1][1]].sort();
        matches.push(`Round ${r}: ${allPairs[team1[0]].name}/${allPairs[team1[1]].name} vs ${allPairs[team2[0]].name}/${allPairs[team2[1]].name}`);
        pairingsUsed.add(team1.join('-'));
        pairingsUsed.add(team2.join('-'));
      } else {
        const team = [roundPairings[i][0], roundPairings[i][1]].sort();
        sitouts.push(`Round ${r}: Pair ${allPairs[team[0]].name}/${allPairs[team[1]].name} sits`);
        pairingsUsed.add(team.join('-'));
      }
    }

    const last = players.pop();
    players.splice(1, 0, last);
  }

  console.log("Matches:", matches);
  console.log("Sitouts:", sitouts);
  console.log("Unique Pairings Count:", pairingsUsed.size);
  console.log("Pairings:", Array.from(pairingsUsed));
}

test(5);
console.log("\n--- N=4 ---");
test(4);
