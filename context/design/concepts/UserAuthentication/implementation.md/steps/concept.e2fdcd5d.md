---
timestamp: 'Sun Oct 19 2025 16:37:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251019_163747.78c40273.md]]'
content_id: e2fdcd5d0995246f5f49a987e9c92f0bc3506541b59a813a0038b91b3aee3dd6
---

# concept: UserAuthentication

* **concept**: UserAuthentication
* **purpose**: To allow users to register and authenticate securely while ensuring unique user identities.
* **principle**: If a user registers with a unique username and password, then they can login with those same credentials to be authenticated and receive a user identifier; attempting to register with an existing username will be rejected.
* **state**:
  * A set of `Users` with
    * an `id` of type `String` (unique user identifier)
    * a `username` of type `String` (unique)
    * a `password` of type `String` (hashed)
    * a `createdAt` of type `DateTime`
* **actions**:
  * `register (username: String, password: String): (userId: String)`
    * **requires**: username is not empty, password is not empty, no existing user has the same username
    * **effects**: Creates new user u with unique id, u.username=username, u.password=hashed(password), sets u.createdAt to current time. Returns u.id as userId.
  * `login (username: String, password: String): (userId: String)`
    * **requires**: user exists with given username, provided password matches stored hashed password
    * **effects**: Returns the user's id as userId.
  * `changePassword (userId: String, oldPassword: String, newPassword: String)`
    * **requires**: user exists with userId, oldPassword matches current password, newPassword is not empty
    * **effects**: Updates user's password to hashed(newPassword).
