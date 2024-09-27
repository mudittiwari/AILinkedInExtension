import icon from "~/assets/icon.png";
import generate from "~/assets/generate.png";
import insert from "~/assets/insert.png";
import regenerate from "~/assets/regenerate.png";
import "~/assets/tailwind.css";
export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  main() {
    //using observer so that code is executed when full page is loaded
    const observer = new MutationObserver(() => {
      const messageBoxes = document.getElementsByClassName(
        "msg-form__msg-content-container--scrollable scrollable relative"
      );
      if (messageBoxes.length > 0) {
        let messageBox = messageBoxes[0];
        const handleClickOutside = (event: MouseEvent): void => {
          //adding or removing the AI Icon when messaage box is focused
          if (!messageBox.contains(event.target as Node)) {
            let icon = document.getElementById("ai-icon");
            if (icon) {
              messageBox.removeChild(icon);
            }
          } else {
            let AIIcon = document.getElementById("ai-icon");
            if (!AIIcon) {
              const icon = createAIIcon();
              icon.addEventListener("click", openModal);
              messageBox.appendChild(icon);
            }
          }
        };
        document.addEventListener("click", handleClickOutside);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
});

//creating AI Icon using the image from figma
const createAIIcon = (): HTMLImageElement => {
  const aiIcon = document.createElement("img") as HTMLImageElement;
  aiIcon.id = "ai-icon";
  aiIcon.src = icon;
  aiIcon.className = `
    absolute h-14 w-14 
    right-2 bottom-0 
    cursor-pointer
  `;
  return aiIcon;
};

const openModal = (): void => {
  const modal = createModal();
  document.body.appendChild(modal);
  //adding event listner to window for closing the modal when clicked outside the content area
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
  addPromptFieldEventListner();
  addGenerateButtonEventListner();
  addInsertButtonEventListner();
  addRegenerateButtonEventListner();
};

const addPromptFieldEventListner = (): void => {
  const generateBtn = document.getElementById(
    "generate-btn"
  ) as HTMLButtonElement;
  const inputField = document.getElementById("ai-command") as HTMLInputElement;
  if (generateBtn && inputField) {
    inputField.addEventListener("input", () => {
      if (inputField.value.trim()) {
        generateBtn.disabled = false;
        generateBtn.classList.remove("opacity-50", "cursor-not-allowed");
      } else {
        generateBtn.disabled = true;
        generateBtn.classList.add("opacity-50", "cursor-not-allowed");
      }
    });
  }
};

const addGenerateButtonEventListner = (): void => {
  document.getElementById("generate-btn")?.addEventListener("click", async () => {
    const userPrompt = (
      document.getElementById("ai-command") as HTMLInputElement
    ).value;

    if (userPrompt) {
      const chatContainer = document.getElementById("chat-container");

      // Create and append user message
      const userMessage = document.createElement("div");
      userMessage.className = `
        self-end p-3 rounded-lg max-w-[70%] break-words 
        bg-[#DFE1E7] text-[#666D80]
      `;
      userMessage.textContent = userPrompt;
      chatContainer?.appendChild(userMessage);

      // Create and append server message with loading animation
      const serverMessage = document.createElement("div");
      serverMessage.className = `
        self-start p-3 rounded-lg max-w-[70%] break-words 
        bg-[#DBEAFE] text-[#666D80] flex items-center
      `;
      const loadingDots = document.createElement("span");
      loadingDots.className = "loading-dots";
      loadingDots.innerHTML = `
        <span class="dot">.</span>
        <span class="dot">.</span>
        <span class="dot">.</span>
      `;
      serverMessage.appendChild(loadingDots);
      chatContainer?.appendChild(serverMessage);
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
      const generateBtn = document.getElementById("generate-btn") as HTMLButtonElement;
      const insertBtn = document.getElementById("insert-btn") as HTMLButtonElement;
      const regenerateBtn = document.getElementById("regenerate-btn") as HTMLButtonElement;

      generateBtn.classList.add("hidden");
      insertBtn.classList.remove("hidden");
      regenerateBtn.classList.remove("hidden");
      try {
        const response = await fetch('http://localhost:5000/prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: userPrompt }),
        });
        const data = await response.json();
        const serverResponse = data.message;
        serverMessage.textContent = serverResponse;
      } catch (error) {
        serverMessage.textContent = "Error while connecting to the server.";
      }
      (document.getElementById("ai-command") as HTMLInputElement).value = "";
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
    }
  });
};


const addInsertButtonEventListner = (): void => {
  document.getElementById("insert-btn")?.addEventListener("click", () => {

    const chatContainer = document.getElementById("chat-container");
    const serverMessages = chatContainer?.querySelectorAll(".self-start");

    if (serverMessages && serverMessages.length > 0) {
      const lastServerMessage =
        serverMessages[serverMessages.length - 1].textContent;

      if (lastServerMessage) {

        const messageBox = document.getElementsByClassName(
          "msg-form__contenteditable t-14 t-black--light t-normal flex-grow-1 full-height notranslate"
        )[0] as HTMLElement;

        if (messageBox) {
          const pTag = messageBox.querySelector("p");

          if (pTag) {
            pTag.textContent = lastServerMessage;
            const placeholderDiv = document.querySelector(
              ".msg-form__placeholder"
            );
            if (placeholderDiv) {
              placeholderDiv.classList.remove("msg-form__placeholder");
            }
            const modal = document.getElementById("ai-modal");
            if (modal) {
              modal.remove();
            }
          } else {
            console.error("No <p> tag found inside the message box");
          }
        } else {
          console.error("Message box not found");
        }
      }
    }
  });
};


const addRegenerateButtonEventListner = (): void => {
  document.getElementById("regenerate-btn")?.addEventListener("click", async () => {
    const userPrompt = (
      document.getElementById("ai-command") as HTMLInputElement
    ).value;

    if (userPrompt) {
      const chatContainer = document.getElementById("chat-container");

      // Create and append user message
      const userMessage = document.createElement("div");
      userMessage.className = `
        self-end p-3 rounded-lg max-w-[70%] break-words 
        bg-[#DFE1E7] text-[#666D80]
      `;
      userMessage.textContent = userPrompt;
      chatContainer?.appendChild(userMessage);

      // Create and append server message with loading animation
      const serverMessage = document.createElement("div");
      serverMessage.className = `
        self-start p-3 rounded-lg max-w-[70%] break-words 
        bg-[#DBEAFE] text-[#666D80] flex items-center
      `;
      const loadingDots = document.createElement("span");
      loadingDots.className = "loading-dots";
      loadingDots.innerHTML = `
        <span class="dot">.</span>
        <span class="dot">.</span>
        <span class="dot">.</span>
      `;
      serverMessage.appendChild(loadingDots);
      chatContainer?.appendChild(serverMessage);
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
      try {
        const response = await fetch('http://localhost:5000/prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: userPrompt }),
        });
        if (response.ok) {
          const data = await response.json();
          const serverResponse = data.message || "Server response here";
          serverMessage.textContent = serverResponse;
        } else {
          serverMessage.textContent = "Failed to get response from the server.";
        }
      } catch (error) {
        serverMessage.textContent = "Error while connecting to the server.";
      }
      (document.getElementById("ai-command") as HTMLInputElement).value = "";
      chatContainer?.scrollTo(0, chatContainer.scrollHeight);
    }
  });
};


