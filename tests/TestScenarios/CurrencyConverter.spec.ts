import { test, expect } from '@playwright/test';
import { CurrencyConverterPage } from '../pages/CurrencyConverterPage';
import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });

test.beforeEach(async ({ page }) => {
    await page.goto(process.env.pageUrl || "");
});

async function fetchConversionRate(page, fromCurrency, toCurrency) {
    const apiUrl = process.env.apiUrl;

    const rate = await page.evaluate(async (url) => {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': 'Basic bG9kZXN0YXI6cHVnc25heA==' // Use your own credentials
            }
        });

        if (!response.ok) {
            throw new Error(`Failed: HTTP error code: ${response.status}`);
        }

        const jsonResponse = await response.json();
        return jsonResponse.rates;
    }, apiUrl);

    return rate[toCurrency] / rate[fromCurrency];
}

test.describe('Currency Converter Tests', () => {

    test('Verify user should convert currencies correctly', async ({ page }) => {
        const currencyConverterPage = new CurrencyConverterPage(page);

        let amountToConvert = 9999999999999999;
        if(amountToConvert >=0.005  && amountToConvert <= 0.01){
            amountToConvert=0.01;
        }else if(amountToConvert >= 9999999999999999){
            amountToConvert = 10000000000000000
        }
        const fromCurrency = "TRY";
        const toCurrency = "EUR";

        // Fetch expected conversion rate dynamically
        const expectedRate = await fetchConversionRate(page, fromCurrency, toCurrency);
        console.log("expected rate: " + expectedRate);

        // Perform currency conversion
        await currencyConverterPage.acceptCookies();
        await currencyConverterPage.enterAmount(amountToConvert);

        await currencyConverterPage.selectCurrency(fromCurrency, true); // true for from currency
        await currencyConverterPage.selectCurrency(toCurrency, false); // false for to currency

        await currencyConverterPage.clickConvert();

        // Wait for result and retrieve it
        const parsedResult = await currencyConverterPage.getConversionResult();
        console.log("parsed result: " + parsedResult);

        const expectedConversion = amountToConvert * expectedRate;
        console.log("expected conversion: " + expectedConversion);

        expect(currencyConverterPage.isCloseTo(parsedResult, expectedConversion)).toBe(true);

        // Swap currencies and repeat the conversion
        await currencyConverterPage.swapCurrencies();

        const swappedExpectedRate = await fetchConversionRate(page, toCurrency, fromCurrency);
        console.log("Swapped exchange rate: " + swappedExpectedRate);

        const expectedSwappedConversionResult = amountToConvert * swappedExpectedRate;
        console.log("expected swapped conversion result: " + expectedSwappedConversionResult);

        // Retrieve the swapped conversion result
        const swappedParsedResult = await currencyConverterPage.getConversionResult();
        console.log("swapped parsed result: " + swappedParsedResult);

        expect(currencyConverterPage.isCloseTo(swappedParsedResult, expectedSwappedConversionResult)).toBe(true);
    });


    const amountsToConvert = [10,10.5,0.5,100.50,1000,333333.33333,500000000];

        for (let i = 0; i < amountsToConvert.length; i++) {
        const amount = amountsToConvert[i];
        
        test(`Verify user can convert ${amount} from USD to EUR correctly`, async ({ page }) => {
            const currencyConverterPage = new CurrencyConverterPage(page);
    
            await currencyConverterPage.acceptCookies();
            const fromCurrency = "USD";
            const toCurrency = "EUR";
    
            // Fetch expected conversion rate dynamically
            const expectedRate = await fetchConversionRate(page, fromCurrency, toCurrency);
    
            await currencyConverterPage.enterAmount(amount);
    
            await currencyConverterPage.selectCurrency(fromCurrency, true);
            await currencyConverterPage.selectCurrency(toCurrency, false);
    
            await currencyConverterPage.clickConvert();
    
            const parsedResult = await currencyConverterPage.getConversionResult();
    
            const expectedConversion = amount * expectedRate;
    
            expect(currencyConverterPage.isCloseTo(parsedResult, expectedConversion)).toBe(true);
        });
    }


    test('Verify user be able to see error message when user specify negative numbers ', async ({ page })=>{

        const currencyConverterPage = new CurrencyConverterPage(page);

        await currencyConverterPage.acceptCookies();

        await currencyConverterPage.enterAmount(-1);
        await expect(currencyConverterPage.inputAmountErrorMessage).toBeVisible();

        const errorMessage = await currencyConverterPage.inputAmountErrorMessage.textContent();
        expect(errorMessage).toBe("Please enter an amount greater than 0");

    });


    test('Verify user be able to see error message when user specify numbers less than 0.005 ', async ({ page })=>{

        const currencyConverterPage = new CurrencyConverterPage(page);

        await currencyConverterPage.acceptCookies();
        const enterAmount = 0.0041;

        await currencyConverterPage.enterAmount(enterAmount);

        if(enterAmount < 0.005){
            await expect(currencyConverterPage.inputAmountErrorMessage).toBeVisible();
            const errorMessage = await currencyConverterPage.inputAmountErrorMessage.textContent();
            expect(errorMessage).toBe("Please enter an amount greater than 0");
        }else{
            await expect(currencyConverterPage.inputAmountErrorMessage).not.toBeVisible();
        }

    });

    test('Verify user can see error message when specifying non-numeric values', async ({ page }) => {
        const currencyConverterPage = new CurrencyConverterPage(page);

        await currencyConverterPage.acceptCookies();

        const nonNumericValue = "abc"; // Non-numeric value
        await currencyConverterPage.enterAmount(Number(nonNumericValue));

        // Check if the error message is visible
        await expect(currencyConverterPage.inputAmountErrorMessage).toBeVisible();

        const errorMessage = await currencyConverterPage.inputAmountErrorMessage.textContent();
        expect(errorMessage).toBe("Please enter a valid amount"); // Update with the correct expected error message
    });


    test('Verify user can access conversion page with query string parameters', async ({ page }) => {
        // Define query string parameters
        const fromCurrency = 'USD';
        const toCurrency = 'EUR';
        const amount = 100;

        // Construct the URL with query string parameters
        const url = `https://www.xe.com/currencyconverter/convert/?Amount=${amount}&From=${fromCurrency}&To=${toCurrency}`;

        // Navigate directly to the URL
        await page.goto(url);

        // Create an instance of CurrencyConverterPage
        const currencyConverterPage = new CurrencyConverterPage(page);
        await currencyConverterPage.acceptCookies();

        // Wait for the conversion result to be displayed
        //await page.waitForSelector(currencyConverterPage.resultText);

        // Retrieve the conversion result
        const resultTextValue = await currencyConverterPage.getConversionResult();
        console.log("resultTextValue: " + resultTextValue);


        // Calculate expected conversion based on fetched rate (you may need to fetch this dynamically)
        const expectedRate = await fetchConversionRate(page, fromCurrency, toCurrency);
        const expectedConversion = amount * expectedRate;
        console.log("expectedConversion: " + expectedConversion);


        // Validate that the displayed result matches the expected conversion
        expect(currencyConverterPage.isCloseTo(resultTextValue, expectedConversion)).toBe(true);
    });


    test('Verify dropdown order of currencies', async ({ page }) => {
        const currencyConverterPage = new CurrencyConverterPage(page);

        await currencyConverterPage.acceptCookies();

        // Click on the dropdown to open it
        await currencyConverterPage.fromCurrencyDropdown.click();

        //await page.click('#midmarketFromCurrency-listbox');
        await page.waitForTimeout(500);// Adjust based on actual selector

        // Get options from the dropdown
        const options = await page.$$eval('#midmarketFromCurrency-listbox li[role="option"]', options =>
            options.map(option => option.textContent?.trim())
        );

        //console.log("Dropdown options:", options); // Log retrieved options

        // Define popular currencies and their order
        const popularCurrencies = ['USD US Dollar', 'EUR Euro', 'GBP British Pound', 'CAD Canadian Dollar', 'AUD Australian Dollar'];

        /// Check that all popular currencies are included in the first 5 options
        popularCurrencies.forEach(currency => {
            expect(options.slice(0, 5)).toContain(currency);
        });

        // Check that all other currencies are in alphabetical order after the first few popular ones.
        let otherCurrencies = options.slice(5); // Get all other currencies

        //console.log("other currencies:", otherCurrencies);

        // Sort them alphabetically
        let sortedOtherCurrencies = [...otherCurrencies].sort();
        console.log("sorted other currencies:", sortedOtherCurrencies);
        console.log("other currencies:", otherCurrencies);
        expect(otherCurrencies).toEqual(sortedOtherCurrencies); // Check if they are sorted

    });

    test('Verify URI updates after conversion', async ({ page }) => {
        const currencyConverterPage = new CurrencyConverterPage(page);

        const amountToConvert = 100;
        const fromCurrency = 'USD';
        const toCurrency = 'EUR';

        console.log("PAGEURL:", process.env.pageUrl|| ""); // Specifically check PAGEURL

        // Perform conversion
        await currencyConverterPage.acceptCookies();
        await currencyConverterPage.enterAmount(amountToConvert);
        await currencyConverterPage.selectCurrency(fromCurrency, true);
        await currencyConverterPage.selectCurrency(toCurrency, false);
        await currencyConverterPage.clickConvert();

        // wait until page is loaded
        await currencyConverterPage.waitForElementToBeVisible(currencyConverterPage.resultText)

        // Verify URI updates correctly
        expect( page.url()).toEqual(`${process.env.pageUrl}/convert/?Amount=${amountToConvert}&From=${fromCurrency}&To=${toCurrency}`)

        // Change currencies
        const newFromCurrency = 'TRY';
        const newToCurrency = 'GBP';

        await currencyConverterPage.selectCurrency(newFromCurrency, true);
        await currencyConverterPage.selectCurrency(newToCurrency, false);

        // Verify URI updates correctly
        expect( page.url()).toEqual(`${process.env.pageUrl}/convert/?Amount=${amountToConvert}&From=${newFromCurrency}&To=${newToCurrency}`)
    });


});