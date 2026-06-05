import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        await page.goto('http://localhost:5174')
        await page.wait_for_timeout(3000)

        await page.evaluate("""
            window.getBikePos = () => ({ x: bikeMesh.position.x, y: bikeMesh.position.y, z: bikeMesh.position.z });
        """)

        # Drive straight and log X position
        await page.keyboard.down('w')
        x_positions = []
        for _ in range(10):
            await page.wait_for_timeout(200)
            pos = await page.evaluate("window.getBikePos()")
            x_positions.append(pos['x'])

        await page.keyboard.up('w')
        print(f"X positions: {x_positions}")

        # Check Left turn
        await page.keyboard.down('w')
        await page.keyboard.down('a')
        await page.wait_for_timeout(1000)
        pos_left = await page.evaluate("window.getBikePos()")
        print(f"Pos Left: {pos_left}")
        await page.keyboard.up('a')
        await page.keyboard.up('w')

        # Check Right turn
        await page.keyboard.down('w')
        await page.keyboard.down('d')
        await page.wait_for_timeout(1000)
        pos_right = await page.evaluate("window.getBikePos()")
        print(f"Pos Right: {pos_right}")
        await page.keyboard.up('d')
        await page.keyboard.up('w')

        await page.screenshot(path='debug_wheels.png')
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
