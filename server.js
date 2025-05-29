const express = require('express');
const { Client } = require('@elastic/elasticsearch');
require("dotenv").config();

const app = express();
const port = 3000;

// Middleware to parse JSON bodies - must be BEFORE routes that use req.body
app.use(express.json());

// added for UI
app.use(express.static('public'));
const path = require('path');
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the "public" folder
// end UI add

// Connect to main search Elasticsearch
//const searchClient = new Client({ node: 'http://localhost:9200' }); // Main search
const searchClient = new Client({
  node: process.env.ES_NODE, // search node
  auth: {
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD
  }
});

// Connect to analytics Elasticsearch
//const analyticsClient = new Client({ node: 'http://localhost:9201' }); // Analytics
const analyticsClient = new Client({
  node: process.env.ES_ANALYTICS, // analytics node
  auth: {
    apiKey: process.env.ES_API_KEY
  }
});

// Middleware to simulate authentication (for demo purposes)
app.use((req, res, next) => {
  req.user = { id: 'user123' }; // Hardcoded user
  next();
});

app.get('/search', async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const userId = req.user?.id || 'anonymous';
  
  const allowedFields = ['vector_elser2', 'vector_e5small', 'vector_source_s'];
  const vectorField = allowedFields.includes(req.query.vectorField)
  ? req.query.vectorField
  : 'vector_elser2';

  try {
    // Search the main ES
    const searchResponse = await searchClient.search({
      index: 'search-bf-nhs',
      explain: true,
      query: {
        match: { [vectorField]: query }
      },
      _source: ['id', 'baseCategory_s', 'series_s', 'type_s', 'finish_s', 'manufacturer_s', 'title_s', 'imageUrl_s'], // 👈 Only return these fields
      track_total_hits: true, // 👈 This removes the 10,000 limit
      min_score: 1.0
    });

    const results = searchResponse.hits.hits;
    const totalHits = searchResponse.hits.total.value;

    // Track the search query
    trackUserAction('search_query', userId, {
      vectorField, 
      query,
      totalHits: totalHits
    }).catch(console.error);

    // Track each product in the result list
    results.forEach((result, index) => {
      const productId = result._source.id;
      const productName = result._source.title_s;
      const score = result._score;

      trackUserAction('product_list', userId, {
        vectorField,
        query,
        totalHits, 
        productId,
        productName,
        position: index + 1, // 1-based index
        score
      }).catch(console.error);
    });

    res.json({ results, totalHits });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Add Product route
app.get('/product', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing product ID' });

  try {
    const response = await searchClient.get({
      index: 'search-bf-nhs',
      id: id
    });

    res.json({ product: response });
  } catch (err) {
    console.error('Product lookup error:', err.meta?.body?.error || err);
    res.status(404).json({ error: 'Product not found' });
  }
});

app.post('/click', async (req, res) => {
  const userId = req.user?.id || 'anonymous';
  const { docId, productId, productName, position, query, totalHits, score, vectorField } = req.body;

  try {
    await trackUserAction('product_click', userId, {
      docId,         // Elasticsearch document ID
      productId,     // Internal product ID
      productName,
      position,
      query,
      totalHits,
      score,
      vectorField
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Click tracking failed:', err.meta?.body?.error || err);
    res.status(500).json({ error: 'Tracking failed' });
  }
});

// Add to Cart endpoint
app.post('/cart', async (req, res) => {
  //console.log('Cart request body:', req.body);
  const userId = req.user?.id || 'anonymous';
  const { docId, productId, productName, position, query, totalHits, score, vectorField } = req.body;

  if (!productId || !productName) {
    return res.status(400).json({ error: 'Missing product information' });
  }

  try {
    await trackUserAction('add_to_cart', userId, {
      docId,         // Elasticsearch document ID
      productId,     // Internal product ID
      productName,
      position,
      query,
      totalHits,
      score,
      vectorField
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Add to cart tracking failed:', err.meta?.body?.error || err);
    res.status(500).json({ error: 'Tracking failed' });
  }
});


// Track user action in analytics ES
async function trackUserAction(actionType, userId, details) {
  await analyticsClient.index({
    index: 'search-sessions',
    body: {
      timestamp: new Date().toISOString(),
      userId,
      actionType,
      ...details
    }
  });
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
