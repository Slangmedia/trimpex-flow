async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`${url} -> Status: ${res.status}`);
  } catch (err) {
    console.error(`Error checking ${url}:`, err.message);
  }
}

async function main() {
  const calcuttaGlow = "https://flow.trimpexstudio.com/uploads/1779428047789-353300259-1779425499409_555720072_CALCUTTA_GLOW.webp";
  const harmony = "https://flow.trimpexstudio.com/uploads/1779426305440-766092320-HARMONY_003_.png";
  const wacom = "https://flow.trimpexstudio.com/uploads/1779426278468-685524562-WACOM_FOREST.png";

  await checkUrl(calcuttaGlow);
  await checkUrl(harmony);
  await checkUrl(wacom);
}

main();
