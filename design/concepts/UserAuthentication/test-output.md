# Test Output: UserAuthentication

```
Task test:user-auth deno test --allow-net --allow-read --allow-sys --allow-env src/concepts/UserAuthentication/UserAuthentication.test.ts
running 12 tests from ./src/concepts/UserAuthentication/UserAuthentication.test.ts
Principle: Registration, successful login, and rejection of duplicate registration ...
------- output -------

--- Principle Trace: Registration and Login ---
Action: Registering user 'alice' with password 'password123'
Effect: Alice registered with userId: 0199fe7c-0b12-74cf-b585-de3b4e3de2f4
Action: Attempting to register 'alice' again with password 'newpass'
Effect: Duplicate registration rejected with error: Username already exists.
Action: Logging in user 'alice' with password 'password123'
Effect: Alice logged in successfully. userId: 0199fe7c-0b12-74cf-b585-de3b4e3de2f4
Action: Attempting to login 'alice' with incorrect password 'wrongpass'
Effect: Login with incorrect password rejected with error: Invalid username or password.
--- End Principle Trace ---
----- output end -----
Principle: Registration, successful login, and rejection of duplicate registration ... ok (782ms)
Action: register - successful registration ...
------- output -------
Action: Calling register for username 'testuser'
Effect: User 'testuser' registered with ID '0199fe7c-0d95-71d2-a9d4-13599d0de61e' and stored in DB.
----- output end -----
Action: register - successful registration ... ok (570ms)
Action: register - empty username requirement ...
------- output -------
Action: Calling register with empty username
Effect: Registration rejected with error: Username cannot be empty.
----- output end -----
Action: register - empty username requirement ... ok (531ms)
Action: register - empty password requirement ...
------- output -------
Action: Calling register with empty password
Effect: Registration rejected with error: Password cannot be empty.
----- output end -----
Action: register - empty password requirement ... ok (528ms)
Action: register - duplicate username requirement ...
------- output -------
Action: Calling register for username 'duplicateuser' (duplicate)
Effect: Registration rejected with error: Username already exists.
----- output end -----
Action: register - duplicate username requirement ... ok (521ms)
Action: login - successful login ...
------- output -------
Action: Calling login for username 'loginuser'
Effect: User 'loginuser' logged in successfully.
----- output end -----
Action: login - successful login ... ok (542ms)
Action: login - non-existent username ...
------- output -------
Action: Calling login for non-existent username 'nouser'
Effect: Login rejected with error: Invalid username or password.
----- output end -----
Action: login - non-existent username ... ok (502ms)
Action: login - incorrect password ...
------- output -------
Action: Calling login for 'badpassuser' with incorrect password
Effect: Login rejected with error: Invalid username or password.
----- output end -----
Action: login - incorrect password ... ok (578ms)
Action: changePassword - successful password change ...
------- output -------
Action: Changing password for user 'changepassuser' (ID: 0199fe7c-1c3c-737d-b15f-09b87f4bd45e)
Effect: Password for user 'changepassuser' successfully updated. Old password no longer works, new password works.
----- output end -----
Action: changePassword - successful password change ... ok (620ms)
Action: changePassword - user not found requirement ...
------- output -------
Action: Attempting to change password for non-existent user ID
Effect: Change password rejected with error: User not found.
----- output end -----
Action: changePassword - user not found requirement ... ok (515ms)
Action: changePassword - incorrect old password requirement ...
------- output -------
Action: Attempting to change password for 'badoldpass' with incorrect old password
Effect: Change password rejected with error: Old password does not match.
----- output end -----
Action: changePassword - incorrect old password requirement ... ok (607ms)
Action: changePassword - empty new password requirement ...
------- output -------
Action: Attempting to change password for 'emptynewpass' with empty new password
Effect: Change password rejected with error: New password cannot be empty.
----- output end -----
Action: changePassword - empty new password requirement ... ok (530ms)

ok | 12 passed | 0 failed (6s)
```
