document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const otpField = document.getElementById("otp"); // OTP field reference
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");

  // Remove the 'required' attribute from OTP if not in step 2
  otpField.removeAttribute("required");

  if (password !== confirmPassword) {
    errorMessage.textContent = "Passwords do not match.";
    successMessage.textContent = "";
    return;
  }

  // Send email and password to the server to initiate OTP
  try {
    const response = await fetch("https://website-project-smoky-gamma.vercel.app/signup-initiate", {
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

      // Set 'required' to true for OTP in Step 2
      otpField.setAttribute("required", true);
    } else {
      errorMessage.textContent = data.message;
      successMessage.textContent = "";
    }
  } catch (err) {
    errorMessage.textContent = "An error occurred. Please try again.";
    successMessage.textContent = "";
  }
});

// OTP verification button click event
document.getElementById('verifyOtpButton').addEventListener('click', async () => {
  const otp = document.getElementById('otp').value;
  const email = document.getElementById('email').value; // keep track of the email
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');

  try {
    // Send OTP and email to server for verification
    const response = await fetch('https://website-project-smoky-gamma.vercel.app/signup-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp, email })
    });

    const data = await response.json();

    if (data.success) {
      successMessage.textContent = 'OTP verified successfully. Redirecting to login...';
      errorMessage.textContent = '';
      
      // Redirect to login after success (give user some time to see the message)
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      errorMessage.textContent = 'Invalid OTP. Please try again.';
      successMessage.textContent = '';
    }
  } catch (err) {
    errorMessage.textContent = 'An error occurred during OTP verification. Please try again.';
    successMessage.textContent = '';
  }
});

