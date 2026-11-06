const { spawn } = require('child_process');
const http = require('http');

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--no-sandbox',
    '--window-size=1920,1080',
    'https://radiogravity.web.app'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://localhost:9224/json/list');
    const tabs = await listRes.json();
    const radioTab = tabs.find(t => t.url && t.url.includes('radiogravity'));
    if (!radioTab) {
      console.log('No radio tab found');
      return;
    }

    const ws = new WebSocket(radioTab.webSocketDebuggerUrl);
    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        const handler = (event) => {
          const parsed = JSON.parse(event.data);
          if (parsed.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(parsed.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise(r => ws.addEventListener('open', r));

    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', msg.params.type, msg.params.args.map(a => a.value || a.description));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('EXCEPTION:', msg.params.exceptionDetails);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    // Evaluate title info
    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const title = document.querySelector('.hero-main-title');
        const chromeSpan = document.querySelector('.text-chrome');
        const holoSpan = document.querySelector('.text-hologram');
        return {
          titleRect: title ? title.getBoundingClientRect() : null,
          chromeRect: chromeSpan ? chromeSpan.getBoundingClientRect() : null,
          holoRect: holoSpan ? holoSpan.getBoundingClientRect() : null,
          chromeComputed: chromeSpan ? {
            display: getComputedStyle(chromeSpan).display,
            color: getComputedStyle(chromeSpan).color,
            webkitTextFillColor: getComputedStyle(chromeSpan).webkitTextFillColor,
            background: getComputedStyle(chromeSpan).backgroundImage,
            opacity: getComputedStyle(chromeSpan).opacity,
            visibility: getComputedStyle(chromeSpan).visibility
          } : null,
          documentFonts: Array.from(document.fonts).map(f => ({ family: f.family, status: f.status }))
        };
      })()`,
      returnByValue: true
    });

    console.log('EVAL INITIAL:', JSON.stringify(evalResult.result.value, null, 2));

    // Now reload page
    console.log('Reloading page...');
    await send('Page.reload', { ignoreCache: false });
    await new Promise(r => setTimeout(r, 2000));

    const evalAfterReload = await send('Runtime.evaluate', {
      expression: `(() => {
        const title = document.querySelector('.hero-main-title');
        const chromeSpan = document.querySelector('.text-chrome');
        const holoSpan = document.querySelector('.text-hologram');
        return {
          titleRect: title ? title.getBoundingClientRect() : null,
          chromeRect: chromeSpan ? chromeSpan.getBoundingClientRect() : null,
          holoRect: holoSpan ? holoSpan.getBoundingClientRect() : null,
          documentFonts: Array.from(document.fonts).map(f => ({ family: f.family, status: f.status }))
        };
      })()`,
      returnByValue: true
    });

    console.log('EVAL AFTER RELOAD:', JSON.stringify(evalAfterReload.result.value, null, 2));

    // Capture screenshot after reload
    const scr = await send('Page.captureScreenshot', { format: 'png' });
    require('fs').writeFileSync('C:\\Users\\giann\\after_reload.png', Buffer.from(scr.data, 'base64'));
    console.log('Screenshot saved to C:\\Users\\giann\\after_reload.png');

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chrome.kill();
  }
}

run();
