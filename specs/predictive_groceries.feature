Feature: Groceries Buddy, Supermarket Aisle Grouping, and Purchase Predictions

  As a Life Buddy User,
  I want to manage my household shopping lists, load template lists semantically, and receive predictive suggestions,
  So that I can coordinate grocery shopping efficiently.

  Background:
    Given the user is authenticated on the Life Buddy dashboard
    And the Groceries tab is selected

  # --- A. Grocery Creation & Aisle Categorization Scenarios (1 - 10) ---

  Scenario: 1. Add item categorized under Dairy aisle
    When the user creates grocery item "Butter" with aisle "Dairy"
    Then the item "Butter" should appear under the "Dairy Aisle" section

  Scenario: 2. Add item categorized under Produce aisle
    When the user creates grocery item "Bananas" with aisle "Produce"
    Then the item "Bananas" should appear under the "Produce Aisle" section

  Scenario: 3. Add item categorized under Bakery aisle
    When the user creates grocery item "Croissants" with aisle "Bakery"
    Then the item "Croissants" should appear under the "Bakery Aisle" section

  Scenario: 4. Add item categorized under Other aisle
    When the user creates grocery item "Toothpaste" with aisle "Other"
    Then the item "Toothpaste" should appear under the "Other Aisle" section

  Scenario: 5. Empty aisle selection defaults to Other aisle
    When the user creates grocery item "Screws" with an empty aisle selection
    Then the item "Screws" should appear under the "Other Aisle" section

  Scenario: 6. Grocery item name is trimmed of whitespace
    When the user creates grocery item "   Organic Eggs   " with aisle "Dairy"
    Then the item should be saved with name "Organic Eggs"

  Scenario: 7. Gating duplicate grocery items on addition
    Given a grocery item named "Milk" already exists in the list
    When the user attempts to add "Milk" to the list
    Then the addition should fail
    And an error warning "Grocery item already exists in your list." should display

  Scenario: 8. Case insensitivity duplicate gating for groceries
    Given a grocery item named "Bread" exists in the list
    When the user attempts to add "bread" to the list
    Then the addition should fail
    And an error warning "Grocery item already exists in your list." should display

  Scenario: 9. Trimmed name duplicate gating for groceries
    Given a grocery item named "Bread" exists in the list
    When the user attempts to add "   Bread   " to the list
    Then the addition should fail

  Scenario: 10. Display active shopping list grouped by aisle
    Given the shopping list contains:
      | Name   | Aisle   |
      | Milk   | Dairy   |
      | Apples | Produce |
    Then the UI should render "Dairy Aisle" and "Produce Aisle" headers in uppercase

  # --- B. Predictive Suggestions Scenarios (11 - 20) ---

  Scenario: 11. Predictive suggestions appear when historical conditions match
    Given the system detects the user purchases "Milk" every 7 days
    And the last purchase of "Milk" was 6 days ago
    Then a suggestion card "Add Milk?" should appear under "Predicted Items Based on History"

  Scenario: 12. Suggestion card shows frequency and aisle details
    Given the suggestion card "Add Milk?" is visible
    Then the card should display "(Dairy - Every 7 days)" under the title

  Scenario: 13. Adding predicted suggestion appends it to active list
    Given the suggestion card "Add Milk?" is visible
    When the user clicks the "Add" button on the suggestion card
    Then "Milk" should be added to the active shopping list under the "Dairy Aisle" section
    And the suggestion card "Add Milk?" should disappear

  Scenario: 14. Adding predicted suggestion gates duplicates
    Given the suggestion card "Add Milk?" is visible
    And the user has manually added "Milk" to the active shopping list in the meantime
    When the user clicks the "Add" button on the suggestion card
    Then the action should fail
    And a warning banner should display "Grocery item already exists in your list."

  Scenario: 15. Dismissing prediction suggestion removes card
    Given the suggestion card "Add Milk?" is visible
    When the user clicks the "Dismiss" button on the suggestion card
    Then the card should disappear
    And the active shopping list should remain unchanged

  Scenario: 16. Multiple suggestion cards render simultaneously
    Given predictions exist for "Milk" and "Apples"
    Then two suggestion cards should display on the page

  Scenario: 17. Dismissing one suggestion card retains the others
    Given suggestion cards for "Milk" and "Apples" are visible
    When the user dismisses the "Milk" suggestion
    Then the "Milk" card should disappear
    And the "Apples" card should remain visible

  Scenario: 18. Accepting a suggestion clears it from prediction lists
    Given suggestion cards for "Milk" and "Apples" are visible
    When the user accepts the "Milk" suggestion
    Then the "Milk" card should disappear
    And the "Apples" card should remain visible

  Scenario: 19. Historical frequency boundary - very low interval
    Given the purchase history shows "Yogurt" is bought every 1 day
    Then a suggestion card for "Yogurt" should appear daily

  Scenario: 20. Historical frequency boundary - very high interval
    Given the purchase history shows "Vitamins" are bought every 90 days
    Then a suggestion card for "Vitamins" should not appear until day 89

  # --- C. Semantic Template Loading Scenarios (21 - 30) ---

  Scenario: 21. Load Summer BBQ template semantically
    When the user enters "summer bbq grill party" in the template input
    And clicks the "Load Template" button
    Then the shopping list should populate with items "bread", "butter", "cheese"

  Scenario: 22. Load Breakfast template semantically
    When the user enters "healthy morning breakfast oats" in the template input
    And clicks the "Load Template" button
    Then the shopping list should populate with items "apples", "bananas", "yogurt"

  Scenario: 23. Loading template automatically bypasses existing duplicates
    Given the active shopping list already contains "butter"
    When the user loads the "summer bbq" template
    Then the items "bread" and "cheese" should be added
    And the item "butter" should not be added again

  Scenario: 24. Loading template with all items duplicated results in no additions
    Given the active shopping list contains "bread", "butter", and "cheese"
    When the user loads the "summer bbq" template
    Then no new items should be added to the shopping list

  Scenario: 25. Input search query trims whitespace during template loads
    When the user enters "    summer bbq    " in the template input
    And clicks the "Load Template" button
    Then the matching template items should load successfully

  Scenario: 26. Loading template with non-matching query returns no items
    When the user enters "heavy industrial equipment sorting" in the template input
    And clicks the "Load Template" button
    Then no new items should be added to the active shopping list

  Scenario: 27. Case-insensitive duplicate check during template expansion
    Given the active shopping list contains "BREAD"
    When the user loads the "summer bbq" template
    Then the item "bread" should be skipped, avoiding duplicates

  Scenario: 28. Template load request passes user_id to backend
    When the user loads a template
    Then the REST request payload should include `user_id`

  Scenario: 29. Gating duplicate alerts during template load
    When the user loads a template containing duplicate items
    Then the backend should filter them out silently without displaying error banners

  Scenario: 30. Vector template embeddings fall back to cosine similarity calculation
    When the database vector records are queried
    Then similarity scores should be calculated and sorted in descending order

  # --- D. Grocery Deletion (CRUD Checkoff) Scenarios (31 - 40) ---

  Scenario: 31. Grocery items have checkable checkboxes in UI
    Then every active grocery item should display a checkbox next to its name

  Scenario: 32. Checking grocery checkbox triggers DELETE request
    When the user clicks the checkbox for item "Milk"
    Then a DELETE request targeting this item's ID should be sent to the backend

  Scenario: 33. Successful checkout deletion removes item from UI
    When the user checks the checkbox for item "Milk"
    And the API returns success
    Then the item "Milk" should immediately fade and disappear from the active shopping list

  Scenario: 34. Checkbox deletion updates database records
    When the user checks the checkbox for item "Milk"
    Then the grocery item record should be permanently deleted from the database table

  Scenario: 35. Checking item in produce aisle updates count in headers
    Given the "Produce Aisle" section has 2 items
    When the user checks the checkbox for one item
    Then the "Produce Aisle" list should re-render with only 1 item

  Scenario: 36. Checking the last item in an aisle removes the aisle header
    Given the "Bakery Aisle" section has only 1 item "Bread"
    When the user checks the checkbox for "Bread"
    Then the item "Bread" should disappear
    And the header "Bakery Aisle" should disappear from the list view

  Scenario: 37. Unauthorized delete request targeting grocery item is blocked
    When another user sends a DELETE request targeting this grocery item ID
    Then the server should return HTTP 404 Not Found

  Scenario: 38. Checking grocery item does not delete other user items
    Given User A has grocery item "Milk A" and User B has grocery item "Milk B"
    When User A checks off "Milk A"
    Then User B's active shopping list should still display "Milk B"

  Scenario: 39. Clearing list database schema preserves template vector embeddings
    When the grocery items table is truncated
    Then the vector records table should remain intact

  Scenario: 40. Checking off predicted item suggestions deletes prediction card
    Given the user accepts the "Milk" suggestion
    And it is added to the list
    When the user checks off "Milk" from the active shopping list
    Then the suggestion card should not reappear immediately

  # --- E. UI Layout & Viewport Resizing Scenarios (41 - 50) ---

  Scenario: 41. Groceries Buddy section is styled in soft periwinkle
    Then the groceries card panel background should be styled as `var(--bg-panel)`

  Scenario: 42. Active shopping list container has white background card contrast
    Then the active list container background should be styled as `#ffffff`

  Scenario: 43. Layout width remains unchanged when switching to Groceries Tab
    When the user clicks the "Groceries Tab" link
    Then the sidebar width should remain exactly 260px
    And the main content workspace width should remain identical to the Tasks Tab view

  Scenario: 44. Input fields have white backgrounds for high readability
    Then the template input field background should be styled as `var(--bg-input)`

  Scenario: 45. Template loader button triggers active state hover transition
    When the user hovers over "Load Template" button
    Then the button should transition smoothly, displaying a shadow overlay

  Scenario: 46. Responsive layout drops sidebar to top header on mobile viewports
    Given the screen width is resized to 768px or less
    Then the navigation sidebar should render as a top horizontal menu bar

  Scenario: 47. Responsive main content expands to fill screen on mobile viewports
    Given the screen width is resized to 768px or less
    Then the main content panel should take up 100% width

  Scenario: 48. Prediction alerts spacing check
    Then the spacing gap between multiple prediction cards should be styled as 0.5rem

  Scenario: 49. Close error warning banner on groceries tab
    Given a red error banner "Grocery item already exists in your list." is visible
    When the user clicks the close (x) button on the banner
    Then the error banner should disappear

  Scenario: 50. Empty groceries view displays placeholder text
    Given the active shopping list is empty
    Then the list area should show no aisle sections
    And the list container should be hidden or show empty state indicators
