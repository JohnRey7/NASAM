/**
 * Test file to demonstrate ApplicationService input sanitization
 * This file shows examples of valid and invalid inputs
 */

// Example 1: Valid name (will pass)
const validName = "Juan dela Cruz";
console.log("✅ Valid name:", validName);

// Example 2: Invalid name with numbers (will fail)
const invalidName = "Juan123 dela Cruz";
console.log("❌ Invalid name (contains numbers):", invalidName);

// Example 3: Invalid name with special symbols (will fail)
const invalidNameSymbols = "Juan@#$ dela Cruz";
console.log("❌ Invalid name (contains symbols):", invalidNameSymbols);

// Example 4: Valid address (will pass)
const validAddress = "123 Main St., Brgy. San Jose, Cebu City";
console.log("✅ Valid address:", validAddress);

// Example 5: Invalid address with special symbols (will fail)
const invalidAddress = "123 Main St. <script>alert('xss')</script>";
console.log("❌ Invalid address (contains unsafe characters):", invalidAddress);

// Example 6: Valid phone number (will pass)
const validPhone = "+63 912 345 6789";
console.log("✅ Valid phone:", validPhone);

// Example 7: Invalid phone number with letters (will fail)
const invalidPhone = "09123ABC456";
console.log("❌ Invalid phone (contains letters):", invalidPhone);

// Example 8: Valid numeric field (will pass)
const validAge = 25;
console.log("✅ Valid age:", validAge);

// Example 9: Invalid numeric field - out of range (will fail)
const invalidAge = 150;
console.log("❌ Invalid age (exceeds maximum):", invalidAge);

// Example 10: Invalid numeric field - not a number (will fail)
const invalidAgeString = "twenty five";
console.log("❌ Invalid age (not a number):", invalidAgeString);

console.log("\n====================================");
console.log("SANITIZATION RULES:");
console.log("====================================");
console.log("1. Names: Only letters, spaces, periods, hyphens, apostrophes");
console.log("2. Addresses: Letters, numbers, spaces, and basic punctuation (.,#()-/')");
console.log("3. Phone: Only digits and phone formatting characters (+,-,(),space)");
console.log("4. Email: Standard email format (letters, numbers, ._- @ . )");
console.log("5. Numbers: Must be valid numbers within specified ranges");
console.log("6. Ages: Parent ages 18-120, Sibling ages 0-100");
console.log("7. Grades: 1-5 for college, 65-100 for elementary/secondary");
console.log("8. Year levels: 1-7 for college years");
console.log("====================================");
