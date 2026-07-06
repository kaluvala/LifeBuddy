import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        # 1. Capture Dashboard
        await page.goto('http://localhost:8000')
        await page.wait_for_timeout(1000)
        
        # Login
        await page.fill('#auth-username', 'LifebuddyQA')
        await page.fill('#auth-password', 'Lifebuddydemo')
        await page.click('button:has-text("Login")')
        
        # Wait for dashboard to load
        await page.wait_for_selector('text=Task Buddy', timeout=10000)
        await page.wait_for_timeout(2000)  # Wait for animations and data
        
        assets_dir = r"c:\Users\kaluv\OneDrive\מסמכים\AI\GoogleAI\LifeBuddy\assets"
        os.makedirs(assets_dir, exist_ok=True)
        
        await page.screenshot(path=os.path.join(assets_dir, "dashboard.png"))
        print("Dashboard screenshot saved.")
        
        # 2. Capture Policy Server Terminal Mockup
        html_content = """
        <html>
        <body style="background: #1e1e1e; color: #d4d4d4; font-family: 'Consolas', 'Courier New', monospace; font-size: 16px; padding: 20px; margin: 0; line-height: 1.5;">
            <div><span style="color: #569cd6;">lifebuddy</span>@<span style="color: #4ec9b0;">policy-server</span>:~$ ./start_interceptor.sh</div>
            <div style="color: #ce9178;">[INFO] Policy Server Listening on port 8001...</div>
            <div style="color: #ce9178;">[INFO] Agent Request Intercepted: PlannerAgent -> GoogleCalendarMCP</div>
            <div style="color: #ce9178;">[INFO] Scanning Payload for PII...</div>
            <div style="color: #f44747; font-weight: bold;">[ERROR] Structural Gating Violation: PII Detected (Unmasked Email).</div>
            <div style="color: #f44747; font-weight: bold;">[BLOCK] Action Halted. Requesting Human Logic Review.</div>
            <div><span style="color: #569cd6;">lifebuddy</span>@<span style="color: #4ec9b0;">policy-server</span>:~$ <span style="animation: blink 1s step-end infinite;">&#9608;</span></div>
            <style>
                @keyframes blink { 50% { opacity: 0; } }
            </style>
        </body>
        </html>
        """
        await page.set_content(html_content)
        await page.set_viewport_size({"width": 800, "height": 300})
        await page.wait_for_timeout(500)
        await page.screenshot(path=os.path.join(assets_dir, "policy_server.png"))
        print("Policy Server screenshot saved.")

        await browser.close()

asyncio.run(run())
