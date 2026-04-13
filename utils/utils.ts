import { type Locator, type Page } from '@playwright/test';
import * as _ from "lodash";
import { parse, isValid } from "date-fns";
import {toZonedTime } from 'date-fns-tz';

export class Utils {
    constructor(
        private readonly page: Page,
    ) {}

    async trimPagination(text: string) {
        const match = text.match(/of (\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return -1;
    }

    async scrollToElementAndScrollDown(locator: Locator, scrollCount: number) {
        const box = await locator.boundingBox();
        if (box) {
            await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);

            for (let i = 0; i < scrollCount; i++) {
                await this.page.mouse.wheel(0, 300);
                await this.page.waitForTimeout(100);
            }
        } else {
            console.error(`Element not found`);
        }
    }

    async getRandomSubstring(inputString: string) {
        if (inputString.length <= 4) {
            return inputString;
        }
        const randomLength = _.random(4, inputString.length);
        const startIndex = _.random(0, inputString.length - randomLength);
        return inputString.substring(startIndex, startIndex + randomLength);
    }

    async getRandomElements(strings: string[]) {
        if (strings.length <= 7) {
            return strings;
        }
        const numberOfElements = _.random(2, 7);
        return _.sampleSize(strings, numberOfElements);
    }

    pauseExecution(ms: number) {
        return this.page.waitForTimeout(ms);
    }

    async drawRandomSignature(locator: Locator) {
        const box = await locator.boundingBox();
        if (!box) {
            throw new Error('Element bounding box is not available');
        }
        const { x, y, width, height } = box;
        const startX = x + width / 4;
        const startY = y + height / 4;
        const endX = x + width - width / 4;
        const endY = y + height - height / 4;
        await this.page.mouse.move(startX, startY);
        await this.page.mouse.down();
        for (let i = 0; i < 8; i++) {
            const randomX = _.random(startX, endX);
            const randomY = _.random(startY, endY);
            await this.page.mouse.move(randomX, randomY, { steps: 5 });
        }
        await this.page.mouse.up();
    }

    async parseDate(dateString: string) {
        return parse(dateString, "yyyy-MM-dd h:mm a", new Date());
    }

    async getCurrentTimeMillisWithTimezone(timeZone: string = 'America/Vancouver') {
        const nowUtc = new Date();
        const zonedDate = toZonedTime(nowUtc, timeZone);
        return zonedDate.getTime();
    }

    async isValidDate(dateString: string, format: string = "yyyy-MM-dd h:mm a") {
        const parsedDate = parse(dateString, format, new Date());
        return isValid(parsedDate);
    }

    async isValidUrl(url: string) {
        const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
        return regex.test(url);
    };

    async swapAndShift(array: any[], index1: number, index2: number) {
        if (index1 < 0 || index1 >= array.length || index2 < 0 || index2 >= array.length) {
            throw new Error('Index out of bounds');
        }
        const [element] = array.splice(index1, 1);
        array.splice(index2, 0, element);
        return array;
    }

    async sortArray(array: any[], isAscending: boolean = true, type: string = "string") {
        return [...array].sort((a, b) => {
            if (isAscending) {
                return type === 'numeric' ? a - b : a.localeCompare(b, 'en');
            } else {
                return type === 'numeric' ? b - a : b.localeCompare(a, 'en');
            }
        });
    }

    async scrollDownUntilVisible(locator: Locator, boundingBoxLocator: Locator, maxScrollAttempts: number = 15) {
        let scrollAttempts = 0;
        while (scrollAttempts < maxScrollAttempts) {
            if (await locator.isVisible()) {
                return true;
            }
            const box = await boundingBoxLocator.boundingBox();
            if (!box) {
                throw new Error("Element is not found on the page.");
            }
            await this.page.mouse.wheel(0, box.height / 2);
            scrollAttempts++;
            await this.page.waitForTimeout(100);
        }
        return false;
    }
}
