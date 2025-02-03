const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000; // You can change this if needed

app.use(cors({ origin: 'http://localhost:4200' }));

app.use(cors());

// Setup the proxy route for HubSpot API
app.get('/hubspot/contacts', async (req, res) => {
    console.log("Entró")
  try {
    const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
      headers: {
        'Authorization': `Bearer pat-na1-5792e09d-3ff1-4efc-9659-1ee00e71b1cf`
      }
    });
    console.log(response)
    res.json(response.data); // Return HubSpot API response
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the backend server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
