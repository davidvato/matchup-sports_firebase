fetch('https://matchup-sports-firebase.onrender.com/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
})
.then(res => res.json())
.then(data => console.log('Login Response:', data))
.catch(err => console.error('Error:', err));
