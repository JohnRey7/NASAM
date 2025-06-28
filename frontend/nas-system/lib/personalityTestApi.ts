export async function startPersonalityTest() {
  const res = await fetch('/api/personality-test/start', { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to start test');
  return res.json();
}

export async function answerPersonalityTest(answers: { questionId: string, answer: string }[]) {
  const res = await fetch('/api/personality-test/answer', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answers),
  });
  if (!res.ok) throw new Error('Failed to submit answers');
  return res.json();
}

export async function stopPersonalityTest() {
  const res = await fetch('/api/personality-test/stop', { method: 'GET', credentials: 'include' });
  if (!res.ok) throw new Error('Failed to stop test');
  return res.json();
} 