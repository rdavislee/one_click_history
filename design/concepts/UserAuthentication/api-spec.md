# API Specification: UserAuthentication Concept

**Purpose:** To allow users to register and authenticate securely while ensuring unique user identities.

---

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Creates a new user account with a unique username and hashed password.

**Requirements:**
- username is not empty
- password is not empty
- no existing user has the same username

**Effects:**
- Creates new user u with unique id
- Sets u.username=username
- Sets u.password=hashed(password)
- Sets u.createdAt to current time
- Returns u.id as userId

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "userId": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

**Possible Error Messages:**
- "Username cannot be empty."
- "Password cannot be empty."
- "Username already exists."

---

### POST /api/UserAuthentication/login

**Description:** Authenticates a user with their username and password, returning their user ID.

**Requirements:**
- user exists with given username
- provided password matches stored hashed password

**Effects:**
- Returns the user's id as userId

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "userId": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

**Possible Error Messages:**
- "Invalid username or password."

---

### POST /api/UserAuthentication/changePassword

**Description:** Updates a user's password after verifying their current password.

**Requirements:**
- user exists with userId
- oldPassword matches current password
- newPassword is not empty

**Effects:**
- Updates user's password to hashed(newPassword)

**Request Body:**
```json
{
  "userId": "string",
  "oldPassword": "string",
  "newPassword": "string"
}
```

**Success Response Body (Action):**
```json
{}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

**Possible Error Messages:**
- "User not found."
- "Old password does not match."
- "New password cannot be empty."

---

