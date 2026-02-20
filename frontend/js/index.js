const createQueueContainer = document.getElementById("create-queue");
const joinQueueContainer = document.getElementById("join-queue");
const resultsSection = document.getElementById("queue-results");
const resultsTitle = document.getElementById("queue-results-title");
const resultList = document.getElementById("result-list");
const usernameDisplay = document.getElementById("username-display");
const toggleBtn = document.getElementById("btn-popular-toggle");
const toggleActiveBtn = document.getElementById("btn-active-toggle");
const logoutBtn = document.getElementById("logout-btn");

let currentView = null;
let currentUserId = null;

async function loadUser() {
  try {
    const res = await fetch("/api/auth/me");

    if (!res.ok) {
      window.location.href = "/login.html";
      return;
    }

    const data = await res.json();
    currentUserId = data.userId || data._id;

    if (usernameDisplay && data.firstName) {
      usernameDisplay.textContent = data.firstName;
    }

    if (data.role === "host") {
      createQueueContainer.classList.remove("d-none");
      await checkHostQueue();
    } else if (data.role === "guest") {
      joinQueueContainer.classList.remove("d-none");
      toggleBtn.classList.remove("d-none");
      toggleActiveBtn.classList.remove("d-none");
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    window.location.href = "/login.html";
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) window.location.href = "/login.html";
    } catch (err) {
      console.error("Error logging out:", err);
      window.location.href = "/login.html";
    }
  });
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, estimatedServiceTime, popLimit }),
      });

      if (!response.ok) throw new Error("Failed to create queue");

      const data = await response.json();
      window.location.href = `/manageQueue.html?queueId=${data.queueId || data._id}`;
    } catch (err) {
      console.log("Error creating queue:", err);
      alert("Failed to create queue. Please try again.");
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

async function checkHostQueue() {
  try {
    const response = await fetch(
      `/api/queue/getUserQueue?userId=${currentUserId}`,
    );

    if (response.ok) {
      const data = await response.json();
      const queue = data.queue;

      if (createForm) {
        const inputsAndButtons = createForm.querySelectorAll("input, button");
        inputsAndButtons.forEach((el) => (el.disabled = true));
        createForm.closest(".card").classList.add("opacity-75");
      }
      const rowContainer = createQueueContainer.querySelector(".row");
      rowContainer.classList.add("gx-5");

      const isStatusOpen =
        queue.status && queue.status.toLowerCase() === "open";
      const statusBadge = `<span class="badge ${isStatusOpen ? "bg-success" : "bg-danger"} rounded-pill px-3 py-2">${queue.status ? queue.status.toUpperCase() : "STOP"}</span>`;

      const existingQueueHtml = `
        <div class="col-md-6 col-lg-5 d-flex align-items-stretch">
          <div class="card shadow border-dark mt-4 bg-white w-100 border-2">
            <div class="card-body p-4 d-flex flex-column">
              <h2 class="h4 mb-4 text-center">Your Active Queue</h2>
              
              <div class="mb-3">
                <label class="form-label text-muted small fw-bold mb-0">Queue Name</label>
                <p class="fs-5 fw-semibold mb-0">${queue.name || "N/A"}</p>
              </div>
              
              <div class="mb-3">
                <label class="form-label text-muted small fw-bold mb-0">Address</label>
                <p class="mb-0">${queue.address || "N/A"}</p>
              </div>

              <div class="row mb-4">
                <div class="col-6">
                  <label class="form-label text-muted small fw-bold mb-1">Status</label>
                  <div>${statusBadge}</div>
                </div>
                <div class="col-6">
                  <label class="form-label text-muted small fw-bold mb-1">Serve Time</label>
                  <p class="mb-0">${queue.estimatedServiceTime || "--"} min</p>
                </div>
              </div>

              <div class="mt-auto d-grid">
                <a href="/manageQueue.html?queueId=${queue._id}" class="btn btn-dark rounded-pill py-2 fw-bold">
                  Manage Queue &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      `;

      rowContainer.insertAdjacentHTML("beforeend", existingQueueHtml);
    } else if (response.status === 404) {
      console.log("No existing queue found, user can create a new one.");
    }
  } catch (err) {
    console.error("Error checking host queue:", err);
  }
}

async function loadPopularQueues() {
  try {
    const res = await fetch("/api/guest/queues/latest");

    if (!res.ok) return;

    const queues = await res.json();

    resultsTitle.textContent = "Popular Queues";
    resultsSection.classList.remove("d-none");

    resultList.innerHTML = "";

    queues.forEach((queue) => {
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4";

      col.innerHTML = `
        <div class="card shadow-sm h-100 border-0">
          <div class="card-body">
            <h5 class="card-title">${queue.name}</h5>
            <p class="text-muted small">${queue.address}</p>
            <div class="d-grid mt-3">
              <button class="btn btn-outline-dark join-btn" data-id="${queue._id}">
                View Queue
              </button>
            </div>
          </div>
        </div>
      `;

      resultList.appendChild(col);
    });

    document.querySelectorAll(".join-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        window.location.href = `/guest.html?id=${id}`;
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadActiveQueues() {
  try {
    const res = await fetch("/api/guest/queues/active");

    if (!res.ok) return;

    const queues = await res.json();

    resultsTitle.textContent = "Active Queues";
    resultsSection.classList.remove("d-none");

    resultList.innerHTML = "";

    queues.forEach((queue) => {
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4";

      col.innerHTML = `
        <div class="card shadow-sm h-100 border-0">
          <div class="card-body">
            <h5 class="card-title">${queue.name}</h5>
            <p class="text-muted small">${queue.address}</p>
            <div class="d-grid mt-3">
              <button class="btn btn-outline-dark join-btn" data-id="${queue._id}">
                View Queue
              </button>
            </div>
          </div>
        </div>
      `;

      resultList.appendChild(col);
    });

    document.querySelectorAll(".join-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        window.location.href = `/guest.html?id=${id}`;
      });
    });
  } catch (err) {
    console.error(err);
  }
}

toggleBtn.addEventListener("click", async () => {
  if (currentView === "popular") {
    resultsSection.classList.add("d-none");
    toggleBtn.textContent = "Load Popular Queues";
    currentView = null;
    return;
  }

  await loadPopularQueues();

  toggleBtn.textContent = "Hide Popular Queues";
  toggleActiveBtn.textContent = "Load Active Queues";

  resultsSection.classList.remove("d-none");
  currentView = "popular";
});

toggleActiveBtn.addEventListener("click", async () => {
  if (currentView === "active") {
    resultsSection.classList.add("d-none");
    toggleActiveBtn.textContent = "Load Active Queues";
    currentView = null;
    return;
  }

  await loadActiveQueues();

  toggleActiveBtn.textContent = "Hide Active Queues";
  toggleBtn.textContent = "Load Popular Queues";

  resultsSection.classList.remove("d-none");
  currentView = "active";
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

loadUser();
