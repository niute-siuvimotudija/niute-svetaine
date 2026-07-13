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

document.getElementById("orderForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const number = `NI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
  document.getElementById("formMessage").textContent =
    `Ačiū! Užklausa paruošta. Demonstracinis užsakymo numeris: ${number}`;
  form.reset();
});
