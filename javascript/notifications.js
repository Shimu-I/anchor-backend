// Notifications page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadNotifications();
});

async function loadNotifications() {
    try {
        const response = await fetch('api/api-get-notifications.php', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            displayNotifications(data.notifications);
        } else if (data.error === 'Not logged in') {
            window.location.href = 'login.html';
        } else {
            document.getElementById('notificationsContent').innerHTML = `
                <p style="text-align: center; padding: 40px; color: #dc3545;">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i><br>
                    ${data.error || 'Failed to load notifications'}
                </p>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('notificationsContent').innerHTML = `
            <p style="text-align: center; padding: 40px; color: #dc3545;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i><br>
                Failed to load notifications
            </p>
        `;
    }
}

function displayNotifications(notifications) {
    const container = document.getElementById('notificationsContent');

    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-bell-slash" style="font-size: 4rem; color: #e9ecef; margin-bottom: 1rem;"></i>
                <p style="color: #6c757d; font-size: 1.1rem;">No notifications yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map(notif => {
        const date = new Date(notif.created_at);
        const timeAgo = getTimeAgo(date);
        const isUnread = notif.is_read == 0;

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

        // Check if this is an accepted offer notification (for lenders)
        const showPaymentButton = notif.type === 'loan_accepted' && notif.title === 'Offer Accepted!';

        return `
            <div class="notification-card ${isUnread ? 'unread' : ''}" onclick="markAsRead(${notif.notification_id})">
                <div class="notification-icon" style="background-color: ${iconColor}20;">
                    <i class="fas ${iconClass}" style="color: ${iconColor};"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h3>${notif.title}</h3>
                        ${isUnread ? '<span class="unread-badge">New</span>' : ''}
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    <p class="notification-message">${notif.message}</p>
                    ${showPaymentButton ? `
                        <a href="payment-gateway.html?loan_id=${notif.loan_id}" class="btn-payment">
                            <i class="fas fa-credit-card"></i> Proceed to Payment
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'Just now';
}

async function markAsRead(notificationId) {
    try {
        await fetch('api/api-mark-notification-read.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ notification_id: notificationId })
        });
        
        // Reload notifications to update UI
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}
