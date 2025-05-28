    document.getElementById('searchForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const query = document.getElementById('searchInput').value.trim();
      const container = document.getElementById('resultsContainer');

      if (!query) {
        container.innerHTML = '<p>Please enter a search term.</p>';
        return;
      }

      container.innerHTML = '<p>Searching...</p>';

      try {
        const res = await fetch(`/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        container.innerHTML = '';

        if (!data.results || data.results.length === 0) {
          container.innerHTML = '<p>No results found.</p>';
          return;
        } else {
          container.innerHTML = `<p>${data.totalHits} results found.</p>`;
        }

        data.results.forEach((item, index) => {
          const source = item._source;
          const imageUrl = source.imageUrl_s && source.imageUrl_s.trim() !== "" 
            ? source.imageUrl_s 
            : './img/default-image.jpg';
            
          const safeTitle = escapeHtml(source.title_s || '');
          
          const div = document.createElement('div');
          div.className = 'result-item';
          div.innerHTML = `
            <table>
              <tr>
                <td>
                  <a href="product.html?id=${item._id}&query=${encodeURIComponent(query)}&position=${index + 1}&score=${item._score}&totalHits=${data.totalHits}"
           			onclick="return trackClick(event, '${item._id}', '${source.id}', '${source.title_s.replace(/'/g, "\\'")}', ${index + 1}, '${query.replace(/'/g, "\\'")}', ${data.totalHits}, ${item._score})">
          			<img src="${imageUrl}" alt="${safeTitle}" style="width:100px" />
        		  </a>
                </td>
                <td>
                  <p>
                     <strong>Manufacturer:</strong> ${source.manufacturer_s} &nbsp; 
                     <strong>Category:</strong> ${source.baseCategory_s} &nbsp; 
                     <strong>Type:</strong> ${source.type_s}</p>
                  <h3>${source.title_s}</h3>
                  <font color="green"><strong>${item._score} Why Match:</strong> ${item._explanation?.description || "N/A"}</font>
                </td>
              </tr>
            </tr>
          </table>             
          `;
          container.appendChild(div);
        });
      } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Error loading results.</p>';
      }
    });
    
    function trackClick(event, docId, productId, productName, position, query, totalHits, score) {
      event.preventDefault(); // Stop the default navigation
      
      const url = event.currentTarget.href; // Get target URL
      
      fetch('/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        docId,
        productId,
        productName,
        position,
        query,
        totalHits,
        score
      })
      }).catch(err => console.error('Tracking failed', err))
        .finally(() => {
          // Navigate after tracking (or error)
          window.location.href = url;
        });
            
      return false; // Prevent default link behavior
    }