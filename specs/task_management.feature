Feature: Task Management, Matrix Prioritization, and Subtask Editor

  As a Life Buddy User,
  I want to create, organize, and update my tasks inside a 3-column Eisenhower Matrix,
  So that I can prioritize urgent work and track subtask items.

  Background:
    Given the user is authenticated on the Life Buddy dashboard
    And the Tasks tab is selected

  # --- A. Quick-Create & Quadrant Allocation Scenarios (1 - 10) ---
  
  Scenario: 1. Create Q1 task automatically using the keyword 'today'
    When the user enters "Submit report today" in the quick-create field
    And clicks the "Quick Create" button
    Then the task should be saved with quadrant "Q1"
    And it should appear in the "Urgent" column

  Scenario: 2. Create Q1 task automatically using the keyword 'tomorrow'
    When the user enters "Doctor visit tomorrow" in the quick-create field
    And clicks the "Quick Create" button
    Then the task should be saved with quadrant "Q1"
    And it should appear in the "Urgent" column

  Scenario: 3. Create Q1 task automatically using the keyword 'urgent'
    When the user enters "Urgent client email" in the quick-create field
    And clicks the "Quick Create" button
    Then the task should be saved with quadrant "Q1"
    And it should appear in the "Urgent" column

  Scenario: 4. Create Q3 task automatically using the keyword 'schedule'
    When the user enters "Schedule dental checkup" in the quick-create field
    And clicks the "Quick Create" button
    Then the task should be saved with quadrant "Q3"
    And it should appear in the "Urgent" column

  Scenario: 5. Create Q3 task automatically using the keyword 'call'
    When the user enters "Call plumber" in the quick-create field
    And clicks the "Quick Create" button
    Then the task should be saved with quadrant "Q3"
    And it should appear in the "Urgent" column

  Scenario: 6. Create Q4 task automatically using the keyword 'clean'
    When the user enters "Clean my desk" in the quick-create field
    And clicks the "Quick Create" button
    Then the task should be saved with quadrant "Q4"
    And it should appear in the "Later" column

  Scenario: 7. Create Q4 task automatically using the keyword 'sort'
    When the user enters "Sort old folders" in the quick-create field
    And clicks the "Quick Create" button
    Then the task should be saved with quadrant "Q4"
    And it should appear in the "Later" column

  Scenario: 8. Create Q2 task as default when no keywords match
    When the user enters "Research competitor designs" in the quick-create field
    And clicks the "Quick Create" button
    Then the task should be saved with quadrant "Q2"
    And it should appear in the "Important" column

  Scenario: 9. Gating duplicate task titles in quick create
    Given a task named "Exercise" already exists
    When the user enters "Exercise" in the quick-create field
    And clicks the "Quick Create" button
    Then the creation should fail
    And an error warning "Task with this title already exists." should display

  Scenario: 10. Trim whitespace from task title during quick create
    When the user enters "   Attend webinar   " in the quick-create field
    And clicks the "Quick Create" button
    Then the task should be saved with title "Attend webinar"

  # --- B. UI Card Collapsibility & Inline Editing Scenarios (11 - 20) ---

  Scenario: 11. Task card is collapsed by default
    Then the task card "Submit report today" should show a collapsed icon "▶"
    And the task description field should not be visible

  Scenario: 12. Expand task card on click
    When the user clicks the task card "Submit report today"
    Then the card should expand
    And show a collapsed icon "▼"
    And the description, quadrant, and subtask controls should be visible

  Scenario: 13. Collapse task card on click of toggle icon
    Given the task card "Submit report today" is expanded
    When the user clicks the toggle icon
    Then the card should collapse
    And hide description and subtask controls

  Scenario: 14. Clicking input fields inside expanded card does not collapse card
    Given the task card "Submit report today" is expanded
    When the user clicks the description textarea field
    Then the card should remain expanded

  Scenario: 15. Clicking cancel button collapses card without changes
    Given the task card "Submit report today" is expanded
    When the user edits the title to "Submit report today (Edited)"
    And clicks the "Cancel" button
    Then the card should collapse
    And the task title should revert to "Submit report today"

  Scenario: 16. Update task title inline successfully
    Given the task card "Submit report today" is expanded
    When the user edits the title field to "Submit report today - Final Version"
    And clicks the "Save" button
    Then the task title should update to "Submit report today - Final Version"
    And the card should collapse

  Scenario: 17. Update task description inline successfully
    Given the task card "Submit report today" is expanded
    When the user edits the description field to "Submit to manager by 5 PM"
    And clicks the "Save" button
    Then the task description should update to "Submit to manager by 5 PM" in the database

  Scenario: 18. Update task quadrant inline relocates card to Important column
    Given the task card "Submit report today" is expanded
    And it is in the "Urgent" column (Q1)
    When the user selects "Q2" from the quadrant dropdown selector
    And clicks the "Save" button
    Then the task card should re-render inside the "Important" column (Q2)

  Scenario: 19. Update task quadrant inline relocates card to Later column
    Given the task card "Submit report today" is expanded
    When the user selects "Q4" from the quadrant dropdown selector
    And clicks the "Save" button
    Then the task card should re-render inside the "Later" column (Q4)

  Scenario: 20. Prevent inline update from changing title to a duplicate name
    Given a task named "Read book" exists
    And the task card "Submit report today" is expanded
    When the user edits the title to "Read book"
    And clicks the "Save" button
    Then the update should fail
    And an error warning "Another task with this title already exists." should display

  # --- C. Subtask Management Scenarios (21 - 30) ---

  Scenario: 21. Subtask list is empty for new tasks
    Given the task card "Submit report today" is expanded
    Then the subtask list container should be empty

  Scenario: 22. Add subtask successfully
    Given the task card "Submit report today" is expanded
    When the user enters "Collect data" in the new subtask input
    And clicks the "+" button
    Then the subtask "Collect data" should appear in the subtasks checklist

  Scenario: 23. Add multiple subtasks successfully
    Given the task card "Submit report today" is expanded
    When the user adds subtask "Write intro"
    And adds subtask "Proofread document"
    Then the subtasks checklist should display both subtasks in order

  Scenario: 24. Prevent adding empty subtask
    Given the task card "Submit report today" is expanded
    When the user leaves the new subtask input blank
    And clicks the "+" button
    Then no subtask should be added to the list

  Scenario: 25. Check off subtask completion
    Given the task card "Submit report today" is expanded
    And has a subtask "Collect data"
    When the user checks the checkbox for "Collect data"
    Then the subtask text "Collect data" should render with a line-through style
    And its state should mark as completed

  Scenario: 26. Uncheck completed subtask
    Given the task card "Submit report today" is expanded
    And has a completed subtask "Collect data"
    When the user unchecks the checkbox for "Collect data"
    Then the subtask text "Collect data" should render without a line-through style
    And its state should mark as incomplete

  Scenario: 27. Delete subtask from checklist
    Given the task card "Submit report today" is expanded
    And has a subtask "Collect data"
    When the user clicks the delete (X) button next to "Collect data"
    Then the subtask "Collect data" should be removed from the checklist

  Scenario: 28. Save persists subtask additions and checkboxes
    Given the task card "Submit report today" is expanded
    When the user adds a subtask "Check formatting"
    And checks its completed checkbox
    And clicks the "Save" button
    Then the task should close
    And expanding the task card again should display "Check formatting" as completed

  Scenario: 29. Subtask input trims whitespace
    Given the task card "Submit report today" is expanded
    When the user enters "   Trimmed subtask   " in the new subtask input
    And clicks the "+" button
    Then the subtask should render as "Trimmed subtask"

  Scenario: 30. Empty subtasks array defaults to empty JSON list in DB
    When the user quick-creates a task
    Then its `subtasks_json` field in the database should default to "[]"

  # --- D. Task Deletion (CRUD) Scenarios (31 - 40) ---

  Scenario: 31. Delete button exists inside expanded card
    Given the task card "Submit report today" is expanded
    Then a "Delete" button should be visible in the actions row

  Scenario: 32. Clicking delete opens confirm dialog
    Given the task card "Submit report today" is expanded
    When the user clicks the "Delete" button
    Then the browser should present a confirmation dialog

  Scenario: 33. Cancelling deletion confirmation dialog retains task
    Given the task card "Submit report today" is expanded
    When the user clicks the "Delete" button
    And declines the confirmation dialog
    Then the task card "Submit report today" should remain on the dashboard

  Scenario: 34. Confirming deletion removes task from UI
    Given the task card "Submit report today" is expanded
    When the user clicks the "Delete" button
    And accepts the confirmation dialog
    Then the task card "Submit report today" should disappear from the dashboard

  Scenario: 35. Confirming deletion removes task from database
    Given the task card "Submit report today" is expanded
    When the user clicks the "Delete" button
    And accepts the confirmation dialog
    Then the task record should no longer exist in the database

  Scenario: 36. Deleting task updates the column count pill
    Given the "Urgent" column has a count pill displaying "1"
    And the task in it is expanded
    When the user deletes the task
    Then the count pill for the "Urgent" column should update to "0"

  Scenario: 37. Unauthorized delete request returns 404
    When another user submits a DELETE request targeting this task ID
    Then the server should return HTTP 404 Not Found

  Scenario: 38. Task deletion cascades and deletes local draft states
    When the user deletes an expanded task card
    Then the React edit state for that card ID should be unmounted

  Scenario: 39. Deleting task does not affect other user tasks
    Given User A has task "Task A" and User B has task "Task B"
    When User A deletes "Task A"
    Then User B's dashboard should still display "Task B"

  Scenario: 40. (Deferred) Deleting Q3 task cancels pending Auto-Pilot checks
    Given a task is in Q3 with a pending Auto-Pilot review
    When the user deletes the task card
    Then the logic review modal should close automatically

  # --- E. High-Density & Column Toggle Scenarios (41 - 50) ---

  Scenario: 41. Later column is expanded by default
    Then the "Later" column should be visible on the board
    And show tasks in quadrant "Q4"
    And the column toggle icon should display "◀"

  Scenario: 42. Collapse Later column on click
    When the user clicks the toggle header on the "Later" column
    Then the "Later" column width should contract to 55px
    And the header text should render vertically
    And the column toggle icon should display "▶"

  Scenario: 43. Expand collapsed Later column on click
    Given the "Later" column is collapsed
    When the user clicks the vertical toggle header
    Then the "Later" column should expand to its full flex-basis width
    And the header text should render horizontally

  Scenario: 44. Task cards are not rendered inside collapsed Later column
    Given the "Later" column is collapsed
    Then tasks inside the Later column should not be visible on the screen

  Scenario: 45. Column headers display capitalized text
    Then the Urgent column header should display "URGENT"
    And the Important column header should display "IMPORTANT"
    And the Later column header should display "LATER"

  Scenario: 46. Column body has scrollbar overflow-y enabled
    Then the column body should support vertical scrolling when tasks exceed 550px height

  Scenario: 47. High-density spacing limit (minimum 7 tasks visible simultaneously)
    Given the user has 8 tasks in the "Urgent" column
    Then all 8 tasks should fit in the viewport without needing to scroll the main page

  Scenario: 48. High-density padding metrics check
    Then the task card padding should be styled as 0.5rem 0.7rem
    And the margin between tasks should be styled as 0.4rem

  Scenario: 49. Close warning banner clears error banner state
    Given a red error banner "Task with this title already exists." is visible
    When the user clicks the close (x) button on the banner
    Then the error banner should disappear

  Scenario: 50. Creating task updates calendar agenda slot dynamically
    When the user creates a task "Submit tax return today" in Q1
    Then the calendar tab daily timeline at 10:00 AM should display "Submit tax return today"
