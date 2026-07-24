# Test Plan — Account Management System

## Scope

This test plan covers all business logic in the COBOL Account Management System (`main.cob`, `operations.cob`, `data.cob`). It is intended to be reviewed with business stakeholders and later used as the basis for unit and integration tests in a Node.js implementation.

---

## Test Cases

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
|---|---|---|---|---|---|---|---|
| TC-001 | Display initial balance on first run | Application has just started; no prior transactions | 1. Launch the application. 2. Select option **1 (View Balance)**. | Balance displayed is `1000.00` | | | Initial balance is hardcoded to `1000.00` in `operations.cob` and `data.cob` |
| TC-002 | Menu displays all four options | Application is running | 1. Launch the application. | Menu shows options 1 (View Balance), 2 (Credit Account), 3 (Debit Account), 4 (Exit) | | | |
| TC-003 | Invalid menu choice shows error message | Application is running at the main menu | 1. Enter any value other than 1–4 (e.g. `9`). | Message `"Invalid choice, please select 1-4."` is displayed; menu is shown again | | | Application must not crash or exit on invalid input |
| TC-004 | Credit account with a positive amount | Application is running; current balance is `1000.00` | 1. Select option **2 (Credit Account)**. 2. Enter `500`. 3. Select option **1 (View Balance)**. | New balance is `1500.00`; message `"Amount credited. New balance: 001500.00"` is shown | | | |
| TC-005 | Credit account with a zero amount | Application is running; current balance is `1000.00` | 1. Select option **2 (Credit Account)**. 2. Enter `0`. 3. Select option **1 (View Balance)**. | Balance remains `1000.00`; credit of zero is accepted without error | | | Edge case — validate zero-value credit behaviour in Node.js implementation |
| TC-006 | Credit account with the maximum allowed amount | Application is running; current balance is `0.00` | 1. Select option **2 (Credit Account)**. 2. Enter `999999.99`. 3. Select option **1 (View Balance)**. | Balance is `999999.99`; no overflow or error occurs | | | `PIC 9(6)V99` supports a maximum of `999999.99` |
| TC-007 | Debit account with sufficient funds | Application is running; current balance is `1000.00` | 1. Select option **3 (Debit Account)**. 2. Enter `200`. 3. Select option **1 (View Balance)**. | New balance is `800.00`; message `"Amount debited. New balance: 000800.00"` is shown | | | |
| TC-008 | Debit account with exact balance (boundary) | Application is running; current balance is `1000.00` | 1. Select option **3 (Debit Account)**. 2. Enter `1000.00`. 3. Select option **1 (View Balance)**. | Balance becomes `0.00`; transaction is accepted | | | Validates the `FINAL-BALANCE >= AMOUNT` boundary condition (equal case) |
| TC-009 | Debit account with insufficient funds | Application is running; current balance is `1000.00` | 1. Select option **3 (Debit Account)**. 2. Enter `1500`. | Message `"Insufficient funds for this debit."` is displayed; balance remains `1000.00` | | | Core overdraft-protection business rule |
| TC-010 | Debit account with a zero amount | Application is running; current balance is `1000.00` | 1. Select option **3 (Debit Account)**. 2. Enter `0`. 3. Select option **1 (View Balance)**. | Balance remains `1000.00`; debit of zero is accepted without error | | | Edge case — validate zero-value debit behaviour in Node.js implementation |
| TC-011 | Balance persists across multiple operations in the same session | Application is running; initial balance is `1000.00` | 1. Select option **2** and credit `300`. 2. Select option **3** and debit `100`. 3. Select option **1** to view balance. | Balance is `1200.00` after both operations | | | Validates in-session state persistence via `DataProgram` |
| TC-012 | Balance resets to `1000.00` on program restart | A prior session modified the balance | 1. Exit the application (option 4). 2. Restart the application. 3. Select option **1 (View Balance)**. | Balance is `1000.00` (reset to initial value) | | | No file/database persistence — state is in-memory only |
| TC-013 | Multiple sequential credits accumulate correctly | Application is running; initial balance is `1000.00` | 1. Credit `100`. 2. Credit `200`. 3. Credit `300`. 4. View balance. | Balance is `1600.00` | | | |
| TC-014 | Multiple sequential debits reduce balance correctly | Application is running; initial balance is `1000.00` | 1. Debit `100`. 2. Debit `200`. 3. Debit `300`. 4. View balance. | Balance is `400.00` | | | |
| TC-015 | Debit blocked after balance reaches zero | Application is running; current balance is `0.00` (achieved by debiting full balance) | 1. Credit `500`. 2. Debit `500`. 3. Attempt to debit `1`. | Message `"Insufficient funds for this debit."` is displayed; balance remains `0.00` | | | Validates overdraft protection when balance is exactly zero |
| TC-016 | Exit option terminates the application | Application is running at the main menu | 1. Select option **4 (Exit)**. | Message `"Exiting the program. Goodbye!"` is displayed; application terminates cleanly | | | |
| TC-017 | Menu re-displays after each completed operation | Application is running | 1. Select option **1**. 2. Observe behaviour after the result is displayed. | Main menu is displayed again after the operation completes | | | Validates the `PERFORM UNTIL` loop in `MainProgram` |

---

## Notes for Node.js Migration

- **No persistence layer:** The COBOL implementation holds balance state in working storage only. The Node.js implementation should decide whether to persist state to a file, database, or in-memory store.
- **Operation codes use trailing spaces:** `TOTAL ` and `DEBIT ` are 6-character padded strings. The Node.js implementation should use plain string constants (e.g. `'TOTAL'`, `'DEBIT'`) without padding.
- **Balance precision:** `PIC 9(6)V99` maps to a two-decimal-place number with a maximum of `999999.99`. Use a fixed-point or `decimal` library in Node.js to avoid floating-point rounding errors.
- **Overdraft rule:** `FINAL-BALANCE >= AMOUNT` must be implemented as a strict comparison in the Node.js service layer.
