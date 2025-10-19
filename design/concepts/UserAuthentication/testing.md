[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: UserAuthentication
# response:

# file: src/UserAuthentication/UserAuthentication.test.ts

```typescript
import { assertEquals, assertNotEquals, assert } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthenticationConcept from "./UserAuthentication.ts";
import { ID } from "@utils/types.ts";

Deno.test("Principle: Registration, successful login, and rejection of duplicate registration", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    console.log("\n--- Principle Trace: Registration and Login ---");

    // 1. User registers with a unique username and password
    console.log("Action: Registering user 'alice' with password 'password123'");
    const registerResult1 = await concept.register({
      username: "alice",
      password: "password123",
    });
    assert(registerResult1 && "userId" in registerResult1, "Alice registration should succeed");
    const aliceId = registerResult1.userId;
    console.log(`Effect: Alice registered with userId: ${aliceId}`);

    // Verify user exists in state
    const userAlice = await concept.users.findOne({ _id: aliceId });
    assert(userAlice !== null, "Alice should be found in the database.");
    assertEquals(userAlice?.username, "alice");

    // 2. User attempts to register with an existing username (should be rejected)
    console.log("Action: Attempting to register 'alice' again with password 'newpass'");
    const registerResult2 = await concept.register({
      username: "alice",
      password: "newpass",
    });
    assert("error" in registerResult2, "Duplicate Alice registration should be rejected");
    assertEquals(registerResult2.error, "Username already exists.");
    console.log(`Effect: Duplicate registration rejected with error: ${registerResult2.error}`);

    // 3. User logs in with correct credentials
    console.log("Action: Logging in user 'alice' with password 'password123'");
    const loginResult1 = await concept.login({
      username: "alice",
      password: "password123",
    });
    assert(loginResult1 && "userId" in loginResult1, "Alice login should succeed");
    assertEquals(loginResult1.userId, aliceId);
    console.log(`Effect: Alice logged in successfully. userId: ${loginResult1.userId}`);

    // 4. User attempts to login with incorrect password
    console.log("Action: Attempting to login 'alice' with incorrect password 'wrongpass'");
    const loginResult2 = await concept.login({
      username: "alice",
      password: "wrongpass",
    });
    assert("error" in loginResult2, "Login with incorrect password should fail");
    assertEquals(loginResult2.error, "Invalid username or password.");
    console.log(`Effect: Login with incorrect password rejected with error: ${loginResult2.error}`);

    console.log("--- End Principle Trace ---");
  } finally {
    await client.close();
  }
});

Deno.test("Action: register - successful registration", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    const username = "testuser";
    const password = "securepassword";
    console.log(`Action: Calling register for username '${username}'`);
    const result = await concept.register({ username, password });

    assert("userId" in result, "Register should return a userId");
    const userId = result.userId;
    assertNotEquals(userId, null, "userId should not be null");

    // Verify effects: user created in DB
    const user = await concept.users.findOne({ _id: userId });
    assert(user !== null, "User should be found in the database");
    assertEquals(user?.username, username);
    assertNotEquals(user?.password, password, "Password should be hashed");
    assert(user?.createdAt instanceof Date, "createdAt should be a Date object");
    console.log(`Effect: User '${username}' registered with ID '${userId}' and stored in DB.`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: register - empty username requirement", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    console.log("Action: Calling register with empty username");
    const result = await concept.register({ username: "", password: "password" });
    assert("error" in result, "Register should return an error for empty username");
    assertEquals(result.error, "Username cannot be empty.");
    console.log(`Effect: Registration rejected with error: ${result.error}`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: register - empty password requirement", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    console.log("Action: Calling register with empty password");
    const result = await concept.register({ username: "bob", password: "" });
    assert("error" in result, "Register should return an error for empty password");
    assertEquals(result.error, "Password cannot be empty.");
    console.log(`Effect: Registration rejected with error: ${result.error}`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: register - duplicate username requirement", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    const username = "duplicateuser";
    await concept.register({ username, password: "pass1" }); // First successful registration
    console.log(`Action: Calling register for username '${username}' (duplicate)`);
    const result = await concept.register({ username, password: "pass2" }); // Attempt duplicate

    assert("error" in result, "Register should return an error for duplicate username");
    assertEquals(result.error, "Username already exists.");
    console.log(`Effect: Registration rejected with error: ${result.error}`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: login - successful login", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    const username = "loginuser";
    const password = "loginpass";
    const { userId } = await concept.register({ username, password }) as { userId: ID };
    console.log(`Action: Calling login for username '${username}'`);
    const result = await concept.login({ username, password });

    assert("userId" in result, "Login should return a userId");
    assertEquals(result.userId, userId, "Returned userId should match registered userId");
    console.log(`Effect: User '${username}' logged in successfully.`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: login - non-existent username", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    console.log("Action: Calling login for non-existent username 'nouser'");
    const result = await concept.login({ username: "nouser", password: "anypass" });
    assert("error" in result, "Login should return an error for non-existent user");
    assertEquals(result.error, "Invalid username or password.");
    console.log(`Effect: Login rejected with error: ${result.error}`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: login - incorrect password", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    const username = "badpassuser";
    await concept.register({ username, password: "correctpass" });
    console.log(`Action: Calling login for '${username}' with incorrect password`);
    const result = await concept.login({ username, password: "wrongpass" });
    assert("error" in result, "Login should return an error for incorrect password");
    assertEquals(result.error, "Invalid username or password.");
    console.log(`Effect: Login rejected with error: ${result.error}`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: changePassword - successful password change", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    const username = "changepassuser";
    const oldPassword = "oldpassword";
    const newPassword = "newsecurepassword";
    const { userId } = await concept.register({ username, password: oldPassword }) as { userId: ID };

    // Verify old password works
    const loginOld = await concept.login({ username, password: oldPassword });
    assert("userId" in loginOld, "Login with old password should succeed initially");

    console.log(`Action: Changing password for user '${username}' (ID: ${userId})`);
    const changeResult = await concept.changePassword({ userId, oldPassword, newPassword });
    assert(!("error" in changeResult), "Change password should not return an error");

    // Verify effects: old password no longer works
    const loginAfterChangeOld = await concept.login({ username, password: oldPassword });
    assert("error" in loginAfterChangeOld, "Login with old password should fail after change");
    assertEquals(loginAfterChangeOld.error, "Invalid username or password.");

    // Verify effects: new password works
    const loginAfterChangeNew = await concept.login({ username, password: newPassword });
    assert("userId" in loginAfterChangeNew, "Login with new password should succeed after change");
    assertEquals(loginAfterChangeNew.userId, userId);
    console.log(`Effect: Password for user '${username}' successfully updated. Old password no longer works, new password works.`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: changePassword - user not found requirement", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    console.log("Action: Attempting to change password for non-existent user ID");
    const result = await concept.changePassword({
      userId: "nonexistent" as ID,
      oldPassword: "any",
      newPassword: "new",
    });
    assert("error" in result, "Change password should return error for non-existent user");
    assertEquals(result.error, "User not found.");
    console.log(`Effect: Change password rejected with error: ${result.error}`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: changePassword - incorrect old password requirement", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    const username = "badoldpass";
    const password = "correct";
    const { userId } = await concept.register({ username, password }) as { userId: ID };

    console.log(`Action: Attempting to change password for '${username}' with incorrect old password`);
    const result = await concept.changePassword({
      userId,
      oldPassword: "wrongold",
      newPassword: "new",
    });
    assert("error" in result, "Change password should return error for incorrect old password");
    assertEquals(result.error, "Old password does not match.");
    console.log(`Effect: Change password rejected with error: ${result.error}`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: changePassword - empty new password requirement", async () => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  try {
    const username = "emptynewpass";
    const password = "current";
    const { userId } = await concept.register({ username, password }) as { userId: ID };

    console.log(`Action: Attempting to change password for '${username}' with empty new password`);
    const result = await concept.changePassword({
      userId,
      oldPassword: password,
      newPassword: "",
    });
    assert("error" in result, "Change password should return error for empty new password");
    assertEquals(result.error, "New password cannot be empty.");
    console.log(`Effect: Change password rejected with error: ${result.error}`);
  } finally {
    await client.close();
  }
});
```