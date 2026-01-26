// Notifications overlay functionality
let notificationsData = [];

async function loadNotifications() {
  try {
    const response = await fetch('api/api-get-notifications.php');
    const data = await response.json();

    if (data.success) {
      notificationsData = data.notifications;
      return data.notifications;
    } else {
      console.error('Error loading notifications:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

function createNotificationHTML(notifications) {
  if (!notifications || notifications.length === 0) {
    return '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 40px;">No notifications yet</p>';
  }

  return notifications.map(notif => {
    const date = new Date(notif.created_at).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="notification-box ${notif.is_read ? '' : 'unread'}">
        <div class="user-info">
          <div class="user-details">
            <p class="username">${notif.sender_name || 'System'}</p>
            <p class="status">${notif.title || notif.type}</p>
            <p class="notif-date">${date}</p>
          </div>
        </div>
        <p class="message">${notif.message}</p>
      </div>
    `;
  }).join('');
}

async function initNotificationOverlay() {
  // Create overlay structure
  const overlayHTML = `
    <div id="notificationOverlay" class="notification-overlay" style="display: none;">
      <div class="frame">
        <button class="close-overlay" id="closeNotificationOverlay">
          <i class="fas fa-times"></i>
        </button>
        <h1 class="title">Notifications</h1>
        <div id="notificationsList">
          <p style="text-align: center; padding: 40px;">Loading...</p>
        </div>
      </div>
    </div>
  `;

  // Insert overlay into body
  document.body.insertAdjacentHTML('beforeend', overlayHTML);

  const notificationBtn = document.querySelector('.btn-notifications');
  const overlay = document.getElementById('notificationOverlay');
  const closeBtn = document.getElementById('closeNotificationOverlay');
  const notificationsList = document.getElementById('notificationsList');

  // Open overlay when notification button is clicked
  if (notificationBtn) {
    notificationBtn.addEventListener('click', async function (e) {
      e.preventDefault();
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // Load and display notifications
      const notifications = await loadNotifications();
      notificationsList.innerHTML = createNotificationHTML(notifications);

      // Add fade-in animation
      setTimeout(() => {
        overlay.classList.add('active');
      }, 10);
    });
  }

  // Close overlay function
  function closeOverlay() {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  }

  // Close when X button is clicked
  if (closeBtn) {
    closeBtn.addEventListener('click', closeOverlay);
  }

  // Close when clicking outside the frame
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) {
      closeOverlay();
    }
  });

  // Close with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.style.display === 'flex') {
      closeOverlay();
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificationOverlay);
} else {
  initNotificationOverlay();
}