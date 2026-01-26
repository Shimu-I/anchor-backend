// Global posts data
let allPosts = [];
let currentFilter = 'all';
let currentSort = 'recent';

// Category to filter mapping
const categoryFilterMap = {
  'Education': 'education',
  'Medical': 'medical',
  'Emergency': 'emergency',
  'Community': 'community',
  'Flood Relief': 'emergency',
  'Clothes Distribution': 'community',
  'Accidents': 'emergency',
  'Mobile Clinic': 'medical',
  'Clean Water': 'community'
};

// Load posts from database
async function loadPosts() {
  try {
    const response = await fetch('api-get-approved-funding.php');
    const data = await response.json();

    if (data.success && data.posts) {
      allPosts = data.posts;
      displayPosts(allPosts);
    } else {
      console.error('Failed to load posts:', data.error);
      document.getElementById('postsGrid').innerHTML = '<p style="color: #fff; text-align: center; padding: 40px;">No fundraising campaigns available at the moment.</p>';
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    document.getElementById('postsGrid').innerHTML = '<p style="color: #fff; text-align: center; padding: 40px;">Error loading campaigns. Please try again later.</p>';
  }
}

// Display posts
function displayPosts(posts) {
  const container = document.getElementById('postsGrid');

  if (posts.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open" style="font-size: 48px; margin-bottom: 16px; color: #00bfa5;"></i><p style="font-size: 18px; margin-bottom: 8px;">No campaigns found</p><p style="font-size: 14px; opacity: 0.7;">Try adjusting your search or filter criteria.</p></div>';
    return;
  }

  container.innerHTML = posts.map(post => {
    const category = post.display_category || post.custom_category || post.category;
    const filterType = categoryFilterMap[category] || 'all';

    return `
      <div class="card" data-filter="${filterType}">
        <img src="${post.cover_image}" alt="${post.title}" onerror="this.src='images/default-fundraiser.jpg'">
        <div class="card-content">
          <div class="tag-date-row">
            <span class="tag">${category}</span>
            <span class="date">Posted on ${post.created_at_formatted}</span>
          </div>
          <h3>${post.title}</h3>
          <p>${post.summary}</p>
          <div class="progress-container">
            <div class="goal-amount">৳${parseFloat(post.amount_needed).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div class="progress">
              <div class="progress-fill" style="width: ${post.progress_percentage}%;"></div>
            </div>
            <div class="raised-amount">৳${parseFloat(post.amount_raised).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          </div>
          <div class="actions">
            <a href="#" class="donate-btn" 
               data-post-id="${post.post_id}" 
               data-title="${post.title.replace(/"/g, '&quot;')}" 
               data-category="${category}" 
               data-amount="${post.amount_needed}"
               data-progress="${post.progress_percentage}"
               data-raised="${post.amount_raised}"
               data-organizer="${post.full_name || post.username}"
               data-location="${post.location || ''}">Donate</a>
            <a href="funding-view.html?id=${post.post_id}" class="view-btn">View</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Re-attach donate button listeners
  attachDonateListeners();
}

// Filter posts
function filterPosts(filterType) {
  currentFilter = filterType;
  applyFilterAndSort();
}

// Sort posts
function sortPosts(sortType) {
  currentSort = sortType;
  applyFilterAndSort();
}

// Apply both filter and sort
function applyFilterAndSort() {
  let filtered = currentFilter === 'all' ? [...allPosts] : allPosts.filter(post => {
    const category = post.display_category || post.custom_category || post.category;
    return categoryFilterMap[category] === currentFilter;
  });

  // Sort filtered results
  switch (currentSort) {
    case 'recent':
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'oldest':
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case 'amount-high':
      filtered.sort((a, b) => parseFloat(b.amount_needed) - parseFloat(a.amount_needed));
      break;
    case 'amount-low':
      filtered.sort((a, b) => parseFloat(a.amount_needed) - parseFloat(b.amount_needed));
      break;
  }

  displayPosts(filtered);
}

// Search posts
function searchPosts(searchTerm) {
  const term = searchTerm.toLowerCase();
  const filtered = allPosts.filter(post => {
    return post.title.toLowerCase().includes(term) ||
      post.summary.toLowerCase().includes(term);
  });
  displayPosts(filtered);
}

// Attach donate button listeners
function attachDonateListeners() {
  document.querySelectorAll('.donate-btn').forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const postId = this.getAttribute('data-post-id');
      const title = this.getAttribute('data-title');
      const category = this.getAttribute('data-category');
      const amount = this.getAttribute('data-amount');
      const progress = this.getAttribute('data-progress');
      const raised = this.getAttribute('data-raised');
      const organizer = this.getAttribute('data-organizer');
      const location = this.getAttribute('data-location');

      // Open payment modal directly (skip donation amount dialog)
      openPaymentModal(postId, title, category, amount, progress, raised, organizer, location);
    });
  });
}

// Show payment overlay
function showPaymentOverlay(amount) {
  const overlay = document.getElementById('paymentOverlay');

  if (overlay) {
    const amountInput = overlay.querySelector('#amount');
    const payAmountSpan = overlay.querySelector('#payAmount');

    if (amountInput) amountInput.value = amount;
    if (payAmountSpan) payAmountSpan.textContent = amount;

    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  // Load posts from database
  loadPosts();

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      filterPosts(filter);
    });
  });

  // Sort dropdown
  document.getElementById('sortSelect').addEventListener('change', e => {
    sortPosts(e.target.value);
  });

  // Search input
  document.getElementById('searchInput').addEventListener('input', e => {
    searchPosts(e.target.value);
  });

  // Check for success notification
  const urlParams = new URLSearchParams(window.location.search);
  const successParam = urlParams.get('success');
  const donationAmount = urlParams.get('amount');
  const transactionId = urlParams.get('txn');

  if (successParam === '1') {
    showSuccessNotification(donationAmount, transactionId);
    // Clean URL by removing success parameters
    window.history.replaceState({}, document.title, 'funding.html');
  }
});

// Show success notification toast
function showSuccessNotification(amount, txnId) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `
    <i class="fas fa-check-circle toast-icon"></i>
    <div class="toast-content">
      <h4>Donation Successful!</h4>
      <p>Thank you for your generous donation of ৳${parseFloat(amount).toFixed(2)}! Your support makes a difference.</p>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
