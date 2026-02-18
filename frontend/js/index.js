async function loadUser() {
  try {
    const res = await fetch("/api/auth/me");

    if (!res.ok) {
      window.location.href = "/login.html";
      return;
    }

    const data = await res.json();
    console.log("User data:", data);
  } catch (err) {
    console.error("Error fetching user data:", err);
    window.location.href = "/login.html";
  }
}

loadUser();
