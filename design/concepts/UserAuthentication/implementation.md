[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

# implement: UserAuthentication

# concept: UserAuthentication
*   **concept**: UserAuthentication
*   **purpose**: To allow users to register and authenticate securely while ensuring unique user identities.
*   **principle**: If a user registers with a unique username and password, then they can login with those same credentials to be authenticated and receive a user identifier; attempting to register with an existing username will be rejected.
*   **state**:
    *   A set of `Users` with
        *   an `id` of type `String` (unique user identifier)
        *   a `username` of type `String` (unique)
        *   a `password` of type `String` (hashed)
        *   a `createdAt` of type `DateTime`
*   **actions**:
    *   `register (username: String, password: String): (userId: String)`
        *   **requires**: username is not empty, password is not empty, no existing user has the same username
        *   **effects**: Creates new user u with unique id, u.username=username, u.password=hashed(password), sets u.createdAt to current time. Returns u.id as userId.
    *   `login (username: String, password: String): (userId: String)`
        *   **requires**: user exists with given username, provided password matches stored hashed password
        *   **effects**: Returns the user's id as userId.
    *   `changePassword (userId: String, oldPassword: String, newPassword: String)`
        *   **requires**: user exists with userId, oldPassword matches current password, newPassword is not empty
        *   **effects**: Updates user's password to hashed(newPassword).

# file: src/UserAuthentication/UserAuthentication.ts


# response:

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// For demonstration purposes, we'll use a simple mock hashing function.
// In a production environment, you would use a robust library like bcrypt.
function hashPassword(password: string): string {
  // A very basic and insecure "hash" for demonstration. DO NOT USE IN PRODUCTION.
  return `hashed_${password}_secret`;
}

function verifyPassword(inputPassword: string, storedHashedPassword: string): boolean {
  // Verifies if the input password matches the stored hashed password.
  // In a real app, this would involve re-hashing the input and comparing.
  return hashPassword(inputPassword) === storedHashedPassword;
}

// Declare collection prefix, use concept name
const PREFIX = "UserAuthentication" + ".";

/**
 * Interface for the User object stored in MongoDB.
 *
 * A set of Users with
 *  an `id` of type `String` (unique user identifier)
 *  a `username` of type `String` (unique)
 *  a `password` of type `String` (hashed)
 *  a `createdAt` of type `DateTime`
 */
interface User {
  _id: ID; // Mapped from 'id' in the concept spec
  username: string;
  password: string; // Stored hashed password
  createdAt: Date;
}

/**
 * **concept**: UserAuthentication
 * **purpose**: To allow users to register and authenticate securely while ensuring unique user identities.
 * **principle**: If a user registers with a unique username and password, then they can login with those same credentials to be authenticated and receive a user identifier; attempting to register with an existing username will be rejected.
 */
export default class UserAuthenticationConcept {
  users: Collection<User>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * register (username: String, password: String): (userId: String)
   *
   * **requires**: username is not empty, password is not empty, no existing user has the same username
   *
   * **effects**: Creates new user u with unique id, u.username=username, u.password=hashed(password),
   *              sets u.createdAt to current time. Returns u.id as userId.
   */
  async register({ username, password }: { username: string; password: string }): Promise<{ userId: ID } | { error: string }> {
    // Check preconditions
    if (!username || username.trim() === "") {
      return { error: "Username cannot be empty." };
    }
    if (!password || password.trim() === "") {
      return { error: "Password cannot be empty." };
    }

    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already exists." };
    }

    // Effects
    const newUserId = freshID();
    const hashedPassword = hashPassword(password);
    const newUser: User = {
      _id: newUserId,
      username,
      password: hashedPassword,
      createdAt: new Date(),
    };

    await this.users.insertOne(newUser);

    return { userId: newUserId };
  }

  /**
   * login (username: String, password: String): (userId: String)
   *
   * **requires**: user exists with given username, provided password matches stored hashed password
   *
   * **effects**: Returns the user's id as userId.
   */
  async login({ username, password }: { username: string; password: string }): Promise<{ userId: ID } | { error: string }> {
    // Check preconditions
    const user = await this.users.findOne({ username });
    if (!user) {
      return { error: "Invalid username or password." }; // Generic message for security
    }

    if (!verifyPassword(password, user.password)) {
      return { error: "Invalid username or password." }; // Generic message for security
    }

    // Effects
    return { userId: user._id };
  }

  /**
   * changePassword (userId: String, oldPassword: String, newPassword: String)
   *
   * **requires**: user exists with userId, oldPassword matches current password, newPassword is not empty
   *
   * **effects**: Updates user's password to hashed(newPassword).
   */
  async changePassword({ userId, oldPassword, newPassword }: {
    userId: ID;
    oldPassword: string;
    newPassword: string;
  }): Promise<Empty | { error: string }> {
    // Check preconditions
    const user = await this.users.findOne({ _id: userId });
    if (!user) {
      return { error: "User not found." };
    }

    if (!verifyPassword(oldPassword, user.password)) {
      return { error: "Old password does not match." };
    }

    if (!newPassword || newPassword.trim() === "") {
      return { error: "New password cannot be empty." };
    }

    // Effects
    const hashedNewPassword = hashPassword(newPassword);
    await this.users.updateOne(
      { _id: userId },
      { $set: { password: hashedNewPassword } },
    );

    return {}; // Empty record for successful completion
  }
}
```