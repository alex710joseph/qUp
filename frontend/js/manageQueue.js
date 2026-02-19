document.addEventListener("DOMContentLoaded", () => {
  const queueList = document.getElementById("queue-list-active");
  //   const totalServedInput = document.getElementById("total-served");
  //   const avgTimeInput = document.getElementById("avg-time");
  const hostUsernameDisplay = document.getElementById("host-username");

  // Example URL: http://.../manageQueue.html?queueId=6995da78858ea031d6171669
  const urlParams = new URLSearchParams(window.location.search);
  const currentQueueId = urlParams.get("queueId");

  if (!currentQueueId) {
    alert("No Queue ID provided!");
    return;
  }

  const btnServeNextElement = document.getElementById("btn-serve-next");
  if (btnServeNextElement) {
    btnServeNextElement.addEventListener("click", serveNextCustomer);
  }

  async function serveNextCustomer() {
    const btnServeNext = document.getElementById("btn-serve-next");
    if (!btnServeNext) return;

    try {
      // Prevent rapid double-clicks
      btnServeNext.disabled = true;

      const response = await fetch(
        `/api/queue/serveNext?queueId=${currentQueueId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        await refreshQueue();
      } else if (response.status === 404) {
        alert("The queue is currently empty.");
      } else {
        console.error("Failed to serve the next guest.");
        alert("An error occurred. Please try again.");
      }
    } catch (error) {
      console.error("Error serving next guest:", error);
    } finally {
      // Always re-enable the button when done
      btnServeNext.disabled = false;
    }
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

      if (data.hostName && hostUsernameDisplay) {
        hostUsernameDisplay.textContent = `Hello, ${data.hostName}`;
      }

      renderList(data.queue);
      defineTotalServed();
    } catch (error) {
      console.error("Failed to fetch queue data:", error);
      if (queueList)
        queueList.innerHTML = `<div class="list-group-item text-danger">Error loading queue.</div>`;
    }
  }

  async function defineTotalServed() {
    const countResponse = await fetch(
      `/api/queue/getServedCustomerCount?queueId=${currentQueueId}`,
    );
    const countData = await countResponse.json();

    const totalServedInput = document.getElementById("total-served");
    if (totalServedInput) {
      totalServedInput.value = countData.count;
    }
  }

  async function calculateAverageServiceTime() {
    const averageServiceTimeResponse = await fetch(
      `/api/queue/getQueueDetails?queueId=${currentQueueId}`,
    );
    const avgServiceTimeData = await averageServiceTimeResponse.json();

    const avgServiceTimeInput = document.getElementById("avg-time");
    if (avgServiceTimeInput) {
      const time = avgServiceTimeData.estimatedServiceTime;
      avgServiceTimeInput.value = time ? `${time} mins` : "N/A";
    }

    const queueStatusInput = document.getElementById("queue-status");
    if (queueStatusInput) {
      const status = avgServiceTimeData.status;
      queueStatusInput.value = status ? `${status}` : "N/A";

      const btnQueueStatusAction = document.getElementById(
        "btn-queue-status-action",
      );
      const btnServeNext = document.getElementById("btn-serve-next");

      if (status && status.toLowerCase() === "stop") {
        // Story 1: Status is stop
        if (btnQueueStatusAction)
          btnQueueStatusAction.textContent = "Open Queue";
        if (btnServeNext) btnServeNext.disabled = true;
      } else if (status && status.toLowerCase() === "open") {
        // Story 2: Status is open
        if (btnQueueStatusAction)
          btnQueueStatusAction.textContent = "Stop Queue";
        if (btnServeNext) btnServeNext.disabled = false;
      }
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
      .map((item, index) => {
        const waitTime = Math.floor(
          (Date.now() - new Date(item.timestamp).getTime()) / 60000,
        );

        return `
            <div class="list-group-item d-flex justify-content-between align-items-center py-3">
                <div>
                    <span class="fw-bold fs-5">${item.customer_firstName} ${item.customer_lastName}</span>
                    <div class="text-muted small">Token: #${index + 1}</div>
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
  calculateAverageServiceTime();
  setInterval(refreshQueue, 100000);

  const btnQueueStatusElement = document.getElementById(
    "btn-queue-status-action",
  );

  if (btnQueueStatusElement) {
    btnQueueStatusElement.addEventListener("click", toggleQueueStatus);
  }

  async function toggleQueueStatus() {
    const queueStatusInput = document.getElementById("queue-status");
    if (!queueStatusInput) return;

    const currentStatus = queueStatusInput.value.toLowerCase();

    const newStatus = currentStatus === "stop" ? "open" : "stop";

    if (btnQueueStatusElement) btnQueueStatusElement.disabled = true;

    try {
      const response = await fetch("/api/queue/updateStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queueId: currentQueueId,
          status: newStatus,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert("Failed to update queue status.");
        if (btnQueueStatusElement) btnQueueStatusElement.disabled = false;
      }
    } catch (error) {
      console.error("Error toggling queue status:", error);
      if (btnQueueStatusElement) btnQueueStatusElement.disabled = false;
    }
  }

  const btnClearQueueElement = document.getElementById("btn-clear-queue");
  if (btnClearQueueElement) {
    btnClearQueueElement.addEventListener("click", clearQueueEntries);
  }

  async function clearQueueEntries() {
    // 1. Ask for confirmation before deleting
    const isConfirmed = confirm(
      "Are you sure you want to clear the entire queue? All guest entries will be permanently deleted.",
    );

    if (!isConfirmed) {
      return;
    }

    const btnClearQueue = document.getElementById("btn-clear-queue");
    if (btnClearQueue) btnClearQueue.disabled = true;

    try {
      const response = await fetch("/api/queue/clearQueue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ queueId: currentQueueId }),
      });

      if (response.ok) {
        await refreshQueue();
        alert("Queue has been cleared.");
      } else {
        console.error("Failed to clear the queue.");
        alert("An error occurred while clearing the queue. Please try again.");
      }
    } catch (error) {
      console.error("Error clearing queue:", error);
    } finally {
      // Re-enable the button
      if (btnClearQueue) btnClearQueue.disabled = false;
    }
  }
});
