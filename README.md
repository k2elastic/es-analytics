# Getting Started: es-analytics 
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
For the password and api-key, email: kristin.kraus@elastic.co

3. Install the following dependencies:
- npm install express
- npm install dotenv
4. Run: node server.js
5. Open your browser and go to: http://localhost:3000/search.html

# Overview
This project uses a read-only searchable index (ES_NODE) which is a hosted elasticsearch instance of hardware store data. This data has been indexed with two semantic text fields:
1. **vector_elser2** based on the ELSER model
2. **vector_e5small** based on the E5 small multilingual model

### server.js
By default, the server.js file uses a very simple query structure
```
// Search the main ES
const searchResponse = await searchClient.search({
  index: 'search-bf-nhs',
  explain: true, // 👈 This provides the "why match" functionality, but not very useful for semantic nested documents (I'm working on this)
  query: {
    match: { vector_elser2: query } // 👈 super simple query looking in a single semantic_text field, vector_elser2 can be replaced with vector_e5small to use the other model
  },
  _source: ['id', 'baseCategory_s', 'series_s', 'type_s', 'finish_s', 'manufacturer_s', 'title_s', 'imageUrl_s'], // 👈 Only return these fields
  track_total_hits: true, // 👈 This removes the 10,000 limit
  min_score: 1.0 // 👈 This limit the result set as semantic searches will try to match everything
});
```
![image](https://github.com/user-attachments/assets/7c9a5102-c211-4f90-8929-bd60b0dac678)

### search.html & product.html
As you search and click on products, those actions are sent (in real-time) to a serverless elasticsearch instance as user events:
* search_query
* product_list (with position)
* product_click
* add_to_cart

These events can then be analyzed and visualized to observe the consumer journey. Eventually, as query syntax and models are experimented with, a series of user interactions can be replayed and measure to see if the changes have improved the consumer journey.

![image](https://github.com/user-attachments/assets/2efe35dd-000c-42f5-a487-630e27d51165)
