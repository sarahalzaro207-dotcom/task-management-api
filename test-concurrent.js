const URL = 'http://localhost:3000/api/tasks';

async function countTasks() {
  const res = await fetch(`${URL}?limit=100`);
  const json = await res.json();
  return json.pagination.totalItems;
}

(async () => {
  const before = await countTasks();

  const requests = [];
  for (let i = 1; i <= 20; i++) {
    requests.push(
      fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Concurrent task ${i}` }),
      })
    );
  }
  const responses = await Promise.all(requests);
  console.log('Statuses:', responses.map((r) => r.status).join(' '));

  const after = await countTasks();
  console.log(`Before: ${before}, After: ${after}, Added: ${after - before}`);
  console.log(after - before === 20 ? 'PASS: no lost updates' : 'FAIL: some tasks were lost');
})();