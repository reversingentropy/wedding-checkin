const scriptURL = "__SCRIPT_URL__"; 
let guests = [];
let guestData = null;

window.addEventListener("DOMContentLoaded", async () => {
  console.log("Starting fetch from:", scriptURL);
  const res = await fetch(scriptURL);
  const data = await res.json();
  if (data.status === "success") {
    guests = data.guests;
    console.log("Guest list loaded:", guests.length);
  } else {
    console.error("Failed to load guest list");
  }
});

// --- REPLACE your existing event listener with this one ---

document.getElementById("guestName").addEventListener("input", () => {
  const input = document.getElementById("guestName").value.toLowerCase().trim();
  const matchList = document.getElementById("matchList");
  matchList.innerHTML = "";

  document.getElementById("checkInSection").classList.add("hidden");
  document.getElementById("confirmation").classList.add("hidden");

  if (input.length < 2) return;

  // 1. Split the user's input into separate search terms.
  //    .filter(Boolean) removes any empty strings if the user types multiple spaces.
  const searchTerms = input.split(' ').filter(Boolean);

  const matches = guests
    .filter(g => {
      const guestNameLower = g.name.toLowerCase();
      // 2. Check if EVERY search term is included in the guest's name.
      return searchTerms.every(term => guestNameLower.includes(term));
    })
    .slice(0, 3);

  matches.forEach(g => {
    const btn = document.createElement("button");
    btn.textContent = g.name;
    btn.className = "bg-white border border-gray-300 px-4 py-2 mb-2 w-full text-left rounded hover:bg-gray-50";
    btn.addEventListener("click", () => {
      selectGuest(g);
      document.getElementById("matchList").innerHTML = ""; // Clear search options
      
      // This part is for visual feedback, no change needed here.
      document.querySelectorAll("#matchList button").forEach(b => b.classList.remove("bg-blue-100", "font-semibold"));
      btn.classList.add("bg-blue-100", "font-semibold");
    });
    matchList.appendChild(btn);
  });
});

function selectGuest(mainGuest) {
  guestData = mainGuest;
  const partyMembers = guests.filter(g => g.party_id === mainGuest.party_id);
  const checkInSection = document.getElementById("checkInSection");

  checkInSection.innerHTML = `
    <p class="mb-2">Hi <strong>${mainGuest.name}</strong>, we’re so happy you’re here!</p>
    <p class="mb-4">Let us know who’s joining us today! ✨</p>
    <form id="partyForm" class="mb-4">
      ${partyMembers.map(member => `
        <label class="block mb-2">
          <input type="checkbox" name="partyMember" value="${member.name}" ${member.name === mainGuest.name ? "checked" : ""}>
          ${member.name}
        </label>
      `).join("")}
    </form>
    <textarea id="guestMessage" placeholder="Leave a sweet note or well wishes for the couple 💌" class="border p-2 w-full mb-4 rounded"></textarea>
    <button id="checkInBtn" class="bg-green-500 text-white px-4 py-2 rounded w-full" disabled>Check In Now</button>
  `;
  checkInSection.classList.remove("hidden");

  const checkboxes = checkInSection.querySelectorAll("input[name='partyMember']");
  const checkInBtn = document.getElementById("checkInBtn");

  function updateButtonState() {
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    checkInBtn.disabled = !anyChecked;
  }

  checkboxes.forEach(cb => cb.addEventListener("change", updateButtonState));
  updateButtonState();

  // Remove previous event listeners to avoid stacking
  checkInBtn.replaceWith(checkInBtn.cloneNode(true));
  document.getElementById("checkInBtn").addEventListener("click", submitCheckIn);
  checkInSection.scrollIntoView({ behavior: "smooth", block: "start" });

}

async function submitCheckIn() {
  const checkInBtn = document.getElementById("checkInBtn");
  checkInBtn.disabled = true;

  const checkboxes = document.querySelectorAll("input[name='partyMember']:checked");
  const selectedNames = Array.from(checkboxes).map(cb => cb.value);

  if (selectedNames.length === 0) {
    alert("Please select at least one guest to check in.");
    checkInBtn.disabled = false;
    return;
  }

  const message = document.getElementById("guestMessage").value.trim();

  const payload = {
    names: selectedNames,
    message: message,
    table_no: guestData.table_no
  };

  try {
    const res = await fetch(scriptURL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.status === "success") {
      showConfirmation(selectedNames.length, guestData.table_no);
    } else {
      alert("Check-in failed. Try again.");
      checkInBtn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    alert("Something went wrong. Please try again.");
    checkInBtn.disabled = false;
  }
}

function showConfirmation(checkedCount, tableNo) {
  const confirmation = document.getElementById("confirmation");
  confirmation.innerHTML = `
    <p class="text-green-800 font-semibold mb-2 text-left">
      🎉 You’re all checked in${checkedCount > 1 ? `, with ${checkedCount - 1} guest${checkedCount > 2 ? 's' : ''}` : ''}!
    </p>
    <p class="mb-2 text-left">Your table number: <strong>${tableNo}</strong></p>

    <div class="text-left">
      <ul class="list-disc pl-5 mt-4 text-sm space-y-1">
        <li><strong>4:00 PM</strong> – Ceremony</li>
        <li><strong>5:00 PM</strong> – Cocktail Hour</li>
        <li><strong>6:00 PM</strong> – Dinner & Reception</li>
        <li><strong>8:00 PM</strong> – Dancing 🎶</li>
      </ul>

      <div class="mt-6">
        <p class="font-semibold mb-1">Here’s your table location:</p>
        <p class="text-sm text-gray-600 mb-3">
          Thank you so much for being here! It means the world to us. Find your seat, settle in, and enjoy this special day!
        </p>
        <img src="assets/map.jpeg" alt="Table Layout Map" class="w-full rounded border">
      </div>
    </div>
  `;
confirmation.classList.remove("hidden");

document.getElementById("checkInSection").classList.add("hidden");
document.getElementById("matchList").classList.add("hidden");
document.getElementById("guestName").classList.add("hidden");
confirmation.scrollIntoView({ behavior: "smooth" });
}
