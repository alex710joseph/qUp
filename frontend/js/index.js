const createQueueContainer = document.getElementById("create-queue");
const joinQueueContainer = document.getElementById("join-queue");
const resultsSection = document.getElementById("queue-results");
const resultsTitle = document.getElementById("queue-results-title");
const resultList = document.getElementById("result-list");
const toggleBtn = document.getElementById("btn-popular-toggle");
const toggleActiveBtn = document.getElementById("btn-active-toggle");
const logoutBtn = document.getElementById("btn-logout");

let currentView = null;

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
      createQueueContainer.classList.remove("d-none");
    }

    if (data.role == "guest") {
      joinQueueContainer.classList.remove("d-none");
      toggleBtn.classList.remove("d-none");
      toggleActiveBtn.classList.remove("d-none");
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
