from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # Start Game
    page.click("button:has-text('START')")
    page.wait_for_timeout(3000) # Wait for countdown

    # 1. Take initial state screenshot
    page.screenshot(path="/home/jules/verification/screenshots/fix_start.png")

    # 2. Drive Forward and check orientation
    page.keyboard.down('w')
    for i in range(5):
        page.wait_for_timeout(1000)
        page.screenshot(path=f"/home/jules/verification/screenshots/fix_drive_{i}.png")

    # 3. Check if bike is upright after some movement
    page.keyboard.up('w')
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/fix_final_upright.png")

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 1280, 'height': 720}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
