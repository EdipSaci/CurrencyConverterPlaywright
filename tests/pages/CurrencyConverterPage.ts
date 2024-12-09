import { Page, Locator } from "@playwright/test";

export class CurrencyConverterPage {
    public page: Page;
    public amountInput: Locator;
    public fromCurrencyDropdown: Locator;
    public toCurrencyDropdown: Locator;
    public convertButton: Locator;
    public resultText: Locator;
    public acceptCookiesButton: Locator;
    public swapCurrenciesButton: Locator;
    public inputAmountErrorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.amountInput = page.locator('#amount');
        this.fromCurrencyDropdown = page.locator("input[aria-describedby='midmarketFromCurrency-current-selection']");
        this.toCurrencyDropdown = page.locator("input[aria-describedby='midmarketToCurrency-current-selection']");
        this.convertButton = page.locator('//button[normalize-space()="Convert"]');
        this.resultText = page.locator('.sc-63d8b7e3-1.bMdPIi');
        this.acceptCookiesButton = page.locator("//button[normalize-space()='Accept']");
        this.swapCurrenciesButton = page.locator("button[aria-label='Swap currencies']");
        this.inputAmountErrorMessage = page.locator('.sc-52d95371-0.fkpUOL.relative.top-1');
    }

    async acceptCookies() {
        await this.acceptCookiesButton.click();
    }

    async enterAmount(amount: number) {
        await this.amountInput.fill('');
        await this.amountInput.fill(amount.toString());
    }

    async selectCurrency(currencyCode: string, isFromCurrency: boolean) {
        const dropdown = isFromCurrency ? this.fromCurrencyDropdown : this.toCurrencyDropdown;
        await dropdown.click();
        await this.page.click(`//div[@class='flex' and contains(normalize-space(), '${currencyCode}')]`);
    }

    async clickConvert() {
        await this.convertButton.click();
    }
    async getConversionResult(): Promise<number> {
        const resultTextValue = await this.resultText.innerText();
        
        // Remove any non-numeric characters except for decimal points and minus signs
        const cleanValue = resultTextValue.replace(/[^0-9.-]+/g, '');
        
        // Parse the cleaned value to a number
        const parsedValue = parseFloat(cleanValue);
    
        // Check if parsing was successful
        if (isNaN(parsedValue)) {
            throw new Error(`Failed to parse conversion result: ${resultTextValue}`);
        }
    
        return parsedValue;
    }
    
    async swapCurrencies() {
        await this.swapCurrenciesButton.click();
    }

    isCloseTo(actual: number, expected: number, absoluteEpsilon: number = 0.00001, relativeEpsilon: number = 0.00001): boolean {
        // Check for exact equality
        if (actual === expected) {
            return true;
        }
    
        // Calculate the absolute difference
        const absoluteDifference = Math.abs(actual - expected);
    
        // If the absolute difference is smaller than the absolute epsilon, consider them close
        if (absoluteDifference < absoluteEpsilon) {
            return true;
        }
    
        // Calculate the relative difference
        const relativeDifference = absoluteDifference / Math.max(Math.abs(actual), Math.abs(expected));
    
        // Compare using relative tolerance
        return relativeDifference < relativeEpsilon;
    }

    async waitUntilPageLoad() {
        await this.page.waitForSelector('body');
    }

    async waitForElementToBeVisible(locator: Locator, timeout: number = 5000): Promise<void> {
        await locator.waitFor({ state: 'visible', timeout });
    }

}
