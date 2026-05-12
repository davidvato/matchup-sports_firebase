fetch('https://matchup-sports-firebase.onrender.com/api/tournaments')
.then(res => res.json())
.then(data => console.log('Tournaments Response:', data))
.catch(err => console.error('Error:', err));
