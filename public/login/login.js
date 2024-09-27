document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('isLoggedIn', true);
      window.location.href = "../index.html"; // Redirect to homepage on success
    } else {
      document.getElementById("errorMessage").textContent = data.message;
    }
  } catch (err) {
    document.getElementById("errorMessage").textContent = "An error occurred.";
  }
});
