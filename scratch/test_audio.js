const { spawn } = require('child_process');

async function testAudio() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    'https://radiogravity.web.app'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://localhost:9225/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url && t.url.includes('radiogravity'));
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

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
    });

    await send('Runtime.enable');

    // Click play
    console.log('--- Clicking Play ---');
    let res = await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('btnHeroPlay').click();
        return { isPlaying: !document.getElementById('miRadio').paused, src: document.getElementById('miRadio').src };
      })()`,
      returnByValue: true
    });
    console.log('Play click result:', res.result.value);

    await new Promise(r => setTimeout(r, 3000));

    // Check state
    res = await send('Runtime.evaluate', {
      expression: `(() => {
        const a = document.getElementById('miRadio');
        return { paused: a.paused, currentTime: a.currentTime, readyState: a.readyState, networkState: a.networkState };
      })()`,
      returnByValue: true
    });
    console.log('Audio state after 3s:', res.result.value);

    // Click pause
    console.log('--- Clicking Pause ---');
    res = await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('btnHeroPlay').click();
        return { isPlaying: !document.getElementById('miRadio').paused };
      })()`,
      returnByValue: true
    });
    console.log('Pause click result:', res.result.value);

    await new Promise(r => setTimeout(r, 2000));

    // Click play again
    console.log('--- Clicking Play Again ---');
    res = await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('btnHeroPlay').click();
        return { isPlaying: !document.getElementById('miRadio').paused };
      })()`,
      returnByValue: true
    });
    console.log('Play again click result:', res.result.value);

    await new Promise(r => setTimeout(r, 3000));

    res = await send('Runtime.evaluate', {
      expression: `(() => {
        const a = document.getElementById('miRadio');
        return { paused: a.paused, currentTime: a.currentTime, readyState: a.readyState, networkState: a.networkState, error: a.error ? a.error.message : null };
      })()`,
      returnByValue: true
    });
    console.log('Audio state 3s after play again:', res.result.value);

    ws.close();
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    chrome.kill();
  }
}

testAudio();

