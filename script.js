const FETCH_URL  = "/.netlify/functions/fetch-guests";
const SUBMIT_URL = "/.netlify/functions/submit-checkin";

let guests = [];
let guestData = null;

// Cache DOM nodes
const guestNameEl      = document.getElementById("guestName");
const matchListEl      = document.getElementById("matchList");
const checkInSectionEl = document.getElementById("checkInSection");
const confirmationEl   = document.getElementById("confirmation");

window.addEventListener("DOMContentLoaded", init);

async function init() {
  console.log("Starting fetch from:", FETCH_URL);
  try {
    const res  = await fetch(FETCH_URL);
    const data = await res.json();
    if (data.status === "success" && Array.isArray(data.guests)) {
      // Pre-compute lowercase names
      guests = data.guests.map(g => ({
        id:        g.id,
        name:      g.name,
        nameLower: g.name.toLowerCase(),
        party_id:  g.party_id,
        table_no:  g.table_no
      }));
      console.log("Guest list loaded:", guests.length);
    } else {
      console.error("Failed to load guest list");
    }
  } catch (err) {
    console.error("Error fetching guests:", err);
  }

  guestNameEl.addEventListener("input", handleSearch);
}

function handleSearch() {
  const input = guestNameEl.value.toLowerCase().trim();
  // hide detail panes
  checkInSectionEl.classList.add("hidden");
  confirmationEl.classList.add("hidden");
  // clear old matches
  matchListEl.textContent = "";

  if (input.length < 2) return;

  const terms = input.split(/\s+/);
  const matches = guests
    .filter(g => terms.every(t => g.nameLower.includes(t)))
    .slice(0, 3);

  // batch DOM writes
  const frag = document.createDocumentFragment();
  matches.forEach(g => {
    const btn = document.createElement("button");
    btn.type        = "button";
    btn.textContent = g.name;
    btn.className   = "bg-white border border-gray-300 px-4 py-2 mb-2 w-full text-left rounded hover:bg-gray-50";
    btn.addEventListener("click", () => {
      selectGuest(g);
      matchListEl.textContent = "";
    });
    frag.appendChild(btn);
  });
  matchListEl.appendChild(frag);
}

function selectGuest(mainGuest) {
  guestData = mainGuest;
  const members = guests.filter(g => g.party_id === mainGuest.party_id);

  checkInSectionEl.innerHTML = `
    <p class="mb-2">Hi <strong>${mainGuest.name}</strong>, we’re so happy you’re here!</p>
    <p class="mb-4">Let us know who’s joining us today! ✨</p>
    <form id="partyForm" class="mb-4">
      ${members.map(m => `
        <label class="block mb-2">
          <input type="checkbox" name="partyMember" value="${m.name}" ${m.name === mainGuest.name ? "checked" : ""}>
          ${m.name}
        </label>
      `).join("")}
    </form>
    <textarea id="guestMessage" placeholder="Leave a sweet note or well wishes for the couple 💌"
      class="border p-2 w-full mb-4 rounded"></textarea>
    <button id="checkInBtn" class="bg-green-500 text-white px-4 py-2 rounded w-full" disabled>
      Check In Now
    </button>
  `;
  checkInSectionEl.classList.remove("hidden");

  const checkboxes = checkInSectionEl.querySelectorAll("input[name='partyMember']");
  const rawBtn     = document.getElementById("checkInBtn");

  // enable button when any box is checked
  function updateState() {
    rawBtn.disabled = !Array.from(checkboxes).some(cb => cb.checked);
  }
  checkboxes.forEach(cb => cb.addEventListener("change", updateState));
  updateState();

  // replace button to clear any old listeners
  const checkInBtn = rawBtn.cloneNode(true);
  checkInBtn.addEventListener("click", submitCheckIn);
  rawBtn.replaceWith(checkInBtn);

  checkInSectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function submitCheckIn(evt) {
  evt.preventDefault();
  const btn = document.getElementById("checkInBtn");
  btn.disabled = true;

  const selected = Array.from(
    document.querySelectorAll("input[name='partyMember']:checked")
  ).map(cb => cb.value);

  if (selected.length === 0) {
    alert("Please select at least one guest to check in.");
    btn.disabled = false;
    return;
  }

  const message = document.getElementById("guestMessage").value.trim();
  const payload = { names: selected, message, table_no: guestData.table_no };

  try {
    const res    = await fetch(SUBMIT_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.status === "success") {
      showConfirmation(selected.length, guestData.table_no);
    } else {
      alert("Check-in failed. Try again.");
      btn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
    btn.disabled = false;
  }
}

function showConfirmation(count, tableNo) {
  confirmationEl.innerHTML = `
    <p class="text-green-800 font-semibold mb-2">
      🎉 You’re all checked in${count > 1 ? `, with ${count - 1} guest${count > 2 ? "s" : ""}` : ""}!
    </p>
    <p class="mb-2">Your table number: <strong>${tableNo}</strong></p>
    <ul class="list-disc pl-5 mt-4 text-sm space-y-1 text-left">
      <li><strong>4:00 PM</strong> – Ceremony</li>
      <li><strong>5:00 PM</strong> – Cocktail Hour</li>
      <li><strong>6:00 PM</strong> – Dinner & Reception</li>
      <li><strong>8:00 PM</strong> – Dancing 🎶</li>
    </ul>
    <div class="mt-6">
      <p class="font-semibold mb-1">Here’s your table location:</p>
      <p class="text-sm text-gray-600 mb-3">
        Thank you so much for being here! Find your seat, settle in, and enjoy this special day!
      </p>
      <img src="assets/map.jpeg" alt="Table Layout Map" class="w-full rounded border">
    </div>
  `;
  confirmationEl.classList.remove("hidden");
  checkInSectionEl.classList.add("hidden");
  matchListEl.classList.add("hidden");
  guestNameEl.classList.add("hidden");
  confirmationEl.scrollIntoView({ behavior: "smooth" });
}
