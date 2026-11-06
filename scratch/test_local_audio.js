const { spawn } = require('child_process');

async function testLocalAudio() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    'file:///g:/Mi%20unidad/PC/Sistemas/pagina_radio/index.html'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://localhost:9226/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url && t.url.includes('pagina_radio'));
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

    await send('Runtime.enable');

    console.log('1. Clicking Play...');
    let res = await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('btnHeroPlay').click();
        const a = document.getElementById('miRadio');
        return { isPlaying: !a.paused, src: a.src };
      })()`,
      returnByValue: true
    });
    console.log('Play 1 response:', res.result.value);

    await new Promise(r => setTimeout(r, 3000));

    res = await send('Runtime.evaluate', {
      expression: `(() => {
        const a = document.getElementById('miRadio');
        return { paused: a.paused, currentTime: a.currentTime, readyState: a.readyState };
      })()`,
      returnByValue: true
    });
    console.log('Audio after 3s:', res.result.value);

    console.log('2. Clicking Pause...');
    res = await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('btnHeroPlay').click();
        const a = document.getElementById('miRadio');
        return { isPlaying: !a.paused };
      })()`,
      returnByValue: true
    });
    console.log('Pause response:', res.result.value);

    await new Promise(r => setTimeout(r, 1500));

    console.log('3. Clicking Play Again...');
    res = await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('btnHeroPlay').click();
        const a = document.getElementById('miRadio');
        return { isPlaying: !a.paused, src: a.src };
      })()`,
      returnByValue: true
    });
    console.log('Play 2 response:', res.result.value);

    await new Promise(r => setTimeout(r, 3000));

    res = await send('Runtime.evaluate', {
      expression: `(() => {
        const a = document.getElementById('miRadio');
        return { paused: a.paused, currentTime: a.currentTime, readyState: a.readyState, error: a.error };
      })()`,
      returnByValue: true
    });
    console.log('Audio 3s after Play Again:', res.result.value);

    ws.close();
  } catch (e) {
    console.error('Audio test failed:', e);
  } finally {
    chrome.kill();
  }
}

testLocalAudio();

