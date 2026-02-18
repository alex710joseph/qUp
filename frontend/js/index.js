const createQueueContainer = document.getElementById("create-queue");
const joinQueueContainer = document.getElementById("join-queue");

async function loadUser() {
  try {
    const res = await fetch("/api/auth/me");

    if (!res.ok) {
      window.location.href = "/login.html";
      return;
    }

    const data = await res.json();
    console.log("User data:", data);

    if (data.role == "host") {
      createQueueContainer.style.display = "block";
    }

    if (data.role == "guest") {
      joinQueueContainer.style.display = "block";
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    window.location.href = "/login.html";
  }
}

const createForm = document.querySelector("#create-queue form");

if (createForm) {
  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("queueName").value;
    const address = document.getElementById("address").value;
    const estimatedServiceTime = document.getElementById("serveTime").value;
    const popLimit = document.getElementById("popLimit").value;

    try {
      const response = await fetch("/api/host/queue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          address,
          estimatedServiceTime,
          popLimit,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create queue");
      }

      const data = await response.json();
      console.log("Queue created:", data);

      window.location.href = `../queue.html?id=${data.queueId}`;
    } catch (err) {
      console.log("Error creating queue:", err);
    }
  });
}

const joinForm = document.querySelector("#join-queue form");

if (joinForm) {
  joinForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const queueId = document.getElementById("queueId").value.trim();

    if (!queueId) return;

    window.location.href = `/guest.html?id=${queueId}`;
  });
}

loadUser();
