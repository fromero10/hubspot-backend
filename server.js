const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000; // You can change this if needed

app.use(cors({ origin: 'http://localhost:4200' }));

app.use(cors());
app.use(express.json());
const HUBSPOT_API_URL = 'https://api.hubapi.com';
const HUBSPOT_API_KEY = 'pat-na1-5792e09d-3ff1-4efc-9659-1ee00e71b1cf'
// Setup the proxy route for HubSpot API
app.get('/hubspot/contacts', async (req, res) => {
    console.log("Entró")
    try {
        const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`
            }
        });
        console.log(response)
        res.json(response.data); // Return HubSpot API response
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/add-contact-to-db', async (req, res) => {
    let contact = req.body;
    try {
        const response = await axios.post('https://api.hubapi.com/crm/v3/objects/contacts',contact, {
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`
            }
        });
        console.log(response)
        res.json({response:response.data, success:true}); // Return HubSpot API response
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
});

app.post('/api/add-contact-to-external-db', async (req, res) => {
    let contact = req.body;
    try {
        const response = await axios.post('https://sa-tech-assessment.replit.app/api/assessment/contacts',contact);
        console.log(response)
        res.json({response:response.data, success:true}); // Return HubSpot API response
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
});


app.post('/hubspot/create-contact', async (req, res) => {
    console.log(req.body);
    let { contact, company } = req.body;

    if (!contact || !company) {
        return res.status(400).json({ message: 'Contact and company information are required.' });
    }

    try {
        // Step 1: Check if the company already exists by name
        const companyResponse = await axios.post(`${HUBSPOT_API_URL}/crm/v3/objects/companies/search`, {
            "filterGroups": [
              {
                "filters": [
                  {
                    "propertyName": "name",
                    "operator": "EQ",
                    "value": company.name
                  }
                ]
              }
            ]
          },{
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`
            }
        });
        console.log("Se buscó compañía");
        console.log(companyResponse.data)
        let companyId;

        if (companyResponse.data.results.length > 0) {
            // If company exists, get the ID of the first matching company
            companyId = companyResponse.data.results[0].id;
        } else {
            // If company doesn't exist, create the company
            const createCompanyResponse = await axios.post(`${HUBSPOT_API_URL}/companies/v2/companies`, {
                properties: [
                    {
                        name: 'name',
                        value: company.name,
                    },
                    {
                        name: 'domain',
                        value: company.industry,
                    },
                    {
                        name: 'hs_logo_url',
                        value: company.logo,
                    },
                    {
                        name: 'internal_id',
                        value: company.id,
                    },
                    {
                        name: 'description',
                        value: company.description,
                    },
                    
                ],
            }, {
                headers: {
                    'Authorization': `Bearer ${HUBSPOT_API_KEY}`
                }
            });
            companyId = createCompanyResponse.data.companyId;
        }
        const contactSearchResponse = await axios.post(`${HUBSPOT_API_URL}/crm/v3/objects/contacts/search`, {
            "filterGroups": [
              {
                "filters": [
                  {
                    "propertyName": "email",
                    "operator": "EQ",
                    "value": contact.properties.email
                  }
                ]
              }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`
            }
        });
        let contactId;

        if (contactSearchResponse.data.results.length > 0) {
            // If the contact exists, use the existing contact ID
            console.log("Se encontró contacto");
            contactId = contactSearchResponse.data.results[0].id;
        } else{
            // Step 2: Create the contact
            const createContactResponse = await axios.post(`${HUBSPOT_API_URL}/contacts/v1/contact`, {
                properties: [
                    { property: 'email', value: contact.properties.email },
                    { property: 'firstname', value: contact.properties.firstname },
                    { property: 'lastname', value: contact.properties.lastname },
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${HUBSPOT_API_KEY}`
                }
            });
            contactId = createContactResponse.data.vid;
            console.log("Se creó contacto");
        }

        // Step 3: Associate the contact with the company
        await axios.put(`${HUBSPOT_API_URL}/crm/v4/objects/company/${companyId}/associations/default/contact/${contactId}`,{}, {
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`
            }
        });
        // Step 4: Create a deal associated with the contact
        const createDealResponse = await axios.post(`${HUBSPOT_API_URL}/deals/v1/deal`, {
            properties: [
                {
                    name: 'dealname',
                    value: `Deal for ${contact.properties.firstname} ${contact.properties.lastname}`,
                },
                {
                    name: 'amount',
                    value: '0', // Or another field based on your logic
                },
                {
                    name: 'dealstage',
                    value: 'appointmentscheduled', // Or another field based on your logic
                },
                {
                    name: 'pipeline',
                    value: 'default', // Or another field based on your logic
                }
            ],
        }, {
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`
            }
        });
        const dealId = createDealResponse.data.dealId;

        // Step 5: Associate the deal with the contact
        await axios.put(`${HUBSPOT_API_URL}/crm/v4/objects/deal/${dealId}/associations/default/contact/${contactId}`, {}, {
            headers: {
                'Authorization': `Bearer ${HUBSPOT_API_KEY}`
            }
        });
        res.status(200).json({ message: 'Contact, company, and deal created successfully!', success: true });
    } catch (error) {
        console.error('Error creating contact, company, or deal:', error.response?.data || error.message);
        res.status(500).json({ message: 'Something went wrong. Please try again later.', success:false });
    }
});

// Start the backend server
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
