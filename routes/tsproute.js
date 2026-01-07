const express = require('express');
const axios = require('axios');
const router = express.Router();

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjM0OWIxYjZkZWUyZjRiZjBiNTA2MzM1NmI3ZjViYmYwIiwiaCI6Im11cm11cjY0In0='; // replace this with your real key

// 🌍 Route to calculate optimized route
router.post('/optimize', async (req, res) => {
  const { places } = req.body;

  if (!places || places.length < 2) {
    return res.status(400).json({ error: 'At least two places are required.' });
  }

  try {
    // Step 1: Geocode each place to coordinates
    const coordinates = [];
    for (const place of places) {
      const geoUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(place)}`;
      const geoRes = await axios.get(geoUrl);
      const result = geoRes.data.features[0];
      if (result) {
        coordinates.push(result.geometry.coordinates); // [lon, lat]
      } else {
        return res.status(400).json({ error: `Could not find location: ${place}` });
      }
    }

    // Step 2: Build distance matrix
    const matrixUrl = `https://api.openrouteservice.org/v2/matrix/driving-car`;
    const matrixRes = await axios.post(matrixUrl, {
      locations: coordinates,
      metrics: ['distance']
    }, {
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const matrix = matrixRes.data.distances; // distances in meters
    const bestRoute = findShortestRoute(matrix, places);

    res.json(bestRoute);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error calculating route');
  }
});

// Simple TSP solver
function findShortestRoute(matrix, places) {
  const n = places.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  let bestOrder = [];
  let bestDist = Infinity;

  function permute(arr, l = 0) {
    if (l === arr.length - 1) {
      let dist = 0;
      for (let i = 0; i < arr.length - 1; i++) {
        dist += matrix[arr[i]][arr[i + 1]];
      }
      dist += matrix[arr[arr.length - 1]][arr[0]]; // return to start
      if (dist < bestDist) {
        bestDist = dist;
        bestOrder = arr.slice();
      }
    } else {
      for (let i = l; i < arr.length; i++) {
        [arr[l], arr[i]] = [arr[i], arr[l]];
        permute(arr, l + 1);
        [arr[l], arr[i]] = [arr[i], arr[l]];
      }
    }
  }

  permute(indices);
  const bestPlaces = bestOrder.map(i => places[i]);
  return { order: bestPlaces, totalDistanceKm: (bestDist / 1000).toFixed(2) };
}

module.exports = router;
