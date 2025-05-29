    document.getElementById('searchForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const query = document.getElementById('searchInput').value.trim().toLowerCase();
      const vectorField = document.getElementById('vectorField').value;
      
      const container = document.getElementById('resultsContainer');

      if (!query) {
        container.innerHTML = '<p>Please enter a search term.</p>';
        return;
      }

      container.innerHTML = '<p>Searching...</p>';

      try {
        const res = await fetch(`/search?q=${encodeURIComponent(query)}&vectorField=${encodeURIComponent(vectorField)}`)
        const data = await res.json();
        container.innerHTML = '';

        if (!data.results || data.results.length === 0) {
          container.innerHTML = '<p>No results found.</p>';
          return;
        } else {
          container.innerHTML = `<p>${data.totalHits} results found.</p>`;
        }
        container.innerHTML += `<p>Used vector field: <strong>${escapeHtml(vectorField)}</strong></p>`;

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
                  <a href="product.html?id=${item._id}&query=${encodeURIComponent(query)}&position=${index + 1}&score=${item._score}&totalHits=${data.totalHits}&vectorField=${encodeURIComponent(vectorField)}"
                    onclick="return trackClick(event, '${item._id}', '${source.id}', '${source.title_s.replace(/'/g, "\\'")}', ${index + 1}, '${query.replace(/'/g, "\\'")}', ${data.totalHits}, ${item._score}, '${vectorField.replace(/'/g, "\\\'")}')">
          			<img src="${imageUrl}" alt="${safeTitle}" style="width:100px" />
        		  </a>
                </td>
                <td>
                  <p>
                     <strong>Manufacturer:</strong> ${source.manufacturer_s} &nbsp; 
                     <strong>Category:</strong> ${source.baseCategory_s} &nbsp; 
                     <strong>Type:</strong> ${source.type_s}</p>
                  <h3>${source.title_s}</h3>
                  <details style="margin-top: 0.5em;">
                    <summary style="color: green; cursor: pointer;"><strong>${item._score} Why Match</strong></summary>
                    <div style="padding-left: 1em; font-size: 0.9em;">${formatExplanation(item._explanation) || "N/A"}</div>
                  </details>
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
    
    function formatExplanation(exp, indent = 0) {
      if (!exp) return '';

      let result = `${'&nbsp;'.repeat(indent * 4)}<strong>Score:</strong> ${exp.value.toFixed(4)} — ${escapeHtml(exp.description)}<br/>`;

      if (Array.isArray(exp.details) && exp.details.length > 0) {
        exp.details.forEach(detail => {
        result += formatExplanation(detail, indent + 1);
      });
    }

  return result;
}

    
    function trackClick(event, docId, productId, productName, position, query, totalHits, score, vectorField) {
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
        score,
        vectorField
      })
      }).catch(err => console.error('Tracking failed', err))
        .finally(() => {
          // Navigate after tracking (or error)
          window.location.href = url;
        });
            
      return false; // Prevent default link behavior
    }