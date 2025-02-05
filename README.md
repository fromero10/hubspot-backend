## Development server

Run `nodemon server.js` to locally run the project 
# Node

The node version used for this project to run smoothly was version v16.20.2

## Functionalities

This has several endpoint that connect to HubSpot API but also to a mock API to create contacts there.
The Create contact API connects to the mock API and returns a response.

The connection with HubSpot is slightly more complex. It reviews the incoming company and contact, reviews if the company exists (since they were hardcoded I only added verification for this), it creates a company if it doesn't exists but retrieves the company if it does. Then it creates the contact based on the information, and associates both. It also creates a deal and associates it to the created contact. 



