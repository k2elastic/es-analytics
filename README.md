# es-analytics

  
1. Clone this project to a local development directory
2. Change directory into the cloned project, e.g. cd ~/Development/es-analytics
3. Create your .env file
```
ES_NODE=https://diy.es.us-west1.gcp.cloud.es.io
ES_USERNAME=diy-user
ES_PASSWORD=<password> 
ES_ANALYTICS=https://diy-analytics-e12e01.es.us-central1.gcp.elastic.cloud:443
ES_API_KEY=<api-key>
``` 
3. Install the following dependencies:
  a. npm install express
  b. npm install dotenv
4. Run: node server.js
5. Open your browser and go to: http://localhost:3000/search.html

