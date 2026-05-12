const modal = document.getElementById("modal");
const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");
const expenseForm = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const spentElement = document.getElementById("spent");
const remainingElement = document.getElementById("remaining");
const coachMessage = document.getElementById("coachMessage");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

const monthlyBudget = 5000;

openModal.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById("amount").value);
  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;

  const expense = {
    id: Date.now(),
    amount,
    title,
    category,
    date: new Date().toLocaleDateString()
  };

  expenses.unshift(expense);

  localStorage.setItem("expenses", JSON.stringify(expenses));

  renderExpenses();

  expenseForm.reset();

  modal.classList.add("hidden");
});

function renderExpenses() {

  expenseList.innerHTML = "";

  let totalSpent = 0;

  expenses.forEach(expense => {

    totalSpent += expense.amount;

    const item = document.createElement("div");

    item.className = "expense-item glass";

    item.innerHTML = `
      <div class="expense-left">
        <strong>${expense.title}</strong>
        <p>${expense.category}</p>
      </div>

      <div class="expense-right">
        -${expense.amount} zł
      </div>
    `;

    expenseList.appendChild(item);
  });

  spentElement.innerText = `${totalSpent} zł`;

  const remaining = monthlyBudget - totalSpent;

  remainingElement.innerText = `${remaining} zł`;

  generateCoachMessage(totalSpent);
}
