document.getElementById("year").textContent = new Date().getFullYear();

const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".site-header nav");

menuButton.addEventListener("click", () => nav.classList.toggle("open"));
document.querySelectorAll(".site-header nav a").forEach(link => {
  link.addEventListener("click", () => nav.classList.remove("open"));
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

document.getElementById("orderForm").addEventListener("submit", async event => {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("formMessage");

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  message.className = "form-message loading";
  message.textContent = "Siunčiama...";

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form)
    });

    const result = await response.json();

    if (result.success) {
      const number = `NI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
      message.className = "form-message";
      message.textContent = `Ačiū! Užsakymas išsiųstas. Jūsų užsakymo numeris: ${number}`;
      form.reset();
    } else {
      throw new Error(result.message || "Nepavyko išsiųsti užsakymo.");
    }
  } catch (error) {
    message.className = "form-message error";
    message.textContent = "Nepavyko išsiųsti užsakymo. Pabandykite dar kartą arba skambinkite +370 608 23342.";
  }
});
