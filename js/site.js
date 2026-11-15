// Header behaviour: the Services panel opens on hover, focus or click; Escape and outside clicks close menus.
const nav = document.querySelector(".nav-services");
const trigger = nav && nav.querySelector(".nav-trigger");

function closeServices() {
  if (!nav) return;
  nav.classList.remove("open");
  trigger.setAttribute("aria-expanded", "false");
}

if (nav) {
  trigger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    trigger.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => { if (!nav.contains(e.target)) closeServices(); });
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  closeServices();
  document.querySelectorAll("details.nav-mobile[open]").forEach((d) => { d.open = false; });
});

document.addEventListener("click", (e) => {
  document.querySelectorAll("details.nav-mobile[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; });
});
