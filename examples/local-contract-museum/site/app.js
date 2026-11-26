const button = document.querySelector("#show-entry-price");
const result = document.querySelector("#entry-price");

button.addEventListener("click", async () => {
  const response = await fetch("/offer.json", { cache: "no-store" });
  if (!response.ok) {
    result.textContent = "Price unavailable.";
    return;
  }
  const offer = await response.json();
  result.textContent = `$${(offer.price_cents / 100).toFixed(2)}`;
});
