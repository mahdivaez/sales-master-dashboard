// lib/clickup-client.ts
export async function getClickUpTeams(apiKey: string) {
  try {
    const response = await fetch('https://api.clickup.com/api/v2/team', {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ClickUp API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ClickUp teams:', error);
    throw error;
  }
}