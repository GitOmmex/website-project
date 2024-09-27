document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
  
    // Check if user is logged in (for demo purposes, we use localStorage)
    const isLoggedIn = localStorage.getItem('isLoggedIn');
  
    if (isLoggedIn) {
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
    } else {
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
    }
  
     // Handle Login button click (for demo purposes)
    loginBtn.addEventListener('click', () => {
      // For demo purposes, we simulate a login
      //localStorage.setItem('isLoggedIn', true);
      window.open('login/login.html', '_self'); // Reload the page to reflect changes
    }); 
  
    // Handle Logout button click
    logoutBtn.addEventListener('click', () => {
      // For demo purposes, we simulate a logout
      localStorage.removeItem('isLoggedIn');
      window.location.reload(); // Reload the page to reflect changes
    });
  });
  