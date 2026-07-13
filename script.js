document.getElementById("year").textContent = new Date().getFullYear();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.1 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const CLOUDINARY_CLOUD_NAME = "jrberzhn";
const CLOUDINARY_UPLOAD_PRESET = "Niute_siuvimostudija";
const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 8 * 1024 * 1024;

const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");
const uploadStatus = document.getElementById("uploadStatus");

photoInput.addEventListener("change", () => {
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

document.getElementById("orderForm").addEventListener("submit", async event => {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("formMessage");
  const submitButton = form.querySelector('button[type="submit"]');

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const files = [...photoInput.files];
  submitButton.disabled = true;
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
    formData.append(
      "Nuotraukų nuorodos",
      photoUrls.length
        ? photoUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")
        : "Nuotraukos nepridėtos"
    );

    const response = await fetch(form.action, { method: "POST", body: formData });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Nepavyko išsiųsti užsakymo.");
    }

    const number = `NI-${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}`;
    message.className = "form-message success";
    message.textContent = `Ačiū! Užsakymas išsiųstas. Užsakymo numeris: ${number}`;
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
