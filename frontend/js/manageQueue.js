document.addEventListener("DOMContentLoaded", () => {
  const queueList = document.getElementById("queue-list-active");
  //   const totalServedInput = document.getElementById("total-served");
  //   const avgTimeInput = document.getElementById("avg-time");
  const hostUsernameDisplay = document.getElementById("host-username");

  // 1. GET QUEUE ID FROM URL
  // Example URL: http://.../manageQueue.html?queueId=6995da78858ea031d6171669
  const urlParams = new URLSearchParams(window.location.search);
  const currentQueueId = urlParams.get("queueId");

  if (!currentQueueId) {
    alert("No Queue ID provided!");
    return;
  }

  async function refreshQueue() {
    try {
      const response = await fetch(
        `/api/queue/getQueuelist?queueId=${currentQueueId}`,
      );

      if (response.status === 403 || response.status === 401) {
        // ... (Your existing modal logic here)
        return;
      }

      const data = await response.json();

      // Update Header (Optional: You might need a separate call for Host Name now)
      if (data.hostName && hostUsernameDisplay) {
        hostUsernameDisplay.textContent = `Hello, ${data.hostName}`;
      }

      // Render List
      renderList(data.queue);
    } catch (error) {
      console.error("Failed to fetch queue data:", error);
      if (queueList)
        queueList.innerHTML = `<div class="list-group-item text-danger">Error loading queue.</div>`;
    }
  }

  // --- Helper: Render List Items ---
  function renderList(items) {
    if (!queueList) return;

    if (!items || items.length === 0) {
      queueList.innerHTML = `<div class="list-group-item text-center text-muted py-4">No guests waiting.</div>`;
      return;
    }

    queueList.innerHTML = items
      .map((item) => {
        const waitTime = Math.floor(
          (Date.now() - new Date(item.timestamp).getTime()) / 60000,
        );

        return `
            <div class="list-group-item d-flex justify-content-between align-items-center py-3">
                <div>
                    <span class="fw-bold fs-5">${item.customer_name}</span>
                    <div class="text-muted small">Token: #${item.token_number}</div>
                </div>
                <span class="badge rounded-pill border border-dark text-dark bg-transparent px-3 py-2 fs-6">
                    ${waitTime} min
                </span>
            </div>
        `;
      })
      .join("");
  }

  refreshQueue();
  setInterval(refreshQueue, 10000);
});
