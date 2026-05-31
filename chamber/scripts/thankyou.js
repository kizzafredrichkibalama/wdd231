// thankyou.js - Display submitted form data

function displayFormData() {
  // Get query parameters from URL
  const params = new URLSearchParams(window.location.search);
  
  // Map of param names to display element IDs
  const fieldMap = {
    'firstname': 'detail-firstname',
    'lastname': 'detail-lastname',
    'email': 'detail-email',
    'phone': 'detail-phone',
    'businessname': 'detail-businessname',
    'membershiplevel': 'detail-membershiplevel',
    'timestamp': 'detail-timestamp'
  };
  
  // Membership level labels
  const levelLabels = {
    'np': 'NP Membership (Non-Profit)',
    'bronze': 'Bronze Membership',
    'silver': 'Silver Membership',
    'gold': 'Gold Membership'
  };
  
  // Populate each field
  for (const [paramName, elementId] of Object.entries(fieldMap)) {
    const value = params.get(paramName);
    const element = document.getElementById(elementId);
    
    if (element && value) {
      // Special formatting for membership level
      if (paramName === 'membershiplevel') {
        element.textContent = levelLabels[value] || value;
      } else {
        element.textContent = decodeURIComponent(value);
      }
    }
  }
  
  console.log('Form data displayed');
}

// Run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayFormData);
} else {
  displayFormData();
}
