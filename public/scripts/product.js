// public/scripts/product.js
async function getProduct() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const container = document.getElementById('productContainer');
    // added to pass query and position forward from search page
    const query = params.get('query');
    const position = parseInt(params.get('position'), 10);
    const totalHits = parseInt(params.get('totalHits'), 10);
    const score = parseFloat(params.get('score'));
    const vectorField = params.get('vectorField');

    if (!productId) {
    	container.innerText = 'No product ID specified.';
    return;
    }

    try {
    	const res = await fetch(`/product?id=${encodeURIComponent(productId)}`);
        const data = await res.json();

        if (!data.product) {
          container.innerText = 'Product not found.';
          return;
        }

        const item = data.product._source;
        
        const imageUrl = item.imageUrl_s && item.imageUrl_s.trim() !== ""
          ? item.imageUrl_s
          : './img/default-image.jpg'; // Replace with your actual default image path
          
        const safeTitle = escapeHtml(item.title_s || '');

        container.innerHTML = `
          <img src="${imageUrl}" alt="${safeTitle}" style="width:150px;" />
          <h2>${item.title_s}</h2>
          <p><strong>Manufacturer:</strong> ${item.manufacturer_s}</p>
          <p><strong>Type:</strong> ${item.type_s}</p>
          <p><strong>Series:</strong> ${item.series_s}</p>
          <p><strong>Finish:</strong> ${item.finish_s}</p>
          <button id="addToCartBtn">Add to Cart</button>
        `;

        // Add event listener for Add to Cart button
        document.getElementById('addToCartBtn').addEventListener('click', async () => {
          try {
            const response = await fetch('/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                docId: data.product._id,
                productId: item.id,
                productName: item.title_s,
                query,
                position,
                totalHits,
                score,
                vectorField
              })
            });

            const result = await response.json();

            if (result.success) {
              alert('Product added to cart!');
            } else {
              alert('Failed to add to cart.');
            }
          } catch (err) {
            console.error('Error adding to cart:', err);
            alert('An error occurred while adding to cart.');
          }
        });

      } catch (err) {
        console.error(err);
        container.innerText = 'Error loading product details.';
      }
    }

    getProduct();