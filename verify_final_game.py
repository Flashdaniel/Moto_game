import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        await page.goto('http://localhost:5174')
        await page.wait_for_timeout(2000)

        # Click Start
        await page.click('#start-button')
        await page.wait_for_timeout(1000)

        # Drive forward with Nitro
        await page.keyboard.down('w')
        await page.keyboard.down('Shift')
        await page.wait_for_timeout(2000)

        await page.screenshot(path='game_play_v3.png')

        # Steering test
        await page.keyboard.down('a')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='game_play_v3_turn.png')

        await page.keyboard.up('a')
        await page.keyboard.up('Shift')
        await page.keyboard.up('w')

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
