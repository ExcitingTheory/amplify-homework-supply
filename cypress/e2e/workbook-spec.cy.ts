/**
 * The workbook test.
 * 
 * This test assumes we are logged in as a teacher.
 * This test assumes we are running the app locally.
 * This test assumes we are reading a workbook with a specific unit id. 
 * That the unit has a name.
 * That the unit has a description.
 * 
 * Play the Meaning association exercise.
 * Play the Multiple choice exercise.
 */


describe('workbook spec', () => {
  it('login and do a workbook', () => {
    cy.viewport(1280, 720)
    cy.visit('http://localhost:3000/workbook/a2ec102d-e121-443b-bbc7-64eebceddbd8')
    // wait for the page to load
    // wait for the login form to load
    cy.get('form').should('be.visible')
    // get the username and password from the environment variables
    // and type them into the form

    const username = Cypress.env('TEACHER_USERNAME')
    const password = Cypress.env('TEACHER_PASSWORD')

    cy.get('input[name="username"]').type(username)
    cy.get('input[name="password"]').type(password)

    // submit the form
    cy.get('form').submit()

    // Verify the timer is reading 2 minutes.
    // Wait for the timer to load.
    cy.get('#__next > header > div.MuiToolbar-root.MuiToolbar-dense.css-utgeoc-MuiToolbar-root > div > div.MuiChip-root.MuiChip-filled.MuiChip-sizeMedium > span').should('be.visible')
    // // Verify the timer is reading 2 minutes.
    cy.get('#__next > header > div.MuiToolbar-root.MuiToolbar-dense.css-utgeoc-MuiToolbar-root > div > div.MuiChip-root.MuiChip-filled.MuiChip-sizeMedium > span').should('have.text', '00:02:00')

    // Wait for the start button to load.
    cy.get('#__next > div > div > button').should('be.visible')

    // // Click the start button.

    cy.get('#__next > div > div > button').click()

    //  // Wait for the Meaning association exercise tab panel to load.

    cy.get('#scrollable-auto-tab-0[aria-selected="true"]')
      .should('be.visible')
      .scrollIntoView()
      .wait(2000)

    cy.contains('now')
      .trigger('dragstart')
      .trigger('dragleave')
      .wait(2000)
      .then(() => {
        cy.contains('at the present time or moment.').parent()
          .find('td')
          .find('div')
          .trigger('drop')
      }).wait(2000)

    cy.contains('thing')
      .trigger('dragstart')
      .trigger('dragleave')
      .wait(2000)
      .then(() => {
        cy.contains('an object that one need not, cannot, or does not wish to give a specific name to.').parent()
          .find('td')
          .find('div')
          .trigger('drop')
      }).wait(2000)

    cy.get('#scrollable-auto-tab-1[aria-selected="true"]')
      .should('be.visible')
      .scrollIntoView()
      .wait(2000)

    // read the question located at #scrollable-auto-tabpanel-1 > div > div > div:nth-child(2) > div.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1

    cy.get('#scrollable-auto-tabpanel-1 > div > div > div:nth-child(2) > div.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1')
      .should('be.visible')
      .scrollIntoView()
      .wait(2000)

    const promptEasy1 = cy.get('#scrollable-auto-tabpanel-1 > div > div > div:nth-child(2) > div.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1')
      .invoke('text')

    // if the prompt is "What is the meaning of the word 'now'?"
    // then select the answer "at the present time or moment."
    // else if the prompt is "What is the meaning of the word 'thing'?"

    if (promptEasy1.toString() === "at the present time or moment.") {
      cy.get('#scrollable-auto-tabpanel-1')
        .scrollIntoView()
        .contains('now')
        .trigger('dragstart')
        .trigger('dragleave')
        .wait(2000)
        .then(() => {
          cy.get('#scrollable-auto-tabpanel-1 > div > div > div:nth-child(2) > div.MuiBox-root')
            .wait(2000)
            .trigger('drop')
        }).wait(2000)

      cy.get('#scrollable-auto-tabpanel-1')
        .scrollIntoView()
        .contains('thing')
        .trigger('dragstart')
        .trigger('dragleave')
        .wait(2000)
        .then(() => {
          cy.get('#scrollable-auto-tabpanel-1 > div > div > div:nth-child(2) > div.MuiBox-root')
            .wait(2000)
            .trigger('drop')
        }).wait(2000)


    } else {
      cy.get('#scrollable-auto-tabpanel-1')
        .scrollIntoView()
        .contains('thing')
        .trigger('dragstart')
        .trigger('dragleave')
        .wait(2000)
        .then(() => {
          cy.get('#scrollable-auto-tabpanel-1 > div > div > div:nth-child(2) > div.MuiBox-root')
            .wait(2000)
            .trigger('drop')
        }).wait(4000)

      cy.get('#scrollable-auto-tabpanel-1')
        .scrollIntoView()
        .contains('now')
        .trigger('dragstart')
        .trigger('dragleave')
        .wait(2000)
        .then(() => {
          cy.get('#scrollable-auto-tabpanel-1 > div > div > div:nth-child(2) > div.MuiBox-root')
            .wait(2000)
            .trigger('drop')
        }).wait(2000)

    }

    // wait for the hard tab panel to load
    cy.get('#scrollable-auto-tab-2[aria-selected="true"]')
      .should('be.visible')
      .scrollIntoView()
      .wait(2000)


    const promptHard = cy.get('#scrollable-auto-tabpanel-2 > div > div > div:nth-child(2) > div.MuiPaper-root.MuiPaper-elevation.MuiPaper-rounded.MuiPaper-elevation1')
      .invoke('text')

    // if the prompt is "What is the meaning of the word 'now'?"
    // then select the answer "at the present time or moment."
    // else if the prompt is "What is the meaning of the word 'thing'?"

    if (promptHard.toString() === "at the present time or moment.") {
      cy.get('#scrollable-auto-tabpanel-2')
        .scrollIntoView()
        .contains('now')
        .trigger('dragstart')
        .trigger('dragleave')
        .wait(2000)
        .then(() => {
          cy.get('#scrollable-auto-tabpanel-2 > div > div > div:nth-child(2) > div.MuiBox-root')
            .trigger('drop')
        }).wait(2000)

        cy.get('#scrollable-auto-tabpanel-2')
        .scrollIntoView()
        .contains('thing')
        .trigger('dragstart')
        .trigger('dragleave')
        .wait(2000)
        .then(() => {
          cy.get('#scrollable-auto-tabpanel-2 > div > div > div:nth-child(2) > div.MuiBox-root')
            .trigger('drop')
        }).wait(2000)
    } else {
      cy.get('#scrollable-auto-tabpanel-2')
        .scrollIntoView()
        .contains('thing')
        .trigger('dragstart')
        .trigger('dragleave')
        .wait(2000)
        .then(() => {
          cy.get('#scrollable-auto-tabpanel-2 > div > div > div:nth-child(2) > div.MuiBox-root')
            .trigger('drop')
        }).wait(2000)

        cy.get('#scrollable-auto-tabpanel-2')
        .scrollIntoView()
        .contains('now')
        .trigger('dragstart')
        .trigger('dragleave')
        .wait(2000)
        .then(() => {
          cy.get('#scrollable-auto-tabpanel-2 > div > div > div:nth-child(2) > div.MuiBox-root')
            .trigger('drop')
        }).wait(2000)
    }

    cy.get('#scrollable-auto-tab-0[aria-selected="true"]')
      .should('be.visible')
      .scrollIntoView()
      .wait(2000)


    // wait for the first multiple choice question to load
    cy.get('#__next > div > div > div > div > div > div > div:nth-child(10) > div.MuiFormGroup-root.css-dmmspl-MuiFormGroup-root > label:nth-child(1)')
    .should('be.visible').wait(2000)

    // select an answer
     cy.get('#__next > div > div > div > div > div > div > div:nth-child(10) > div.MuiFormGroup-root.css-dmmspl-MuiFormGroup-root > label:nth-child(1)')
     .click().wait(2000)

    // wait for the second multiple choice question to load
    cy.get('#__next > div > div > div > div > div > div > div:nth-child(12) > div.MuiFormGroup-root.css-dmmspl-MuiFormGroup-root > label:nth-child(1)')
    .should('be.visible').wait(2000)

    // select an answer
     cy.get('#__next > div > div > div > div > div > div > div:nth-child(12) > div.MuiFormGroup-root.css-dmmspl-MuiFormGroup-root > label:nth-child(1)')
     .click().wait(2000)





  })
})