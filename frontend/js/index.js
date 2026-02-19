const createQueueContainer = document.getElementById("create-queue");
const joinQueueContainer = document.getElementById("join-queue");
const popularSection = document.getElementById("popular-queues");
const popularList = document.getElementById("popular-list");
const toggleBtn = document.getElementById("btn-popular-toggle");

let popularLoaded = false;
let popularVisible = false;

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
              <button class="btn btn-dark join-btn" data-id="${queue._id}">
                View Queue
              </button>
            </div>
          </div>
        </div>
      `;

      popularList.appendChild(col);
    });

    // Attach click events
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

loadUser();
