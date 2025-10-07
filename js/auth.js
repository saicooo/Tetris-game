// Save username to localStorage
function storeUsername() {
    const username = document.getElementById('username').value;
    if (username.trim()) {
        localStorage.setItem('tetris.username', username.trim());
        return true;
    }
    return false;
}

// Read username from localStorage
function readUsername() {
    return localStorage.getItem('tetris.username') || '';
}

// Form submission handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    
    // Pre-fill last used username
    usernameInput.value = readUsername();
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (storeUsername()) {
            window.location.href = 'game.html';
        }
    });
});