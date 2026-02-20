const params = new URLSearchParams(window.location.search);
const queueId = params.get("id");

if (!queueId) {
  window.location.href = "/index.html";
}

const queueName = document.getElementById("queueName");
const queueAddress = document.getElementById("queueAddress");
const queueStatus = document.getElementById("queueStatus");
const waitingCount = document.getElementById("waitingCount");
const estimatedWait = document.getElementById("estimatedWait");
const joinBtn = document.getElementById("btn-join");
const positionSection = document.getElementById("positionSection");
const exitBtn = document.getElementById("btn-exit");
const logoutBtn = document.getElementById("btn-logout");

async function loadQueueInfo() {
  try {
    console.log("Loading queue info for ID:", queueId);
    const res = await fetch(`/api/guest/queue/${queueId}`);

    if (!res.ok) {
      console.log("Queue not found");
      window.location.href = "/index.html";
      return;
    }

    const data = await res.json();
    console.log("Queue info:", data);

    queueName.textContent = data.name;
    queueAddress.textContent = data.address;
    queueStatus.textContent = data.status;
    waitingCount.textContent = data.waitingCount;
    estimatedWait.textContent = data.estimatedWait;

    if (data.status !== "open") {
      joinBtn.disabled = true;
    }

    if (data.isInQueue) {
      joinBtn.classList.add("d-none");
      exitBtn.classList.remove("disabled");

      positionSection.innerHTML = `
        <div class="alert alert-info">
          Your position: <strong>${data.position}</strong>
        </div>
      `;
    } else {
      joinBtn.classList.remove("d-none");
      exitBtn.classList.add("disabled");
      positionSection.innerHTML = "";
    }
  } catch (err) {
    console.error(err);
  }
}

joinBtn.addEventListener("click", async () => {
  try {
    const res = await fetch(`/api/guest/join/${queueId}`, {
      method: "POST",
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("Error joining queue:", error.message);
      return;
    }

    joinBtn.style.display = "none";
    positionSection.innerHTML = `<div class="alert alert-success">
      You have successfully joined the queue!
    </div>`;
  } catch (err) {
    console.error(err);
    alert("Error joining queue");
  }
});

exitBtn.addEventListener("click", async () => {
  try {
    const res = await fetch(`/api/guest/exit/${queueId}`, {
      method: "POST",
    });

    if (!res.ok) {
      alert("Could not exit queue");
      return;
    }

    await loadQueueInfo();
  } catch (err) {
    console.error(err);
  }
});

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

loadQueueInfo();

setInterval(() => {
  loadQueueInfo();
}, 15000);
