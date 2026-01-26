// Get post ID from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');
const successParam = urlParams.get('success');
const donationAmount = urlParams.get('amount');
const transactionId = urlParams.get('txn');

// Load funding details when page loads
document.addEventListener('DOMContentLoaded', function () {
  if (!postId) {
    showError('No post ID provided');
    return;
  }
  loadFundingDetails(postId);

  // Show success notification if redirected from payment
  if (successParam === '1') {
    showSuccessNotification(donationAmount, transactionId);
    // Clean URL by removing success parameters
    window.history.replaceState({}, document.title, `funding-view.html?id=${postId}`);
  }
});

// Fetch and display funding details
async function loadFundingDetails(id) {
  try {
    const response = await fetch(`api/api-get-funding-details.php?id=${id}`);
    const data = await response.json();

    if (data.success && data.post) {
      displayFundingDetails(data.post);
    } else {
      showError(data.error || 'Failed to load funding details');
    }
  } catch (error) {
    console.error('Error loading funding details:', error);
    showError('Error loading funding details. Please try again later.');
  }
}

// Display the funding details
function displayFundingDetails(post) {
  const container = document.getElementById('fundingContent');

  // Get data from the correct fields
  const actionPlanSteps = post.action_plan_steps || [];
  const purposes = post.purposes || [];
  const breakdown = post.breakdown || [];

  const html = `
    <div class="page-title">View Funding Information</div>

    <div class="meta-row" style="justify-content: flex-start;">
      <span class="tag">${post.display_category}</span>
      <span class="date">Posted on ${post.created_at_formatted}</span>
    </div>

    <div class="main-row">
      <div class="left-col">
        <div class="heading">${post.title}</div>

        <p class="description">
          ${post.summary}
        </p>

        <div class="progress-section">
          <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${post.progress_percentage}">
            <div class="progress-fill" style="width: ${post.progress_percentage}%;"></div>
          </div>
          <div class="progress-amounts">
            <span>৳${parseFloat(post.amount_raised).toLocaleString('en-BD', { minimumFractionDigits: 0 })}</span>
            <span>৳${parseFloat(post.amount_needed).toLocaleString('en-BD', { minimumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div class="creator-info" style="margin-top: 20px; padding: 15px; background: rgba(0, 191, 165, 0.1); border-radius: 8px;">
          <h4 style="margin: 0 0 10px 0; color: #00bfa5;">Fundraiser Creator</h4>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${post.full_name}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${post.location || 'Not specified'}</p>
          ${post.num_people ? `<p style="margin: 5px 0;"><strong>People Affected:</strong> ${post.num_people}</p>` : ''}
          ${post.age_group ? `<p style="margin: 5px 0;"><strong>Age Group:</strong> ${post.age_group}</p>` : ''}
        </div>

      </div>

      <div class="right-visual">
        <div class="photo" style="background-image: url('${post.cover_image}');" role="img" aria-label="${post.title}"></div>
        ${post.documents.other.length > 1 ? `
          <div class="additional-images" style="margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px;">
            ${post.documents.other.slice(1, 5).map(img => `
              <img src="${img}" alt="Additional image" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer;" onclick="window.open('${img}', '_blank')">
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>

    ${actionPlanSteps.length > 0 ? `
      <div class="plan">
        <div class="section-title" style="text-align:left;">Action Plan</div>
        <ol class="response-list">
          ${actionPlanSteps.map(item => `<li>${item}</li>`).join('')}
        </ol>
      </div>
    ` : ''}

    ${purposes.length > 0 || breakdown.length > 0 ? `
      <div class="section-title" style="text-align: left; margin-top: 24px;">
        How Your Money Will Be Used
      </div>

      <div class="usage-and-cost" style="display: flex; gap: 40px; margin-top: 16px;">
        ${purposes.length > 0 ? `
          <div class="purpose" style="flex: 1;">
            <h4 style="color: #00bfa5; margin-bottom: 12px;">Purpose of Funding</h4>
            <ol style="margin-left: 20px;">
              ${purposes.map(item => `<li style="margin-bottom: 8px;">${item}</li>`).join('')}
            </ol>
          </div>
        ` : ''}

        ${breakdown.length > 0 ? `
          <div class="cost-breakdown" style="flex: 1;">
            <h4 style="color: #00bfa5; margin-bottom: 12px;">Cost Breakdown</h4>
            <ul style="list-style: none; padding: 0;">
              ${breakdown.map(item => {
    const match = item.match(/(.*?):\s*৳?([\d,]+)/);
    if (match) {
      return `<li style="display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span>${match[1]}</span>
                    <strong style="color: #00bfa5;">৳${match[2]}</strong>
                  </li>`;
    }
    return `<li style="margin-bottom: 8px;">${item}</li>`;
  }).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${post.share_receipts === 'yes' ? `
      <div style="margin-top: 20px; padding: 16px; background: rgba(0, 191, 165, 0.08); border-radius: 8px; border-left: 3px solid #00bfa5;">
        <p style="margin: 0; font-size: 14px; color: #b8e6e0;"><strong style="color: #00bfa5;">Transparency Commitment:</strong> This fundraiser has committed to sharing receipts and updates on how funds are used.</p>
      </div>
    ` : ''}

    ${post.extra_funds_handling ? `
      <div style="margin-top: 12px; padding: 16px; background: rgba(255, 255, 255, 0.03); border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #b8e6e0;"><strong style="color: #80deea;">Extra Funds Policy:</strong> ${post.extra_funds_handling}</p>
      </div>
    ` : ''}

    <div class="donate-section" style="margin-top: 30px; padding: 20px; background: rgba(0, 191, 165, 0.15); border-radius: 8px; text-align: center;">
      <h3 style="color: #00bfa5; margin-bottom: 10px;">Support This Cause</h3>
      <p style="margin-bottom: 20px; opacity: 0.9;">Your donation can make a real difference. Every contribution helps us reach our goal.</p>
      <button onclick="openPaymentModal('${post.post_id}', '${post.title.replace(/'/g, "\\'")}', '${post.display_category}', '${post.amount_needed}', '${post.progress_percentage}', '${post.amount_raised}', '${post.full_name}', '${post.location || ''}')" class="donate-btn" style="background: #00bfa5; color: white; padding: 12px 40px; border-radius: 25px; border: none; cursor: pointer; font-weight: 600; font-size: 15px; transition: 0.3s;">
        Donate Now
      </button>
    </div>
  `;

  container.innerHTML = html;
}

// Show error message
function showError(message) {
  const container = document.getElementById('fundingContent');
  container.innerHTML = `
    <div class="error-state" style="text-align: center; padding: 60px 20px; color: #fff;">
      <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 20px; color: #ff6b6b;"></i>
      <p style="font-size: 18px; margin-bottom: 10px;">Error</p>
      <p style="opacity: 0.8;">${message}</p>
      <a href="funding.html" style="display: inline-block; margin-top: 20px; padding: 10px 30px; background: #00bfa5; color: white; text-decoration: none; border-radius: 25px; font-weight: 600;">
        Back to Fundraisers
      </a>
    </div>
  `;
}

// Show success notification toast
function showSuccessNotification(amount, txnId) {
  const notification = document.createElement('div');
  notification.className = 'success-toast';
  notification.innerHTML = `
    <div class="toast-icon">
      <i class="fas fa-check-circle"></i>
    </div>
    <div class="toast-content">
      <h4>Donation Successful!</h4>
      <p>Thank you for your generous donation of ৳${parseFloat(amount).toFixed(2)}. Your support makes a difference!</p>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  document.body.appendChild(notification);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }
  }, 3000);
}
