Feature: Calendar Agenda Timeline, Auto-Pilot Scheduling, and Security Policy Gates

  As a Life Buddy User,
  I want to view my daily hour-by-hour calendar, integrate task schedules automatically via AI Auto-Pilot, and review policy gates,
  So that I can coordinate my daily routine securely.

  Background:
    Given the user is authenticated on the Life Buddy dashboard
    And the Calendar tab is selected

  # --- A. Timeline Display & Layout Scenarios (1 - 10) ---

  Scenario: 1. Display daily timeline hour slots
    Then the calendar view should display the 08:00 AM slot
    And the 10:00 AM slot
    And the 12:00 PM slot
    And the 02:00 PM slot
    And the 04:00 PM slot

  Scenario: 2. 08:00 AM slot defaults to Morning Inbox Triage
    Then the 08:00 AM timeline slot should display "Morning Inbox Triage"

  Scenario: 3. 12:00 PM slot defaults to Lunch and Break walk
    Then the 12:00 PM timeline slot should display "Lunch and Break walk"

  Scenario: 4. 04:00 PM slot defaults to Day review wrap-up
    Then the 04:00 PM timeline slot should display "Day review wrap-up"

  Scenario: 5. 10:00 AM slot shows default text when no Q1 task exists
    Given there are no tasks in the "Urgent" column (Q1)
    Then the 10:00 AM timeline slot should display "Focus session (No Q1 tasks)"

  Scenario: 6. 02:00 PM slot shows default text when no Q2 task exists
    Given there are no tasks in the "Important" column (Q2)
    Then the 02:00 PM timeline slot should display "Project planning session"

  Scenario: 7. Timeline Buddy container is styled in soft periwinkle
    Then the timeline card panel background should be styled as `var(--bg-panel)`

  Scenario: 8. Time slots have bold, dark fonts for readability
    Then the time slot hour label should render with `font-weight: 700` and color `var(--text-secondary)`

  Scenario: 9. Timeline slot rows have bottom border dividers
    Then every timeline slot row should be separated by `border-bottom: 1px solid var(--border-color)`

  Scenario: 10. Layout width remains unchanged when switching to Calendar Tab
    When the user clicks the "Calendar Tab" link
    Then the sidebar width should remain exactly 260px
    And the main content workspace width should remain identical to the Tasks and Groceries tabs

  # --- B. Task Integration & AI Auto-Pilot Scenarios (11 - 20) ---

  Scenario: 11. Creating Q1 task automatically schedules it at 10:00 AM
    Given no Q1 task exists
    When the user creates a Q1 task "Submit project proposal"
    Then the 10:00 AM timeline slot should update to "Submit project proposal"

  Scenario: 12. Creating Q2 task automatically schedules it at 02:00 PM
    Given no Q2 task exists
    When the user creates a Q2 task "Review roadmap"
    Then the 02:00 PM timeline slot should update to "Review roadmap"

  Scenario: 13. Multiple Q1 tasks schedules the first matching one at 10:00 AM
    Given the user has Q1 tasks "Task 1" and "Task 2" in that order
    Then the 10:00 AM timeline slot should display "Task 1"

  Scenario: 14. Multiple Q2 tasks schedules the first matching one at 02:00 PM
    Given the user has Q2 tasks "Task A" and "Task B" in that order
    Then the 02:00 PM timeline slot should display "Task A"

  Scenario: 15. Deleting Q1 task reverts 10:00 AM slot to default
    Given Q1 task "Submit project proposal" is scheduled at 10:00 AM
    When the user deletes the task "Submit project proposal"
    Then the 10:00 AM timeline slot should revert to "Focus session (No Q1 tasks)"

  Scenario: 16. Deleting Q2 task reverts 02:00 PM slot to default
    Given Q2 task "Review roadmap" is scheduled at 02:00 PM
    When the user deletes the task "Review roadmap"
    Then the 02:00 PM timeline slot should revert to "Project planning session"

  Scenario: 17. Updating task quadrant from Q1 to Q4 removes it from 10:00 AM slot
    Given Q1 task "Submit project proposal" is scheduled at 10:00 AM
    When the user edits the task quadrant to "Q4"
    Then the 10:00 AM timeline slot should revert to default

  Scenario: 18. Updating task quadrant from Q4 to Q2 schedules it at 02:00 PM
    Given Q4 task "Read articles" is in the Later column
    When the user edits the task quadrant to "Q2"
    Then the 02:00 PM timeline slot should display "Read articles"

  Scenario: 19. Profile isolation: User A's calendar does not show User B's Q1 task
    Given User B has Q1 task "Secret task"
    When User A views their Calendar Tab
    Then the 10:00 AM timeline slot should not display "Secret task"

  Scenario: 20. Default timezone for calendar is Eastern Time
    Then the calendar agenda slots should load according to Eastern Time boundary offsets

  # --- C. Policy Gating & Human-In-The-Loop Scenarios (21 - 30) ---

  Scenario: 21. (Deferred) Creating task with Calendar Auto-Pilot ON triggers review modal
    Given the Calendar Auto-Pilot toggle in the sidebar is checked
    When the user quick-creates a task "Meeting with CEO"
    Then a Logic Review modal overlay dialog should appear on the screen
    And the task creation should remain pending

  Scenario: 22. (Deferred) Creating task with Calendar Auto-Pilot OFF bypasses review modal
    Given the Calendar Auto-Pilot toggle in the sidebar is unchecked
    When the user quick-creates a task "Meeting with CEO"
    Then no modal dialog should appear
    And the task should be created instantly

  Scenario: 23. Logic Review modal displays action summary and details
    Given the Logic Review modal is open for "Meeting with CEO"
    Then the modal header should show "Logic Review: schedule_calendar_event"
    And the body should show details about the proposed slot

  Scenario: 24. Logic Review modal cancel button closes modal
    Given the Logic Review modal is open
    When the user clicks the "Cancel" button in the modal
    Then the modal overlay should disappear
    And the task creation should be cancelled (not saved in database)

  Scenario: 25. Logic Review modal approve button initiates Policy Server check
    Given the Logic Review modal is open
    When the user clicks the "Approve & Sync" button
    Then the system should submit the security payload to `/security/policy-check`

  Scenario: 26. Policy check success creates task and closes modal
    Given the Policy Server evaluates the action as allowed
    When the user clicks "Approve & Sync"
    Then the task "Meeting with CEO" should be saved in the database
    And the Logic Review modal should close
    And the task should appear on the board

  Scenario: 27. Policy check failure displays error message and blocks action
    Given the Policy Server evaluates the action as blocked due to rule violation
    When the user clicks "Approve & Sync"
    Then an alert dialog "Security Gate Intercept" should display with the reason
    And the Logic Review modal should close
    And the task should not be saved

  Scenario: 28. SPIFFE ID check in policy payload
    When the policy request is sent
    Then the role field must match "spiffe://lifebuddy.local/agent/product-owner"

  Scenario: 29. (Deferred) Auto-Pilot review payload email check blocks unmasked PII
    When the policy request payload contains an unmasked email address
    Then the Policy Server must block the action

  Scenario: 30. (Deferred) Auto-Pilot review payload token check blocks unmasked secrets
    When the policy request payload contains an unmasked secret authentication token
    Then the Policy Server must block the action

  # --- D. Timezone & Focus Schedule Scenarios (31 - 40) ---

  Scenario: 31. Timezone offset checks on daily slots
    Then the system should calculate hour boundaries adjusting for DST offsets

  Scenario: 32. Same-hour event override behavior
    Given a task is scheduled at 10:00 AM
    When the user manually adds a calendar event at 10:00 AM
    Then the manual event should take priority in timeline rendering

  Scenario: 33. Midnight transition does not crash schedule queries
    When the system time crosses 11:59 PM to 12:00 AM
    Then the calendar agenda should automatically refresh to the next day's slots

  Scenario: 34. Time slot labels render in 12-hour AM/PM format
    Then all hourly slot labels should be formatted as "HH:MM AM" or "HH:MM PM"

  Scenario: 35. Task descriptions are queryable for time tags
    When a task contains "at 3 PM"
    Then the parser should identify 3:00 PM as the target scheduled slot

  Scenario: 36. Invalid natural language time defaults to standard focus slot
    When the user enters "Attend talk tomorrow at invalidtime"
    Then the task should save
    And default to the standard Q2 focus slot (02:00 PM)

  Scenario: 37. Date parser handles absolute dates
    When the user enters "Schedule meeting on July 10, 2026"
    Then the target date should parse as "2026-07-10"

  Scenario: 38. Date parser handles relative dates like 'next Monday'
    When the user enters "Schedule meeting next Monday"
    Then the target date should parse as the upcoming Monday's calendar date

  Scenario: 39. Parsing dates handles leap years correctly
    When the user enters a date for February 29 on a leap year
    Then the system should resolve it as a valid date

  Scenario: 40. Date parser ignores invalid days like February 30
    When the user enters "meeting on February 30"
    Then the parser should fallback to today's date

  # --- E. Advanced Event Modifications Scenarios (41 - 50) ---

  Scenario: 41. Add manual event slot in timeline
    When the user adds a manual event "Gym Session" at 06:00 AM
    Then the timeline should display a new slot for 06:00 AM with "Gym Session"

  Scenario: 42. Delete manual event from timeline
    Given a manual event "Gym Session" is scheduled at 06:00 AM
    When the user deletes "Gym Session"
    Then the 06:00 AM timeline slot should disappear

  Scenario: 43. Update manual event title
    Given a manual event "Gym Session" is scheduled
    When the user edits the title to "Yoga Session"
    Then the timeline should update the display to "Yoga Session"

  Scenario: 44. Move manual event hour slot
    Given a manual event "Gym Session" is scheduled at 06:00 AM
    When the user moves the event hour to 07:00 AM
    Then the 06:00 AM slot should clear
    And the 07:00 AM slot should display "Gym Session"

  Scenario: 45. Timeline Buddy is scrollable when hours exceed viewport
    Then the calendar agenda container should have CSS overflow-y enabled

  Scenario: 46. Calendar tab active state visual indicators
    When the "Calendar Tab" is active
    Then the sidebar link should be highlighted with `color: var(--primary)`

  Scenario: 47. Calendar main header displays dynamic daily subtitle
    Then the calendar header should display "Daily hourly schedule and event agenda"

  Scenario: 48. Switch toggles in sidebar retain state on tab navigation
    Given Calendar Auto-Pilot is toggle-checked
    When the user switches from Calendar Tab to Groceries Tab
    And returns to Calendar Tab
    Then the Calendar Auto-Pilot toggle should remain checked

  Scenario: 49. Logout clears Timeline Buddy values
    When the user logs out
    Then the timeline entries should be blanked out

  Scenario: 50. Task priority update from Q3 to Q1 moves timeline slot
    Given Q3 task is scheduled at 02:00 PM
    When the user edits its priority to Q1
    Then the task should move from the 02:00 PM slot to the 10:00 AM slot
