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

  console.log("Options:");
  console.log("1. List and select servers to leave");
  console.log("2. Leave server by ID from file");
  console.log("3. Leave all servers");
  console.log("4. Leave server by invite link");
  console.log("5. Leave servers by invite links from file");

  const processChoice = await question("\nSelect a process to perform (1/2/3/4/5): ");

  if (!["1", "2", "3", "4", "5"].includes(processChoice)) {
    console.log("❌ Invalid process choice. Exiting...");
    rl.close();
    process.exit();
  }

  console.log("\nOptions:");
  console.log("1. Single account");
  console.log("2. All accounts");

  const accountChoice = await question("\nSelect an option for accounts (1/2): ");

  if (accountChoice === "1") {
    console.log("Available Accounts:");
    accounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name || `Account ${index + 1}`}`);
    });

    const selectedAccountIndex = await question("\nSelect an account by number: ");
    const selectedIndex = parseInt(selectedAccountIndex, 10) - 1;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= accounts.length) {
      console.log("❌ Invalid selection. Exiting...");
      rl.close();
      process.exit();
    }

    const selectedAccount = accounts[selectedIndex];
    console.log(`\nSelected Account: ${selectedAccount.name || `Account ${selectedIndex + 1}`}`);
    await processAccount(selectedAccount.token, processChoice);
  } else if (accountChoice === "2") {
    console.log("\nProcessing all accounts...");
    for (const account of accounts) {
      console.log(`\nProcessing Account: ${account.name || `Account`}`);
      await processAccount(account.token, processChoice);
    }
    console.log("\nFinished processing all accounts.");
    rl.close();
    process.exit();
  } else {
    console.log("❌ Invalid account choice. Exiting...");
    rl.close();
    process.exit();
  }
})();

// Function to process a single account
async function processAccount(token, processChoice) {
  const client = new Client({
    checkUpdate: false,
  });

  return new Promise((resolve) => {
    client.on("ready", async () => {
      console.log(`\nLogged in as ${client.user.tag}!`);

      if (processChoice === "1") {
        await handleServerSelection(client);
      } else if (processChoice === "2") {
        await handleLeaveByIDFromFile(client);
      } else if (processChoice === "3") {
        await handleLeaveAllServers(client);
      } else if (processChoice === "4") {
        await handleLeaveByInviteLink(client);
      } else if (processChoice === "5") {
        await handleLeaveByInviteLinkFromFile(client);
      } else {
        console.log("Invalid choice. Skipping...");
      }

      client.destroy();
      resolve();
    });

    client.login(token).catch((error) => {
      console.error(`❌ Failed to login with token: ${error.message}`);
      resolve();
    });
  });
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
}

// Function to leave servers by ID from file
async function handleLeaveByIDFromFile(client) {
  const filePath = "serverid.txt";

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File "${filePath}" not found. Please create it and add server IDs.`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const idsToLeave = fileContent.split("\n").map((id) => id.trim()).filter(Boolean);

  if (idsToLeave.length === 0) {
    console.log(`❌ No valid server IDs found in "${filePath}".`);
    return;
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
}

// Function to leave a server using an invite link
async function handleLeaveByInviteLink(client) {
  const inviteLink = await question("\nEnter the invite link: ");
  const inviteCode = inviteLink.split("/").pop();

  try {
    const invite = await client.fetchInvite(inviteCode);
    const guildId = invite.guild.id;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.log(`❌ You are not a member of the server: ${invite.guild.name}`);
    } else {
      await guild.leave();
      console.log(`✅ Successfully left server: ${invite.guild.name}`);
    }
  } catch (error) {
    console.error(`❌ Failed to process invite link: ${error.message}`);
  }
}

// Function to leave servers using invite links from a file
async function handleLeaveByInviteLinkFromFile(client) {
  const filePath = "invitelink.txt";

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File "${filePath}" not found. Please create it and add invite links.`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const inviteLinks = fileContent.split("\n").map((link) => link.trim()).filter(Boolean);

  if (inviteLinks.length === 0) {
    console.log(`❌ No valid invite links found in "${filePath}".`);
    return;
  }

  console.log("\nStarting to leave servers using invite links...");
  for (let i = 0; i < inviteLinks.length; i++) {
    const inviteLink = inviteLinks[i];
    const inviteCode = inviteLink.split("/").pop();

    try {
      const invite = await client.fetchInvite(inviteCode);
      const guildId = invite.guild.id;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) {
        console.log(`❌ You are not a member of the server: ${invite.guild.name}`);
      } else {
        await guild.leave();
        console.log(`✅ Successfully left server: ${invite.guild.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to process invite link (${inviteLink}): ${error.message}`);
    }

    if (i < inviteLinks.length - 1) {
      await delay(LEAVE_DELAY);
    }
  }

  console.log("\nFinished processing invite links.");
}

// Function to leave all servers
async function handleLeaveAllServers(client) {
  const servers = Array.from(client.guilds.cache.values());

  if (servers.length === 0) {
    console.log("\nYou are not a member of any servers.");
    rl.close();
    process.exit();
  }

  console.log("\nStarting to leave all servers...");
  for (let i = 0; i < servers.length; i++) {
    const guild = servers[i];

    try {
      await guild.leave();
      console.log(`✅ Successfully left server: ${guild.name}`);
    } catch (error) {
      console.error(`❌ Failed to leave server: ${guild.name} (ID: ${guild.id}):`, error);
    }

    if (i < servers.length - 1) {
      await delay(LEAVE_DELAY);
    }
  }

  console.log("\nFinished leaving all servers.");
  rl.close();
  process.exit();
}