const createModal = (): HTMLElement => {
  const modal = document.createElement("div");
  modal.id = "ai-modal";
  modal.className =
    "fixed inset-0 w-full h-full z-[100] bg-black bg-opacity-50 flex justify-center items-center";
  const modalContent = document.createElement("div");
  modalContent.className = `p-6 rounded-lg shadow-lg space-y-4 w-1/2`;
  modalContent.style.cssText = `
    background-color:#F9FAFB;  
  `;
  modalContent.innerHTML = `
  <div id="chat-container" class="flex flex-col space-y-4 mb-4 overflow-y-auto max-h-72"></div>
    <input id="ai-command" type="text" style="outline:none;border:0px solid black;" placeholder="Your Promt" class="w-full p-2 rounded-md" />
    <div class="flex space-x-2 justify-end w-full">
      <button id="generate-btn" disabled class="bg-[#3B82F6] pl-[30px] bg-no-repeat bg-[length:15px] text-white py-2 px-4 rounded cursor-not-allowed opacity-50" style="
        background-image: url(${generate});
        background-position: left 10px center;
      ">Generate</button>

      <button id="insert-btn" class="bg-white text-[#666D80] pl-[30px] bg-no-repeat bg-[length:15px] hidden py-2 px-4 rounded focus:outline-none" style="
        background-image: url(${insert});
        background-position: left 10px center;
        border:1px solid #666D80;
      ">Insert</button>

      <button id="regenerate-btn" class="bg-[#3B82F6] bg-no-repeat bg-[length:15px] pl-[30px] hidden text-white py-2 px-4 rounded" style="
        background-image: url(${regenerate});
        background-position: left 10px center;
      ">Regenerate</button>
    </div>
`;

  modal.appendChild(modalContent);
  return modal;
};
