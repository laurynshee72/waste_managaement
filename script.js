const guideData = {
  plastic: { title: "Plastic", intro: "Give packaging a second chance where your local program accepts it.", items: ["Empty and rinse bottles and containers", "Check the number and local collection rules", "Keep plastic bags out of curbside bins", "Choose refillable alternatives when possible"] },
  paper: { title: "Paper", intro: "Clean, dry paper is one of the easiest materials to recover.", items: ["Keep cardboard flat and dry", "Remove food-soiled sections", "Recycle newspapers and office paper", "Skip shredded paper unless your program accepts it"] },
  glass: { title: "Glass", intro: "Glass can be recycled repeatedly, but collection systems differ by area.", items: ["Rinse jars and bottles", "Separate by color if locally required", "Never place drinking glasses or ceramics in bottle bins", "Return deposit containers where available"] },
  metal: { title: "Metal", intro: "Aluminum and steel can usually be recovered with less energy than making new metal.", items: ["Empty and rinse cans", "Put lids inside cans or follow local rules", "Take paint and gas cans to a special drop-off", "Never put batteries in a recycling bin"] },
  organic: { title: "Organic waste", intro: "Food scraps and yard waste can become useful soil nutrients through composting.", items: ["Start with fruit, vegetable, and coffee scraps", "Balance wet scraps with dry leaves or paper", "Avoid meat and dairy unless your system accepts them", "Keep compost covered and aerated"] },
  electronic: { title: "Electronic waste", intro: "Electronics contain useful materials and must be kept out of regular bins.", items: ["Wipe personal data before donating", "Remove batteries when safe to do so", "Use an approved e-waste collection point", "Donate working devices for reuse"] }
};
const tips = [
  ["reduce", "Bring the reusable", "Keep a tote, bottle, or coffee cup by the door so the low-waste choice is the easy choice."],
  ["reuse", "Repair before replacing", "A patch, refill, or spare part can often extend an item's useful life."],
  ["recycle", "Know your local rules", "Search your municipality's recycling page before putting an unfamiliar material in the bin."],
  ["compost", "Start small", "Freeze food scraps in a container and find a community compost drop-off nearby."],
  ["reduce", "Plan one shelf", "Use what you already have before buying more food, toiletries, or cleaning products."],
  ["reuse", "Share the extras", "Pass along tools, books, and appliances you no longer need instead of sending them to landfill."]
];

const guideDetail = document.querySelector("#guideDetail");
const renderGuide = (category) => {
  const data = guideData[category];
  guideDetail.innerHTML = `<p class="eyebrow">Quick guide / ${data.title}</p><h3>${data.title} waste</h3><p>${data.intro}</p><ul>${data.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
};
document.querySelectorAll(".category").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".category").forEach((item) => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); });
    button.classList.add("active");
    button.setAttribute("aria-selected", "true");
    renderGuide(button.dataset.category);
  });
});
renderGuide("plastic");

const tipsGrid = document.querySelector("#tipsGrid");
const renderTips = (filter = "all") => {
  tipsGrid.innerHTML = tips.filter(([category]) => filter === "all" || category === filter).map(([category, title, copy], index) => `<article class="tip-card"><span class="tip-number">${String(index + 1).padStart(2, "0")} / ${category}</span><h3>${title}</h3><p>${copy}</p></article>`).join("");
};
document.querySelector("#tipFilter").addEventListener("change", (event) => renderTips(event.target.value));
renderTips();

const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const chatMessages = document.querySelector("#chatMessages");
const addMessage = (text, type) => {
  const message = document.createElement("div");
  message.className = `message ${type}-message`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = type === "ai" ? "✦" : "You";
  const content = document.createElement("div");
  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = type === "ai" ? "EcoGemma" : "You";
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  content.append(label, paragraph);
  message.append(avatar, content);
  chatMessages.append(message);
  message.scrollIntoView({ behavior: "smooth", block: "nearest" });
};
const askGemma = async (question) => {
  const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
  if (!response.ok) throw new Error(response.status === 429 ? "The AI service is busy right now. Please try again in a moment." : "The AI service is unavailable. Start the backend and check its Gemma configuration.");
  const data = await response.json();
  if (!data.answer) throw new Error("The AI service returned no answer.");
  return data.answer;
};
const submitQuestion = async (question) => {
  addMessage(question, "user");
  chatInput.value = "";
  chatInput.disabled = true;
  chatForm.querySelector("button").disabled = true;
  addMessage("Thinking…", "ai");
  const thinking = chatMessages.lastElementChild;
  try {
    const answer = await askGemma(question);
    thinking.querySelector("p").textContent = answer;
  } catch (error) {
    thinking.querySelector("p").textContent = error.message;
  } finally {
    chatInput.disabled = false;
    chatForm.querySelector("button").disabled = false;
    chatInput.focus();
  }
};
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (question) submitQuestion(question);
});
document.querySelectorAll(".suggestion").forEach((button) => button.addEventListener("click", () => { chatInput.value = button.textContent; chatInput.focus(); }));

const activityKey = "ecogemma-activity-count";
const activityCount = document.querySelector("#activityCount");
const updateCount = () => { activityCount.textContent = localStorage.getItem(activityKey) || "0"; };
document.querySelector("#logActivity").addEventListener("click", () => { localStorage.setItem(activityKey, String(Number(localStorage.getItem(activityKey) || 0) + 1)); updateCount(); });
document.querySelector("#resetActivity").addEventListener("click", () => { localStorage.removeItem(activityKey); updateCount(); });
updateCount();
