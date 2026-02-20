const logoutBtn = document.getElementById("btn-logout");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        alert("Logout failed");
        return;
      }

      window.location.href = "/login.html";
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
}
