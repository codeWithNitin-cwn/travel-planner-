document.getElementById('optimize').addEventListener('click', async () => {
  const places = document.getElementById('places').value.split(',').map(p => p.trim());
  if (places.length < 2) return alert('Enter at least two places.');

  const response = await fetch('/api/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ places })
  });

  const data = await response.json();

  const list = document.getElementById('routeList');
  list.innerHTML = '';
  data.order.forEach((place, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${place}`;
    list.appendChild(li);
  });

  document.getElementById('distance').textContent = `Total distance: ${data.totalDistanceKm} km`;
});
