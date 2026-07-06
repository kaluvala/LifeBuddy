Feature: User Authentication, Session Management, and Profile Isolation

  As a Life Buddy User,
  I want to register and log in to a secure account,
  So that my everyday organizer dashboard is isolated, private, and secure.

  Background:
    Given the backend authentication services are online
    And the database is initialized

  # =========================================================================
  # 1. USER REGISTRATION SCENARIOS (1 to 10)
  # =========================================================================

  Scenario: 1. Successful user registration with standard valid inputs
    Given the user is on the authentication page
    And the user is not authenticated
    When the user enters username "johndoe" and password "SecurePass123!"
    And the user clicks the "Register" button
    Then a new user account should be created in the database
    And the user should be automatically logged in
    And the dashboard page should load successfully

  Scenario: 2. Failed registration due to duplicate username
    Given a user account already exists with username "tom"
    And the user is on the authentication page
    When the user enters username "tom" and password "NewPass987!"
    And the user clicks the "Register" button
    Then the registration should be blocked
    And a warning banner should display "Username already exists."

  Scenario: 3. Failed registration due to username being too short
    Given the user is on the authentication page
    When the user enters username "ab" and password "SecurePass123!"
    And the user clicks the "Register" button
    Then the registration should be blocked
    And a warning banner should display "Username must be at least 3 characters."

  Scenario: 4. Failed registration due to password being too short
    Given the user is on the authentication page
    When the user enters username "validuser" and password "123"
    And the user clicks the "Register" button
    Then the registration should be blocked
    And a warning banner should display "Password must be at least 8 characters long."

  Scenario: 5. Failed registration with empty username
    Given the user is on the authentication page
    When the user leaves the username field blank
    And enters password "SecurePass123!"
    And clicks the "Register" button
    Then the registration should be blocked
    And a validation warning should display "All fields are required to register."

  Scenario: 6. Failed registration with empty password
    Given the user is on the authentication page
    When the user enters username "someuser"
    And leaves the password field blank
    And clicks the "Register" button
    Then the registration should be blocked
    And a validation warning should display "All fields are required to register."

  Scenario: 7. Successful registration at username minimum boundary length
    Given the user is on the authentication page
    When the user enters username "bob" and password "SecurePass123!"
    And the user clicks the "Register" button
    Then a new user account should be created successfully

  Scenario: 8. Successful registration at username maximum boundary length
    Given the user is on the authentication page
    When the user enters username "verylongusernamefiftycharactersmaxallowedfield12345" and password "SecurePass123!"
    And the user clicks the "Register" button
    Then a new user account should be created successfully

  Scenario: 9. Failed registration with username containing disallowed trailing spaces
    Given the user is on the authentication page
    When the user enters username "   " and password "SecurePass123!"
    And the user clicks the "Register" button
    Then the registration should be blocked

  Scenario: 10. Successful registration handles trailing/leading whitespace in username by trimming
    Given the user is on the authentication page
    When the user enters username "  trimmeduser  " and password "SecurePass123!"
    And the user clicks the "Register" button
    Then a new user account with username "trimmeduser" should be created

  # =========================================================================
  # 2. USER LOGIN SCENARIOS (11 to 20)
  # =========================================================================

  Scenario: 11. Successful login with valid registered credentials
    Given a user account exists with username "tom" and password "SecurePass123!"
    And the user is on the authentication page
    When the user enters username "tom" and password "SecurePass123!"
    And the user clicks the "Login" button
    Then the user should be authenticated
    And the dashboard page should load
    And the user's specific tasks and groceries should load

  Scenario: 12. Failed login due to non-existent username
    Given the user is on the authentication page
    When the user enters username "nonexistentuser" and password "SecurePass123!"
    And the user clicks the "Login" button
    Then the login should fail
    And a warning banner should display "Invalid username or password."

  Scenario: 13. Failed login due to incorrect password for existing user
    Given a user account exists with username "tom" and password "SecurePass123!"
    And the user is on the authentication page
    When the user enters username "tom" and password "incorrect_pass"
    And the user clicks the "Login" button
    Then the login should fail
    And a warning banner should display "Invalid username or password."

  Scenario: 14. Failed login with empty username field
    Given the user is on the authentication page
    When the user leaves the username field blank
    And enters password "password123"
    And the user clicks the "Login" button
    Then the browser should block submission or show a field required warning

  Scenario: 15. Failed login with empty password field
    Given the user is on the authentication page
    When the user enters username "tom"
    And leaves the password field blank
    And the user clicks the "Login" button
    Then the browser should block submission or show a field required warning

  Scenario: 16. Login handles leading/trailing whitespace by trimming the username
    Given a user account exists with username "tom" and password "password123"
    And the user is on the authentication page
    When the user enters username "  tom  " and password "password123"
    And the user clicks the "Login" button
    Then the user should be authenticated successfully

  Scenario: 17. Failed login with password containing wrong casing
    Given a user account exists with username "tom" and password "password123"
    And the user is on the authentication page
    When the user enters username "tom" and password "PASSWORD123"
    And the user clicks the "Login" button
    Then the login should fail

  Scenario: 18. Failed login due to SQL injection payload in username field
    Given the user is on the authentication page
    When the user enters username "' OR '1'='1" and password "anything"
    And the user clicks the "Login" button
    Then the system should block the attempt
    And return a validation error without database leakage

  Scenario: 19. Failed login due to SQL injection payload in password field
    Given a user account exists with username "tom" and password "password123"
    And the user is on the authentication page
    When the user enters username "tom" and password "' OR '1'='1"
    And the user clicks the "Login" button
    Then the login should fail

  Scenario: 20. Failed login with extremely long input value (buffer overflow test)
    Given the user is on the authentication page
    When the user enters a username containing 1000 characters
    And enters a password containing 1000 characters
    And the user clicks the "Login" button
    Then the system should reject the request gracefully with a validation error

  # =========================================================================
  # 3. SESSION MANAGEMENT & LOGOUT SCENARIOS (21 to 25)
  # =========================================================================

  Scenario: 21. Successful user logout clears session state
    Given the user is logged into the application as "tom"
    When the user clicks the "Logout" button in the sidebar
    Then the user session should be cleared
    And the user should be redirected back to the login screen
    And user details in localStorage should be destroyed

  Scenario: 22. Session persistence after page reload
    Given the user is logged into the application as "tom"
    When the user reloads the browser page
    Then the user should remain logged in
    And the dashboard page should load directly without prompting for credentials

  Scenario: 23. Accessing dashboard page directly without session redirects to login
    Given the user has cleared their browser localStorage
    When the user navigates directly to the dashboard URI
    Then the main dashboard should not render
    And the user should be presented with the login card

  Scenario: 24. Accessing login page while already authenticated redirects to dashboard
    Given the user is logged into the application as "tom"
    When the user navigates to the registration page URI
    Then the dashboard should remain visible
    And the login card should not be displayed

  Scenario: 25. Storage synchronization across multiple tabs
    Given the user has two browser tabs open at http://localhost:8000/
    And the user is logged in on Tab 1
    When the user logs out on Tab 1
    Then Tab 2 should automatically detect the logout event
    And redirect Tab 2 to the login screen

  # =========================================================================
  # 4. PROFILE ISOLATION & CRUD SECURITY SCENARIOS (26 to 30)
  # =========================================================================

  Scenario: 26. Logged-in user's tasks are hidden from other users
    Given a task "Task User A" is created by User A
    And a second user User B is registered and logged in
    When User B views their tasks dashboard
    Then User B should not see the task "Task User A"

  Scenario: 27. Logged-in user's groceries are hidden from other users
    Given a grocery item "Milk User A" is added by User A
    And a second user User B is registered and logged in
    When User B views their Groceries Buddy tab
    Then User B should not see the grocery item "Milk User A"

  Scenario: 28. Unauthorized task update attempt by other user is blocked
    Given a task exists belonging to User A
    When User B attempts to send a PUT request to update User A's task
    Then the API should reject the request with HTTP 404 Not Found

  Scenario: 29. Unauthorized task deletion attempt by other user is blocked
    Given a task exists belonging to User A
    When User B attempts to send a DELETE request targeting User A's task
    Then the API should reject the request with HTTP 404 Not Found

  Scenario: 30. Unauthorized grocery deletion attempt by other user is blocked
    Given a grocery item exists belonging to User A
    When User B attempts to send a DELETE request targeting User A's grocery item
    Then the API should reject the request with HTTP 404 Not Found
