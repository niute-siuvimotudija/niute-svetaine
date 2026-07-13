
const menuButton = document.querySelector(".menu-button");
const drawerMenu = document.querySelector(".drawer-menu");

if (menuButton && drawerMenu) {
  menuButton.addEventListener("click", event => {
    event.stopPropagation();
    const open = drawerMenu.classList.toggle("open");
    menuButton.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  });

  drawerMenu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      drawerMenu.classList.remove("open");
      menuButton.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", event => {
    if (!drawerMenu.contains(event.target) && !menuButton.contains(event.target)) {
      drawerMenu.classList.remove("open");
      menuButton.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}


document.getElementById("year").textContent = new Date().getFullYear();

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const CLOUDINARY_CLOUD_NAME = "jrberzhn";
const CLOUDINARY_UPLOAD_PRESET = "Niute_siuvimostudija";
const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 8 * 1024 * 1024;

const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const uploadStatus = document.getElementById("uploadStatus");

function createOrderNumber() {
  const now = new Date();
  const pad = value => String(value).padStart(2, "0");
  return `NI-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

photoInput?.addEventListener("change", () => {
  const files = [...photoInput.files];
  photoPreview.innerHTML = "";
  uploadStatus.textContent = "";
  uploadStatus.className = "upload-status";

  if (files.length > MAX_PHOTOS) {
    photoInput.value = "";
    uploadStatus.className = "upload-status error";
    uploadStatus.textContent = "Galima pasirinkti ne daugiau kaip 3 nuotraukas.";
    return;
  }

  const tooLarge = files.find(file => file.size > MAX_PHOTO_SIZE);
  if (tooLarge) {
    photoInput.value = "";
    uploadStatus.className = "upload-status error";
    uploadStatus.textContent = "Viena iš nuotraukų yra didesnė nei 8 MB.";
    return;
  }

  files.forEach(file => {
    const item = document.createElement("div");
    item.className = "photo-preview-item";
    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = "Pasirinkta drabužio nuotrauka";
    image.onload = () => URL.revokeObjectURL(image.src);
    item.appendChild(image);
    photoPreview.appendChild(item);
  });
});

async function uploadPhoto(file) {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  data.append("folder", "niute-uzsakymai");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: data }
  );

  const result = await response.json();
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || "Nepavyko įkelti nuotraukos.");
  }
  return result.secure_url;
}

document.getElementById("orderForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("formMessage");
  const confirmation = document.getElementById("orderConfirmation");
  const confirmationNumber = document.getElementById("confirmationOrderNumber");
  const submitButton = form.querySelector('button[type="submit"]');

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const orderNumber = createOrderNumber();
  document.getElementById("orderNumberField").value = orderNumber;
  document.getElementById("emailSubject").value = `Naujas NIUTE užsakymas – ${orderNumber}`;

  const files = [...photoInput.files];
  submitButton.disabled = true;
  confirmation.hidden = true;
  message.className = "form-message";
  message.textContent = files.length ? "Įkeliamos nuotraukos..." : "Siunčiamas užsakymas...";

  try {
    let photoUrls = [];
    if (files.length) {
      photoUrls = await Promise.all(files.map(uploadPhoto));
      uploadStatus.className = "upload-status success";
      uploadStatus.textContent = "Nuotraukos sėkmingai įkeltos.";
    }

    const formData = new FormData(form);
    formData.delete("Nuotraukos");
    formData.set("Užsakymo numeris", orderNumber);
    formData.set("subject", `Naujas NIUTE užsakymas – ${orderNumber}`);
    formData.append(
      "Nuotraukų nuorodos",
      photoUrls.length
        ? photoUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")
        : "Nuotraukos nepridėtos"
    );

    const response = await fetch(form.action, {
      method: "POST",
      body: formData
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Nepavyko išsiųsti užsakymo.");
    }

    message.textContent = "";
    confirmationNumber.textContent = `Užsakymo Nr. ${orderNumber}`;
    confirmation.hidden = false;

    form.reset();
    photoPreview.innerHTML = "";
    uploadStatus.textContent = "";
  } catch (error) {
    message.className = "form-message error";
    message.textContent = "Nepavyko išsiųsti užsakymo. Pabandykite dar kartą arba skambinkite +370 608 23342.";
    uploadStatus.className = "upload-status error";
    uploadStatus.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});
