const form = document.getElementById("signup-form");
const errorMsg = document.getElementById("error-msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userData = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value,
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    role: document.getElementById("role").value,
  };

  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.message || "Signup failed";
      return;
    }

    window.location.href = "/login.html";
  } catch (err) {
    console.error("Signup error:", err);
    errorMsg.textContent = "Something went wrong.";
  }
});
