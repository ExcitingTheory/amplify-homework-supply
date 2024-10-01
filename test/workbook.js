const assert = require('assert');
const puppeteer = require('puppeteer');

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


async function dragAndDrop(page, originSelector, destinationSelector) {
    // const origin = await page.waitForSelector(originSelector)
    // const destination = await page.waitForSelector(destinationSelector)
    // const ob = await origin.boundingBox()
    // const db = await destination.boundingBox()

    // Get the bounding box of the origin element.
    const origin = await page.waitForSelector(originSelector)
    const destination = await page.waitForSelector(destinationSelector)
    
    const originBox = await origin.boundingBox();
    const destinationBox = await destination.boundingBox();

    // Move the mouse to the center of the element.
    await page.mouse.move(originBox.x + originBox.width / 2, originBox.y + originBox.height / 2);
    console.log(`Dragging from ${originBox.x + originBox.width / 2}, ${originBox.y + originBox.height / 2}`)
    await new Promise(r => setTimeout(r, 1000));
    await page.mouse.down()
    await new Promise(r => setTimeout(r, 1000));
    await page.mouse.move(destinationBox.x + destinationBox.width / 2, destinationBox.y + destinationBox.height / 2);
    console.log(`Dropping at   ${destinationBox.x + destinationBox.width / 2}, ${destinationBox.y + destinationBox.height / 2}`)
    await new Promise(r => setTimeout(r, 1000));
    await page.mouse.up()

      
    // console.log(`Dragging from ${ob.x + ob.width / 2}, ${ob.y + ob.height / 2}`)
    // await page.mouse.move(ob.x + ob.width / 2, ob.y + ob.height / 2)
    // await page.mouse.down()
    
    // console.log(`Dropping at   ${db.x + db.width / 2}, ${db.y + db.height / 2}`)
    // await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2)
    // await new Promise(r => setTimeout(r, 1000));
    // await page.mouse.up()
  }

