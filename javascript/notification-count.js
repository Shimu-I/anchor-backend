// Load notification count on page load
document.addEventListener('DOMContentLoaded', function() {
    loadNotificationCount();
    // Refresh count every 30 seconds
    setInterval(loadNotificationCount, 30000);

    // Show notification dropdown automatically after login (if logged in)
    if (window.localStorage.getItem('isLoggedIn') === 'true') {
        setTimeout(() => {
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown && !dropdown.classList.contains('active')) {
                dropdown.classList.add('active');
                loadNotificationDropdown();
            }
        }, 800); // slight delay to ensure header loads
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notificationDropdown');
        const bell = document.querySelector('.notification-bell');
        if (dropdown && !dropdown.contains(e.target) && !bell.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
});

async function loadNotificationCount() {
    try {
        const response = await fetch('api/api-get-notifications.php', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success && data.unread_count > 0) {
            const badge = document.getElementById('notificationCount');
            if (badge) {
                badge.textContent = data.unread_count > 99 ? '99+' : data.unread_count;
                badge.style.display = 'block';
            }
        } else {
            const badge = document.getElementById('notificationCount');
            if (badge) {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

async function toggleNotifications(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('notificationDropdown');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
    } else {
        dropdown.classList.add('active');
        await loadNotificationDropdown();
    }
}

async function loadNotificationDropdown() {
    const container = document.getElementById('notificationDropdownContent');
    
    try {
        const response = await fetch('api/api-get-notifications.php', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            displayDropdownNotifications(data.notifications);
        } else {
            container.innerHTML = '<div class="no-notifications"><i class="fas fa-exclamation-circle"></i><p>Failed to load notifications</p></div>';
        }
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="no-notifications"><i class="fas fa-exclamation-circle"></i><p>Failed to load notifications</p></div>';
    }
}

function displayDropdownNotifications(notifications) {
    const container = document.getElementById('notificationDropdownContent');

    if (!notifications || notifications.length === 0) {
        container.innerHTML = '<div class="no-notifications"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
        return;
    }

    // Show only latest 10 notifications in dropdown
    const recentNotifications = notifications.slice(0, 10);

    container.innerHTML = recentNotifications.map(notif => {
        const isUnread = notif.is_read == 0;
        const timeAgo = getTimeAgo(new Date(notif.created_at));

        // Determine icon and color based on type
        let iconClass = 'fa-bell';
        let iconColor = '#70C1BF';
        
        switch(notif.type) {
            case 'loan_accepted':
                iconClass = 'fa-check-circle';
                iconColor = '#28a745';
                break;
            case 'loan_offer':
                iconClass = 'fa-hand-holding-usd';
                iconColor = '#007bff';
                break;
            case 'contribution':
                iconClass = 'fa-heart';
                iconColor = '#dc3545';
                break;
            case 'approval':
                iconClass = 'fa-check-circle';
                iconColor = '#28a745';
                break;
            case 'rejection':
                iconClass = 'fa-times-circle';
                iconColor = '#dc3545';
                break;
        }

        return `
            <div class="notification-dropdown-item ${isUnread ? 'unread' : ''}" onclick="handleNotificationClick(${notif.notification_id}, '${notif.type}', ${notif.loan_id || 'null'})">
                <div class="notif-icon" style="background-color: ${iconColor}20;">
                    <i class="fas ${iconClass}" style="color: ${iconColor};"></i>
                </div>
                <div class="notif-content">
                    <h4 class="notif-title">${notif.title}</h4>
                    <p class="notif-message">${notif.message}</p>
                    <span class="notif-time">${timeAgo}</span>
                </div>
                ${isUnread ? '<div class="notif-unread-dot"></div>' : ''}
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm';
    
    return 'now';
}

async function handleNotificationClick(notificationId, type, loanId) {
    // Mark as read
    try {
        await fetch('api/api-mark-notification-read.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ notification_id: notificationId })
        });
        
        // Update UI
        loadNotificationCount();
        loadNotificationDropdown();
        
        // Navigate based on notification type
        if (type === 'loan_accepted' && loanId) {
            window.location.href = 'payment-gateway.html?loan_id=' + loanId;
        } else if (type === 'loan_offer' && loanId) {
            window.location.href = 'user-profile.html';
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}
