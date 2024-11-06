// Store fetch controller to be able to cancel requests
let controller;

function initialize() {
  const nextButtons = document.querySelectorAll(".next");
  const childNameInput = document.getElementById("childName");
  const favouriteInput = document.getElementById("favourite");
  const highlightInput = document.getElementById("highlight");
  const plansInput = document.getElementById("plans");
  const restartButtons = document.querySelectorAll(".restart");
  const cancelButton = document.querySelector(".cancel");
  const popup = document.querySelector(".popup");
  const popupClose = document.getElementById("close-popup");
  const popupOpen = document.getElementById("open-popup");

  // Initialize steps visibility
  resetPage();

  // Disable "Next" button until child name is filled
  childNameInput.addEventListener("input", () => {
    const nextButton = document.querySelector("#step-1 .next");
    nextButton.disabled = childNameInput.value.trim() === "";
  });

  // Listen for Enter key to submit the current step
  childNameInput.addEventListener("keydown", (e) => handleEnterKey(e, 0));
  favouriteInput.addEventListener("keydown", (e) => handleEnterKey(e, 1));
  highlightInput.addEventListener("keydown", (e) => handleEnterKey(e, 2));
  plansInput.addEventListener("keydown", (e) => handleEnterKey(e, 3));

  // Handle next button clicks to move between steps
  nextButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      handleNextStep(index);
    });
  });

  // Handle restart and cancel buttons
  restartButtons.forEach((button) => {
    button.addEventListener("click", resetPage);
  });

  cancelButton.addEventListener("click", () => {
    if (controller) {
      controller.abort(); // Cancel the fetch request
    }
    resetPage();
  });

  popupOpen.addEventListener("click", () => {
    popup.style.display = "flex";
  });
  popupClose.addEventListener("click", () => {
    popup.style.display = "none";
  });

  document.getElementById("copyToClipboard").addEventListener("click", () => {
    // Get the letter text and replace any chain of spaces with a single space
    const resultContainer =
      document.getElementById("resultContainer").textContent;
    const cleanedText = resultContainer.replace(/\s+/g, " ");

    // Copy the cleaned text to the clipboard
    navigator.clipboard.writeText(cleanedText).then(() => {
      const copyButton = document.getElementById("copyToClipboard");
      copyButton.textContent = "Letter copied!";

      // Revert back to the original text after 2 seconds
      setTimeout(() => {
        copyButton.textContent = "Copy Letter to Clipboard";
      }, 4000);
    });
  });
}

// Function to update all name spans
function updateNameSpans(name) {
  const nameSpans = document.querySelectorAll("span.name");
  nameSpans.forEach((span) => {
    span.textContent = name;
  });
}

// Function to handle moving to the next step
function handleNextStep(index) {
  const progress = document.getElementById("progress");
  if (index === 0 && !document.getElementById("childName").value.trim()) {
    progress.style.width = "0";
    return; // Name step is mandatory
  }
  if (index === 0) {
    const childName = document.getElementById("childName").value.trim();
    updateNameSpans(childName); // Update all spans with the child's name

    const character = document.getElementById("character").value;
    updateCharacterSpans(character); // Update all character spans with the selected character

    updateBodyClass("step-1", "step-2");
    document.getElementById("favourite").focus();
    progress.style.width = "25%";
  } else if (index === 1) {
    updateBodyClass("step-2", "step-3");
    document.getElementById("highlight").focus();
    progress.style.width = "50%";
  } else if (index === 2) {
    updateBodyClass("step-3", "step-4");
    document.getElementById("plans").focus();
    progress.style.width = "75%";
  } else if (index === 3) {
    updateBodyClass("step-4", "loading");
    progress.style.width = "100%";
    handleSubmit(); // Submit when last step is done
  }
}

// Function to handle Enter key to trigger next step
function handleEnterKey(event, index) {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent the default Enter behavior
    handleNextStep(index);
  }
}

// Reset the page to step 1
function resetPage() {
  const body = document.body;

  // Clear form values
  document.getElementById("childName").value = "";
  setTimeout(() => {
    document.getElementById("childName").focus();
  }, 1000);
  document.getElementById("favourite").value = "";
  document.getElementById("highlight").value = "";
  document.getElementById("plans").value = "";

  updateNameSpans("child");

  // Reset body class to the initial step
  body.className = "step-1";
}

// Function to update all character spans
function updateCharacterSpans(characterName) {
  const characterSpans = document.querySelectorAll("span.character");
  characterSpans.forEach((span) => {
    span.textContent = characterName;
  });
}

// Function to update body class for the steps
function updateBodyClass(fromClass, toClass) {
  const body = document.body;
  body.classList.remove(fromClass);
  body.classList.add(toClass);
}

// Function to extract the letter content between @@ and $$
const extractLetterContent = (text) => {
  const afterStart = text.split("@@")[1] || text;
  const beforeEnd = afterStart.split("$$")[0];
  return beforeEnd.trim();
};

// Function to handle form submission
async function handleSubmit() {
  controller = new AbortController(); // Controller to cancel fetch
  const signal = controller.signal;

  const childName = document.getElementById("childName").value.trim();
  const character = document.getElementById("character").value;
  const favourite = document.getElementById("favourite").value.trim();
  const highlight = document.getElementById("highlight").value.trim();
  const plans = document.getElementById("plans").value.trim();
  const resultContainer = document.getElementById("resultContainer");

  if (!childName) {
    return;
  }

  // Construct the prompt
  let prompt = `Write a warm, magical letter to a child named ${childName}. `;
  prompt += `The child has chosen to receive a letter from ${character}, so please ensure the letter comes from him. `;
  prompt += favourite
    ? `${character} knows that ${childName} loves ${favourite} about the holiday season. `
    : "";
  prompt += highlight
    ? `${character} is very proud of ${childName} for ${highlight} this year. `
    : "";
  prompt += plans
    ? `${character} is excited to hear that ${childName} is planning to ${plans} next year.`
    : "";
  prompt += `Make sure the letter is engaging, exciting, personal but also short. Make sure you add a personal comment, a fun addition to each detail about ${childName}. They need to feel the letter is very personal and ${character} really understands ${childName}!`;

  // Call API to generate letter
  try {
    const response = await fetch(
      "https://letter-api.onrender.com/generate-letter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
        signal, // Pass signal to fetch for cancellation
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("THE CONTENT: ", data.letter);
      const generatedLetter = data.letter;
      const letterContent = extractLetterContent(generatedLetter);
      resultContainer.innerHTML = `<p>${letterContent}</p>`;
      resultContainer.style.display = "block";

      // Update to result state
      updateBodyClass("loading", "result");
    } else {
      // Update to error state
      updateBodyClass("loading", "error");
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Fetch request cancelled.");
    } else {
      // Update to error state
      updateBodyClass("loading", "error");
    }
  }
}

// Ensure DOM content is fully loaded before initializing
document.addEventListener("DOMContentLoaded", initialize);
