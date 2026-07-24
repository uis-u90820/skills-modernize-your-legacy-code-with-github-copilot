'use strict';

/**
 * Account Management System — Node.js port of the COBOL legacy application.
 *
 * Mirrors the three-module COBOL structure:
 *   DataProgram   (data.cob)       → data layer   (storageBalance, dataRead, dataWrite)
 *   Operations    (operations.cob) → service layer (getBalance, creditAccount, debitAccount)
 *   MainProgram   (main.cob)       → UI / menu loop
 *
 * Business rules preserved from the original COBOL application:
 *   - Initial balance is 1000.00.
 *   - Credit transactions have no upper limit (up to MAX_BALANCE).
 *   - Debit transactions are blocked when balance < requested amount (overdraft protection).
 *   - Balance precision is two decimal places (matches PIC 9(6)V99).
 *   - State is in-memory only; resets to 1000.00 on each run.
 */

const readline = require('readline');

// ---------------------------------------------------------------------------
// Data layer — mirrors DataProgram (data.cob)
// PIC 9(6)V99 → max value 999999.99
// ---------------------------------------------------------------------------
const MAX_BALANCE = 999999.99;
const INITIAL_BALANCE = 1000.00;
let storageBalance = INITIAL_BALANCE;

function dataRead() {
  return storageBalance;
}

function dataWrite(balance) {
  storageBalance = balance;
}

/** Resets balance to the initial value. Used by tests between cases (TC-012). */
function resetBalance() {
  storageBalance = INITIAL_BALANCE;
}

// ---------------------------------------------------------------------------
// Service layer — mirrors Operations (operations.cob)
// ---------------------------------------------------------------------------

function getBalance() {
  const balance = dataRead();
  console.log(`Current balance: ${balance.toFixed(2)}`);
}

function creditAccount(amount) {
  let balance = dataRead();
  const newBalance = Math.round((balance + amount) * 100) / 100;
  if (newBalance > MAX_BALANCE) {
    console.log(`Credit rejected: balance would exceed maximum allowed value of ${MAX_BALANCE.toFixed(2)}.`);
    return;
  }
  dataWrite(newBalance);
  console.log(`Amount credited. New balance: ${newBalance.toFixed(2)}`);
}

function debitAccount(amount) {
  const balance = dataRead();
  // Business rule: transaction is blocked when balance < amount (overdraft protection)
  if (balance >= amount) {
    const newBalance = Math.round((balance - amount) * 100) / 100;
    dataWrite(newBalance);
    console.log(`Amount debited. New balance: ${newBalance.toFixed(2)}`);
  } else {
    console.log('Insufficient funds for this debit.');
  }
}

// ---------------------------------------------------------------------------
// UI / menu loop — mirrors MainProgram (main.cob)
// ---------------------------------------------------------------------------

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // When stdin closes (e.g. piped input reaches EOF), exit gracefully.
  rl.on('close', () => {
    console.log('\nExiting the program. Goodbye!');
    process.exit(0);
  });

  function ask(question) {
    return new Promise((resolve) => rl.question(question, resolve));
  }

  async function promptAmount(label) {
    const raw = await ask(label);
    const value = parseFloat(raw);
    if (isNaN(value) || value < 0) {
      console.log('Invalid amount. Please enter a non-negative number.');
      return null;
    }
    return Math.round(value * 100) / 100;
  }
  let running = true;

  while (running) {
    console.log('--------------------------------');
    console.log('Account Management System');
    console.log('1. View Balance');
    console.log('2. Credit Account');
    console.log('3. Debit Account');
    console.log('4. Exit');
    console.log('--------------------------------');

    const choice = (await ask('Enter your choice (1-4): ')).trim();

    switch (choice) {
      case '1':
        getBalance();
        break;

      case '2': {
        const amount = await promptAmount('Enter credit amount: ');
        if (amount !== null) creditAccount(amount);
        break;
      }

      case '3': {
        const amount = await promptAmount('Enter debit amount: ');
        if (amount !== null) debitAccount(amount);
        break;
      }

      case '4':
        running = false;
        break;

      default:
        console.log('Invalid choice, please select 1-4.');
    }
  }

  console.log('Exiting the program. Goodbye!');
  rl.close();
}

// ---------------------------------------------------------------------------
// Exports — business logic available for unit testing
// ---------------------------------------------------------------------------
module.exports = {
  dataRead,
  dataWrite,
  resetBalance,
  getBalance,
  creditAccount,
  debitAccount,
  MAX_BALANCE,
  INITIAL_BALANCE,
};

// Only start the interactive menu when run directly (not when required by tests)
if (require.main === module) {
  main();
}
