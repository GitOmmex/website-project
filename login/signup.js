document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");

  if (password !== confirmPassword) {
    errorMessage.textContent = "Passwords do not match.";
    successMessage.textContent = "";
    return;
  }

  // Send email and password to the server to initiate OTP
  try {
    const response = await fetch("http://localhost:3000/signup-initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      successMessage.textContent =
        "OTP sent to your email. Please check and enter it below.";
      errorMessage.textContent = "";
      document.getElementById("step1").style.display = "none";
      document.getElementById("step2").style.display = "block"; // Show the OTP field
    } else {
      errorMessage.textContent = data.message;
      successMessage.textContent = "";
    }
  } catch (err) {
    errorMessage.textContent = "An error occurred. Please try again.";
    successMessage.textContent = "";
  }
});

// Handle OTP verification
document
  .getElementById("verifyOtpButton")
  .addEventListener("click", async () => {
    const otp = document.getElementById("otp").value;
    const email = document.getElementById("email").value;

    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");

    try {
      const response = await fetch("http://localhost:3000/signup-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (data.success) {
        successMessage.textContent =
          "Sign up successful! Redirecting to login...";
        errorMessage.textContent = "";
        setTimeout(() => {
          window.location.href = "login.html"; // Redirect to login page after success
        }, 2000);
      } else {
        errorMessage.textContent = data.message;
        successMessage.textContent = "";
      }
    } catch (err) {
      errorMessage.textContent = "An error occurred. Please try again.";
      successMessage.textContent = "";
    }
  });
