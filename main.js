const { Client } = require("discord.js-selfbot-v13");
const readline = require("readline");
const fs = require("fs");
const banner = require("./config/banner");

// Constants
const LEAVE_DELAY = 5000; // 5 seconds delay between each leave
const ACCOUNTS_FILE = "accounts.json"; // File to store account tokens

// Display banner when program starts
console.log(banner);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Utility function for delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Promise wrapper for readline question
function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Function to clear console and move cursor to top
function clearConsole() {
  console.clear();
  process.stdout.write("\x1B[0f");
  console.log(banner);
}

// Load account tokens from file
function loadAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    console.log(`❌ File "${ACCOUNTS_FILE}" not found. Create it with account tokens.`);
    process.exit();
  }

  const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf-8"));
  if (!Array.isArray(accounts) || accounts.length === 0) {
    console.log(`❌ No valid accounts found in "${ACCOUNTS_FILE}".`);
    process.exit();
  }
  return accounts;
}

// Start the program
(async function () {
  const accounts = loadAccounts();
  console.log("Available Accounts:");
  accounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.name || `Account ${index + 1}`}`);
  });

  const choice = await question("\nSelect an account by number: ");
  const selectedIndex = parseInt(choice, 10) - 1;

  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= accounts.length) {
    console.log("❌ Invalid selection. Exiting...");
    rl.close();
    process.exit();
  }

  const selectedAccount = accounts[selectedIndex];
  console.log(`\nSelected Account: ${selectedAccount.name || `Account ${selectedIndex + 1}`}`);
  startClient(selectedAccount.token);
})();

// Function to start Discord client for the selected account
function startClient(token) {
  const client = new Client({
    checkUpdate: false,
  });

  client.on("ready", async () => {
    console.log(`\nLogged in as ${client.user.tag}!`);
    console.log("Select an option:\n1. List and select servers to leave\n2. Leave server by ID from file");

    const option = await question("\nEnter your choice (1/2): ");

    if (option === "1") {
      await handleServerSelection(client);
    } else if (option === "2") {
      await handleLeaveByIDFromFile(client);
    } else {
      console.log("Invalid choice. Exiting...");
      rl.close();
      process.exit();
    }
  });

  client.login(token);
}

// Function to handle server selection
async function handleServerSelection(client) {
  const servers = Array.from(client.guilds.cache.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((guild, index) => ({
      index: index + 1,
      id: guild.id,
      name: guild.name,
      joinedAt: guild.joinedAt.toDateString(),
    }));

  console.log("\nServers:");
  servers.forEach((server) => {
    console.log(`${server.index}. ${server.name} (ID: ${server.id})`);
  });

  const serverIDs = await question("\nEnter the IDs of servers to leave (comma-separated): ");
  const idsToLeave = serverIDs.split(",").map((id) => id.trim());

  console.log("\nStarting server leave process...");
  for (let i = 0; i < idsToLeave.length; i++) {
    const id = idsToLeave[i];
    const guild = client.guilds.cache.get(id);

    if (guild) {
      try {
        await guild.leave();
        console.log(`✅ Successfully left server: ${guild.name}`);
      } catch (error) {
        console.error(`❌ Failed to leave server with ID ${id}:`, error);
      }
    } else {
      console.log(`❌ Server with ID ${id} not found or already left.`);
    }

    if (i < idsToLeave.length - 1) {
      await delay(LEAVE_DELAY);
    }
  }

  console.log("\nFinished.");
  rl.close();
  process.exit();
}

// Function to leave servers by ID from file
async function handleLeaveByIDFromFile(client) {
  const filePath = "serverid.txt";

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File "${filePath}" not found. Please create it and add server IDs.`);
    rl.close();
    process.exit();
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const idsToLeave = fileContent.split("\n").map((id) => id.trim()).filter(Boolean);

  if (idsToLeave.length === 0) {
    console.log(`❌ No valid server IDs found in "${filePath}".`);
    rl.close();
    process.exit();
  }

  console.log("\nStarting server leave process...");
  for (let i = 0; i < idsToLeave.length; i++) {
    const id = idsToLeave[i];
    const guild = client.guilds.cache.get(id);

    if (guild) {
      try {
        await guild.leave();
        console.log(`✅ Successfully left server: ${guild.name}`);
      } catch (error) {
        console.error(`❌ Failed to leave server with ID ${id}:`, error);
      }
    } else {
      console.log(`❌ Server with ID ${id} not found or already left.`);
    }

    if (i < idsToLeave.length - 1) {
      await delay(LEAVE_DELAY);
    }
  }

  console.log("\nFinished.");
  rl.close();
  process.exit();
}
