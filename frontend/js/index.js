const createQueueContainer = document.getElementById("create-queue");
const joinQueueContainer = document.getElementById("join-queue");
const resultsSection = document.getElementById("queue-results");
const resultsTitle = document.getElementById("queue-results-title");
const resultList = document.getElementById("result-list");
const toggleBtn = document.getElementById("btn-popular-toggle");
const usernameDisplay = document.getElementById("username-display");
const logoutBtn = document.getElementById("logout-btn");

let popularLoaded = false;
let popularVisible = false;
let currentUserId = null;

// --- 1. User Authentication & Routing ---
async function loadUser() {
  try {
    const res = await fetch("/api/auth/me");

    if (!res.ok) {
      window.location.href = "/login.html";
      return;
    }

    const data = await res.json();
    currentUserId = data.userId || data._id; // Ensure compatibility with your backend

    if (usernameDisplay && data.firstName) {
      usernameDisplay.textContent = data.firstName;
    }

    if (data.role === "host") {
      createQueueContainer.classList.remove("d-none");
      await checkHostQueue();
    } else if (data.role === "guest") {
      joinQueueContainer.classList.remove("d-none");
      if (toggleBtn) toggleBtn.classList.remove("d-none");
    }
  } catch (err) {
    console.error("Error fetching user data:", err);
    window.location.href = "/login.html";
  }
}

// --- 2. Logout Logic ---
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

// --- 3. Create New Queue Logic ---
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
      // Redirect directly to the manage queue dashboard
      window.location.href = `/manageQueue.html?queueId=${data.queueId || data._id}`;
    } catch (err) {
      console.log("Error creating queue:", err);
      alert("Failed to create queue. Please try again.");
    }
  });
}

// --- 4. Join Queue Logic (Guest) ---
const joinForm = document.querySelector("#join-queue form");
if (joinForm) {
  joinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const queueId = document.getElementById("queueId").value.trim();
    if (!queueId) return;
    window.location.href = `/guest.html?id=${queueId}`;
  });
}

// --- 5. Host Dashboard UI Update ---
async function checkHostQueue() {
  try {
    const response = await fetch(
      `/api/queue/getUserQueue?userId=${currentUserId}`,
    );

    if (response.ok) {
      const data = await response.json();
      const queue = data.queue;

      // 1. Disable the Create Queue Form
      if (createForm) {
        // Disable all inputs and buttons
        const inputsAndButtons = createForm.querySelectorAll("input, button");
        inputsAndButtons.forEach((el) => (el.disabled = true));

        // Add visual cues that it's disabled (opacity)
        createForm.closest(".card").classList.add("opacity-75");
      }

      // 2. Build the Existing Queue Card side-by-side
      const rowContainer = createQueueContainer.querySelector(".row");

      // Add gap class to the row so the cards have nice spacing
      rowContainer.classList.add("gx-5");

      // Status badge coloring
      const isStatusOpen =
        queue.status && queue.status.toLowerCase() === "open";
      const statusBadge = `<span class="badge ${isStatusOpen ? "bg-success" : "bg-danger"} rounded-pill px-3 py-2">${queue.status ? queue.status.toUpperCase() : "STOP"}</span>`;

      // The new card HTML (matches the height and styling of the create form)
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

      // Inject the new card right next to the Create form
      rowContainer.insertAdjacentHTML("beforeend", existingQueueHtml);
    } else if (response.status === 404) {
      // If 404, the user doesn't have a queue yet.
      // Do nothing, the Create Queue form stays perfectly centered and active.
      console.log("No existing queue found, user can create a new one.");
    }
  } catch (err) {
    console.error("Error checking host queue:", err);
  }
}

// --- 6. Popular Queues Logic ---
async function loadPopularQueues() {
  try {
    const res = await fetch("/api/guest/queues/latest");
    if (!res.ok) return;

    const queues = await res.json();
    popularSection.classList.remove("d-none");
    popularList.innerHTML = "";

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
      popularList.appendChild(col);
    });

    document.querySelectorAll(".join-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        window.location.href = `/guest.html?id=${id}`;
      });
    });
  } catch (err) {
    console.error("Error loading popular queues:", err);
  }
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", async () => {
    if (!popularLoaded) {
      await loadPopularQueues();
      popularLoaded = true;
    }

    if (popularVisible) {
      popularSection.classList.add("d-none");
      toggleBtn.textContent = "Load Popular Queues";
      popularVisible = false;
    } else {
      popularSection.classList.remove("d-none");
      toggleBtn.textContent = "Hide Popular Queues";
      popularVisible = true;
    }
  });
}

// Initialize
loadUser();
