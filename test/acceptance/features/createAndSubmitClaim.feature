Feature: Create and submit a new claim

    Scenario: Successfully complete form to submit a new claim

        Given I open the url "/"
        #button.govuk-button
        When I click on the button ".js-cookies-button-accept"
        Then I expect that the title contains "FFC Demo Service - GOV.UK"
        Then I expect that element "h1" contains the text "FFC Demo Service"
        
        Then  I wait on element ".govuk-button--start" for 500ms to be displayed
        When I click on the button ".govuk-button--start"
        Then I expect that the url contains "/claim/name"
        Then  I wait on element "#name" for 500ms to be displayed

        And I clear the inputfield "#name"
        And I click on the button "#name"
        And I add "Seymour Pattisson" to the inputfield "#name"
        When I click on the button "#submit"
        And   I pause for 500ms
        Then I expect that the url contains "/claim/property-type"  
        
        When I click on the button "#propertyType-2" 
        When I click on the button "#submit"
        And I pause for 500ms
        Then I expect that the url contains "/claim/accessible"
    
        When I click on the button "#accessible"
        When I click on the button "#submit"
        And   I pause for 500ms
        Then I expect that the url contains "/claim/date-of-subsidence"

        And I clear the inputfield "#dateOfSubsidence__day"
        And I add "01" to the inputfield "#dateOfSubsidence__day"
        And I clear the inputfield "#dateOfSubsidence__month"
        And I add "01" to the inputfield "#dateOfSubsidence__month"
        And I clear the inputfield "#dateOfSubsidence__year"
        And I add "1970" to the inputfield "#dateOfSubsidence__year"
        And I click on the button "#submit"
        And   I pause for 500ms
        Then  I expect that the url contains "/claim/mine-type"

        When I click on the button "#mineType-3"
        When I click on the button "#submit"
        And I clear the inputfield "#email"
        And I add "seymour.pattisson@defra.gov.uk" to the inputfield "#email"
        When I click on the button "#submit"
        And   I pause for 1000ms
        Then I expect that the url contains "/claim/confirmation"
