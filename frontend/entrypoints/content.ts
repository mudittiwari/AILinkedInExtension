import icon from "~/assets/icon.png";
import generate from "~/assets/generate.png";
import insert from "~/assets/insert.png";
import regenerate from "~/assets/regenerate.png";
import micIconImage from "~/assets/mic.png";
import "~/assets/tailwind.css";
export default defineContentScript({
  matches: ["*://*.linkedin.com/*"],
  main() {
    // Using observer so that code is executed when the full page is loaded
    const observer = new MutationObserver(() => {
      const messageBoxes = document.getElementsByClassName(
        "msg-form__msg-content-container--scrollable scrollable relative"
      );
      if (messageBoxes.length > 0) {
        let messageBox = messageBoxes[0];
        const handleClickOutside = (event: MouseEvent): void => {
          // Adding or removing the AI and mic icons when the message box is focused
          if (!messageBox.contains(event.target as Node)) {
            let aiIcon = document.getElementById("ai-icon");
            let micIcon = document.getElementById("mic-icon-wrapper");
            if (aiIcon) {
              messageBox.removeChild(aiIcon);
            }
            if (micIcon) {
              messageBox.removeChild(micIcon);
            }
          } else {
            let AIIcon = document.getElementById("ai-icon");
            let micIcon = document.getElementById("mic-icon-wrapper");
            if (!AIIcon) {
              const aiIconElement = createAIIcon();
              aiIconElement.addEventListener("click", openModal);
              messageBox.appendChild(aiIconElement);
            }
            if (!micIcon) {
              const micIconElement = createMicIcon();
              messageBox.appendChild(micIconElement);
              addMicButtonEventListner();
            }
          }
        };
        document.addEventListener("click", handleClickOutside);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
});

// Creating AI Icon using the image from Figma
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

// Creating Mic Icon
const createMicIcon = (): HTMLDivElement => {
  const micIconWrapper = document.createElement("div") as HTMLDivElement;
  micIconWrapper.id = "mic-icon-wrapper";
  micIconWrapper.className = `
    absolute h-[27px] w-[27px]
    right-16 bottom-[7px]
    rounded-full bg-white flex items-center justify-center
    shadow-md cursor-pointer
  `;
  const micIcon = document.createElement("img") as HTMLImageElement;
  micIcon.id = "mic-icon";
  micIcon.src = micIconImage;
  micIcon.className = `h-6 w-6`;
  micIconWrapper.appendChild(micIcon);

  return micIconWrapper;
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
  restoreMessagesFromSession();
  addPromptFieldEventListner();
  addGenerateButtonEventListner();
  addInsertButtonEventListner();
  addRegenerateButtonEventListner();
};

const addPromptFieldEventListner = (): void => {
  showHideGenerateButton();
};

const showHideGenerateButton = (): void => {
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
  document
    .getElementById("generate-btn")
    ?.addEventListener("click", async () => {
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
        const generateBtn = document.getElementById(
          "generate-btn"
        ) as HTMLButtonElement;
        const insertBtn = document.getElementById(
          "insert-btn"
        ) as HTMLButtonElement;
        const regenerateBtn = document.getElementById(
          "regenerate-btn"
        ) as HTMLButtonElement;

        insertBtn.classList.remove("hidden");
        regenerateBtn.classList.remove("hidden");
        try {
          const response = await fetch("https://ailinkedinextension.onrender.com/prompt", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt: userPrompt }),
          });
          const data = await response.json();
          const serverResponse = data.message;
          serverMessage.textContent = serverResponse;
        } catch (error) {
          serverMessage.textContent = "Error while connecting to the server.";
        }
        if (serverMessage.textContent) {
          saveMessagesToSession(userPrompt, serverMessage.textContent);
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
  document
    .getElementById("regenerate-btn")
    ?.addEventListener("click", async () => {
      const userPrompt = (
        document.getElementById("ai-command") as HTMLInputElement
      ).value;

      if (userPrompt) {
        const chatContainer = document.getElementById("chat-container");

        const serverMessages = chatContainer?.querySelectorAll(".self-start");
        let lastServerMessage = "";
        if (serverMessages && serverMessages.length > 0) {
          lastServerMessage =
            serverMessages[serverMessages.length - 1].textContent || "";
        }
        const userMessage = document.createElement("div");
        userMessage.className = `
        self-end p-3 rounded-lg max-w-[70%] break-words 
        bg-[#DFE1E7] text-[#666D80]
      `;
        userMessage.textContent = userPrompt;
        chatContainer?.appendChild(userMessage);
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
          const response = await fetch("https://ailinkedinextension.onrender.com/prompt", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: lastServerMessage + "........" + userPrompt,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            const serverResponse = data.message || "Server response here";
            serverMessage.textContent = serverResponse;
          } else {
            serverMessage.textContent =
              "Failed to get response from the server.";
          }
        } catch (error) {
          serverMessage.textContent = "Error while connecting to the server.";
        }
        if (serverMessage.textContent) {
          saveMessagesToSession(userPrompt, serverMessage.textContent);
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
  modalContent.className = `p-6 rounded-lg shadow-lg space-y-4 w-1/2 min-w-[350px]`;
  modalContent.style.cssText = `
    background-color:#F9FAFB;  
  `;
  modalContent.innerHTML = `
  <div id="chat-container" class="flex flex-col space-y-4 mb-4 overflow-y-auto max-h-72"></div>
    <div class="flex justify-between">
    <input id="ai-command" type="text" style="outline:none;border:0px solid black;" placeholder="Your Promt" class="p-2 rounded-md w-full mr-3" />
     <button title="Press and hold for recording audio." id="mic-btn" class="bg-gray-200 rounded-full p-2 w-[32px] flex justify-center items-center">
        <img src="${micIconImage}" alt="Mic" class="w-6 h-6" />
      </button>
    </div>
    <div class="flex space-x-2 justify-end w-full">
      <button title="Use for starting new conversation" id="generate-btn" disabled class="bg-[#3B82F6] pl-[30px] bg-no-repeat bg-[length:15px] text-white py-2 px-4 rounded cursor-not-allowed opacity-50" style="
        background-image: url(${generate});
        background-position: left 10px center;
      ">Generate</button>

      <button title="Use for inserting last server message into chat" id="insert-btn" class="bg-white text-[#666D80] pl-[30px] bg-no-repeat bg-[length:15px] hidden py-2 px-4 rounded focus:outline-none" style="
        background-image: url(${insert});
        background-position: left 10px center;
        border:1px solid #666D80;
      ">Insert</button>

      <button title="Use for using last message for next conversation" id="regenerate-btn" class="bg-[#3B82F6] bg-no-repeat bg-[length:15px] pl-[30px] hidden text-white py-2 px-4 rounded" style="
        background-image: url(${regenerate});
        background-position: left 10px center;
      ">Regenerate</button>
    </div>
`;

  modal.appendChild(modalContent);

  const micBtn = modalContent.querySelector("#mic-btn") as HTMLButtonElement;
  const aiCommandInput = modalContent.querySelector(
    "#ai-command"
  ) as HTMLInputElement;
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    micBtn.addEventListener("mousedown", () => {
      recognition.start();
    });

    micBtn.addEventListener("mouseup", () => {
      recognition.stop();
    });
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      aiCommandInput.value += transcript;
      const inputEvent = new Event("input", { bubbles: true });
      aiCommandInput.dispatchEvent(inputEvent);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
    };
  } else {
    console.error("Speech recognition not supported in this browser.");
  }
  return modal;
};

const addMicButtonEventListner = (): void => {
  let micIcon = document.getElementById("mic-icon-wrapper");
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;
  if (micIcon) {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      micIcon.addEventListener("mousedown", () => {
        recognition.start();
      });

      micIcon.addEventListener("mouseup", () => {
        recognition.stop();
      });
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const messageBox = document.getElementsByClassName(
          "msg-form__contenteditable t-14 t-black--light t-normal flex-grow-1 full-height notranslate"
        )[0] as HTMLElement;

        if (messageBox) {
          const pTag = messageBox.querySelector("p");

          if (pTag) {
            pTag.textContent = transcript;
            const placeholderDiv = document.querySelector(
              ".msg-form__placeholder"
            );
            if (placeholderDiv) {
              placeholderDiv.classList.remove("msg-form__placeholder");
            }
          }
        }
      };
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
      };
    } else {
      console.error("Speech recognition not supported in this browser.");
    }
  }
};

const saveMessagesToSession = (
  userMessage: string,
  serverMessage: string
): void => {
  let chatHistory = JSON.parse(sessionStorage.getItem("chatHistory") || "[]");
  chatHistory.push({ userMessage, serverMessage });
  sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
};

const restoreMessagesFromSession = (): void => {
  const chatHistory = JSON.parse(sessionStorage.getItem("chatHistory") || "[]");
  const chatContainer = document.getElementById("chat-container");
  chatHistory.forEach(
    ({
      userMessage,
      serverMessage,
    }: {
      userMessage: string;
      serverMessage: string;
    }) => {
      const userMessageDiv = document.createElement("div");
      userMessageDiv.className = `
      self-end p-3 rounded-lg max-w-[70%] break-words 
      bg-[#DFE1E7] text-[#666D80]
    `;
      userMessageDiv.textContent = userMessage;
      chatContainer?.appendChild(userMessageDiv);
      const serverMessageDiv = document.createElement("div");
      serverMessageDiv.className = `
      self-start p-3 rounded-lg max-w-[70%] break-words 
      bg-[#DBEAFE] text-[#666D80]
    `;
      serverMessageDiv.textContent = serverMessage;
      chatContainer?.appendChild(serverMessageDiv);
    }
  );

  chatContainer?.scrollTo(0, chatContainer.scrollHeight);
};