(async () => {
    const browser = await puppeteer.launch({ headless: false, /*slowMo: 100,*/ devtools: true });
    const page = await browser.newPage();
    // Navigate to the workbook page for a specific unit (unit id is in the URL).
    // Expose a function to the page context that intercepts drag events.
    // await page.exposeFunction('interceptDrag', () => {
    //     document.addEventListener('dragstart', event => {
    //         event.preventDefault();
    //         event.stopPropagation();
    //         event.stopImmediatePropagation();
    //     }, true);
    // });

    // Navigate to the workbook page for a specific unit (unit id is in the URL).
    await page.goto('http://localhost:3000/workbook/a2ec102d-e121-443b-bbc7-64eebceddbd8');


    // // Call the exposed function to intercept drag events.
    // await page.evaluate(() => {
    //     window.interceptDrag();
    // });




    // Wait for the page to load.
    await page.waitForNavigation();

    // Login as a teacher.

    // wait for the login from to load
    await page.waitForSelector('form');

    // fill in the username and password from the environment variables
    const username = process.env.TEACHER_USERNAME;
    const password = process.env.TEACHER_PASSWORD;

    await page.type('input[name="username"]', username);
    await page.type('input[name="password"]', password);

    // submit the form
    await page.click('button[type="submit"]');

    // Verify the timer is reading 2 minutes.
    // Wait for the timer to load.
    await page.waitForSelector('#__next > header > div.MuiToolbar-root.MuiToolbar-dense.css-utgeoc-MuiToolbar-root > div > div.MuiChip-root.MuiChip-filled.MuiChip-sizeMedium.MuiChip-colorPrimary.MuiChip-filledPrimary.css-o1r5ey-MuiChip-root > span');
    // Get the timer.
    const timer = await page.$eval('#__next > header > div.MuiToolbar-root.MuiToolbar-dense.css-utgeoc-MuiToolbar-root > div > div.MuiChip-root.MuiChip-filled.MuiChip-sizeMedium.MuiChip-colorPrimary.MuiChip-filledPrimary.css-o1r5ey-MuiChip-root > span', el => el.textContent);
    console.log(timer);
    // Assert that the timer is 2 minutes.
    assert.strictEqual(timer, '00:02:00');

    // Wait for the start button to load.
    // await page.waitForSelector('#__next > div > div > button');

    // // Click the start button.
    // await page.click('#__next > div > div > button');

    // await page.click('#__next > div > div > button');
    // Wait for the page to load.
    // await page.waitForNavigation();


    // TODO - this is not finished
    // // Get the page title.
    // const title = await page.title();
    // console.log(title);
    // // Assert that the page title is the unit name.
    // // Get the unit name.

    // const unitName = await page.$eval('h1', el => el.textContent);
    // console.log(unitName);
    // // Assert that the page title is the unit name.

    // assert.strictEqual(title, unitName);

    // // Get the unit description.
    // const unitDescription = await page.$eval('p', el => el.textContent);
    // console.log(unitDescription);
    // // Assert that the unit description is the unit description.

    // assert.strictEqual(unitDescription, 'This is a unit description.');    

    // Play the Meaning association exercise.

    // Wait for the Meaning association exercise tab panel to load.
    await page.waitForSelector('#scrollable-auto-tab-0[aria-selected="true"]');

    // drag the first word to the first box

    // wait for the first word to load
    // await page.waitForSelector('#scrollable-auto-tabpanel-0 > div > div > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-4 > div[draggable="true"]:nth-child(1)');
    // // get the first word
    // const word1 = await page.$('#scrollable-auto-tabpanel-0 > div > div > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-4 > div[draggable="true"]:nth-child(1)');

    // // get the box

    // await page.waitForSelector('#scrollable-auto-tabpanel-0 > div > div > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-8 > div > table > tbody > tr:nth-child(1) > td:nth-child(3) > div > span')

    // const box1 = await page.$('#scrollable-auto-tabpanel-0 > div > div > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-8 > div > table > tbody > tr:nth-child(1) > td:nth-child(3) > div > span')

    // await word1.dragAndDrop(box1, {delay: 1000});

    await dragAndDrop(page,
        '#scrollable-auto-tabpanel-0 > div > div > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-4 > div[draggable="true"]:nth-child(1)',
        '#scrollable-auto-tabpanel-0 > div > div > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-8 > div > table > tbody > tr:nth-child(1) > td:nth-child(3) > div'
    )

    // await new Promise(r => setTimeout(r, 30000));

    // // drag the second word to the second box
    // const word2 = await page.$('div[data-word="2"]');
    // const box2 = await page.$('#scrollable-auto-tabpanel-0 > div > div > div.MuiGrid-root.MuiGrid-item > div > table > tbody > tr:nth-child(2) > td:nth-child(3) > div');
    // await word2.dragAndDrop(box2);

    // // Wait for the tab to change.
    // await page.$('#scrollable-auto-tab-1[aria-selected="true"]');

    // // drag the third word to the third box
    // const word3 = await page.$('div[data-word="3"]');
    // const box3 = await page.$('div[data-box="3"]');
    // await word3.dragAndDrop(box3);

    // // drag the fourth word to the fourth box
    // const word4 = await page.$('div[data-word="4"]');
    // const box4 = await page.$('div[data-box="4"]');
    // await word4.dragAndDrop(box4);

    // // Wait for the tab to change.
    // await page.$('#scrollable-auto-tab-2[aria-selected="true"]');

    // // drag the fifth word to the fifth box
    // const word5 = await page.$('div[data-word="5"]');
    // const box5 = await page.$('div[data-box="5"]');
    // await word5.dragAndDrop(box5);

    // // drag the sixth word to the sixth box
    // const word6 = await page.$('div[data-word="6"]');
    // const box6 = await page.$('div[data-box="6"]');
    // await word6.dragAndDrop(box6);

    // // Wait for the tab to change.
    // await page.$('#scrollable-auto-tab-0[aria-selected="true"]');

    // // Wait for the Meaning association exercise to finish.

    // // Scroll to the first multiple choice exercise.

    // const multipleChoiceEx1 = document.querySelector('#my-element');
    // multipleChoiceEx1.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });




    // Wait for the Multiple choice exercise to load.
    // Play the Multiple choice exercise.

    // Wait for the Multiple choice exercise to finish.

    // Scroll to the second multiple choice exercise.

    // Wait for the Multiple choice exercise to load.
    // Play the Multiple choice exercise.

    // Wait for the Multiple choice exercise to finish.

    browser.close();


})();