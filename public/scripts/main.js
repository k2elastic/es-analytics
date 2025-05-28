// public/scripts/main.js
console.log('Main JS loaded');

function escapeHtml(str) {
	return str
    	.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
