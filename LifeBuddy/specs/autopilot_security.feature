Feature: Agent Autopilot and Security Boundaries

  As a security-conscious Life Buddy User,
  I want to toggle the AI Auto-Pilot settings for my calendar and email tools,
  So that I have complete control over high-stakes autonomous mutations.

  Background:
    Given the user is authenticated in the system
    And the Policy Server is active and intercepting tool calls

  Scenario: Autonomously scheduling an event when Calendar Auto-Pilot is enabled
    Given the user has enabled "Calendar Auto-Pilot" on the dashboard
    When the Planner Agent determines a slot is free and calls "Create Calendar Event"
    Then the Policy Server should bypass the manual approval gate
    And the event should be created in the database silently
    And the user should see a silent notification confirmation

  Scenario: Halting for review and generating a Vibe Diff when Auto-Pilot is disabled
    Given the user has disabled "Calendar Auto-Pilot" on the dashboard
    When the Planner Agent attempts to call "Create Calendar Event"
    Then the Policy Server should intercept the tool call
    And the agent should halt execution in a paused state
    And the system should render a "Logic Review" modal to the user
    And the modal must show a plain-English "Vibe Diff" summary of the calendar changes
    And the action should only execute once the user taps to approve

  Scenario: Structural gating blocking unauthorized agent tool execution
    Given the Product Owner Agent is active with SPIFFE ID "spiffe://lifebuddy.local/agent/product-owner"
    When the Product Owner Agent attempts to execute the tool "deploy_to_cloud_run"
    Then the Policy Server should immediately intercept the call
    And the Policy Server should block the action due to structural policy violation
    And the execution should fail with a "Permission Denied" exception
