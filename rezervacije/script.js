document.addEventListener("DOMContentLoaded", () => {
  // Sticky header shadow on scroll
  const header = document.getElementById("header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile nav toggle
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Reveal on scroll
  const revealEls = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => observer.observe(el));

  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- DEMO KOLEDAR ----------
  const DAYS = ["Pon", "Tor", "Sre", "Čet", "Pet", "Sob", "Ned"];
  const HOURS = Array.from({ length: 14 }, (_, i) => 8 + i); // 8:00–21:00

  let weekOffset = 0;

  function getWeekStart(offset) {
    const now = new Date();
    const day = (now.getDay() + 6) % 7; // ponedeljek = 0
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() - day + offset * 7);
    return monday;
  }

  // Demo podatki – realni tedenski urnik telovadnice (ponavlja se vsak teden)
  // dan: 0=Pon, 1=Tor, 2=Sre, 3=Čet, 4=Pet, 5=Sob, 6=Ned
  const SCHEDULE = {
    0: {
      17: "Badminton – Boštjan · 041 634 575",
      18: "Badminton – Boštjan · 041 634 575",
      19: "Badminton – Jaka Švajger, Tomaž Medved · 041 796 575",
      20: "Badminton – Jani Matko · 20.30–22.00",
      21: "Badminton – Jani Matko",
    },
    1: {
      16: "Badminton – Boštjan",
      17: "Badminton – Boštjan · 041 634 575",
      18: "Badminton – Hriberšek · 040 749 847",
      19: "Badminton – Pantner · 051 314 300",
      20: "Luka · 051 686 584",
      21: "Luka · 20.00–22.00",
    },
    2: {
      15: "Blokirano – vzdrževanje dvorane",
      18: "Sedeča odbojka",
      19: "Sedeča odbojka",
      20: "Odbojka – Andrej Pecl · 20.00–22.00",
      21: "Odbojka – Andrej Pecl · 070 875 712",
    },
    3: {
      17: "Badminton – Beki · 17.30–19.00",
      18: "Badminton – Beki · 030 422 822",
      19: "Rekreacija (Odbojka M) · 19.00–20.30",
      20: "Rekreacija (Odbojka M)",
      21: "Badminton – Simon Gajšek · 031 309 987",
    },
    4: {
      17: "Badminton – Simon G. · 031 309 987",
      18: "DU Braslovče – Andrej · 041 690 348",
      19: "Rekreacija (Marta Marovt) · 19.00–20.30",
      20: "Rekreacija (Marta Marovt) · 031 693 027",
      21: "Igor Zbičajnik · 041 624 874",
    },
    5: {}, // Sobota – prosto
    6: {}, // Nedelja – prosto
  };

  function slotStatus(dayIndex, hour) {
    const entry = SCHEDULE[dayIndex] && SCHEDULE[dayIndex][hour];
    if (!entry) return { status: "free" };
    if (entry.startsWith("Blokirano")) return { status: "blocked", label: entry };
    return { status: "booked", label: entry };
  }

  function formatDate(d) {
    return d.toLocaleDateString("sl-SI", { day: "numeric", month: "numeric" });
  }

  // ---------- IZBIRA VEČ TERMINOV ----------
  const selection = new Map(); // key "YYYY-MM-DD_HH" -> { dayIndex, date, hour }

  function slotKey(d, hour) {
    return `${d.toISOString().slice(0, 10)}_${hour}`;
  }

  function toggleSlot(d, hour, dayIndex) {
    const key = slotKey(d, hour);
    if (selection.has(key)) {
      selection.delete(key);
    } else {
      selection.set(key, { dayIndex, date: d, hour });
    }
    renderCalendar();
    updateSelectionBar();
  }

  function updateSelectionBar() {
    const bar = document.getElementById("selectionBar");
    const count = selection.size;
    bar.hidden = count === 0;
    document.getElementById("selectionCount").textContent =
      count === 1 ? "1 izbran termin" : `${count} izbranih terminov`;
  }

  function renderCalendar() {
    const weekStart = getWeekStart(weekOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    document.getElementById("weekLabel").textContent =
      `${formatDate(weekStart)}–${formatDate(weekEnd)}`;

    const table = document.getElementById("calendar");
    table.innerHTML = "";

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.appendChild(document.createElement("th"));
    const dayDates = DAYS.map((label, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const th = document.createElement("th");
      th.textContent = `${label} ${formatDate(d)}`;
      headRow.appendChild(th);
      return d;
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    HOURS.forEach((hour) => {
      const tr = document.createElement("tr");
      const timeCell = document.createElement("td");
      timeCell.className = "rez-time";
      timeCell.textContent = `${hour}:00`;
      tr.appendChild(timeCell);

      dayDates.forEach((d, dayIndex) => {
        const { status, label } = slotStatus(dayIndex, hour);
        const td = document.createElement("td");
        const isSelected = status === "free" && selection.has(slotKey(d, hour));
        td.className = `rez-slot is-${status}${isSelected ? " is-selected" : ""}`;
        if (status === "free") {
          td.title = isSelected
            ? `Izbrano – ${formatDate(d)} ob ${hour}:00 (klikni za odstranitev)`
            : `Prosto – ${formatDate(d)} ob ${hour}:00`;
          td.addEventListener("click", () => toggleSlot(d, hour, dayIndex));
        } else {
          td.title = label;
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }

  document.getElementById("prevWeek").addEventListener("click", () => {
    weekOffset -= 1;
    renderCalendar();
  });
  document.getElementById("nextWeek").addEventListener("click", () => {
    weekOffset += 1;
    renderCalendar();
  });

  renderCalendar();
  updateSelectionBar();

  // ---------- DEMO MODAL ----------
  const modal = document.getElementById("rezModal");
  const modalList = document.getElementById("rezModalList");
  const modalClose = document.getElementById("rezModalClose");
  const rezForm = document.getElementById("rezForm");

  function openModal() {
    modalList.innerHTML = "";
    const items = [...selection.values()].sort((a, b) => a.date - b.date || a.hour - b.hour);
    items.forEach(({ dayIndex, date, hour }) => {
      const li = document.createElement("li");
      li.textContent = `${DAYS[dayIndex]}, ${formatDate(date)} ob ${hour}:00–${hour + 1}:00`;
      modalList.appendChild(li);
    });
    modal.hidden = false;
  }
  function closeModal() {
    modal.hidden = true;
    rezForm.reset();
  }

  document.getElementById("selectionBookBtn").addEventListener("click", () => {
    if (selection.size === 0) return;
    openModal();
  });
  document.getElementById("selectionClearBtn").addEventListener("click", () => {
    selection.clear();
    renderCalendar();
    updateSelectionBar();
  });

  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  rezForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const count = selection.size;
    alert(
      `To je osnutek rezervacijske platforme – povpraševanje za ${count} termin(ov) se ni poslalo.\n` +
      "Za pravo rezervacijo pokličite 070 292 363 ali pišite na zanmuhovic6@gmail.com."
    );
    selection.clear();
    renderCalendar();
    updateSelectionBar();
    closeModal();
  });
});
