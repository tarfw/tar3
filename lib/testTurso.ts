// Test Turso database connection
// This is a simple test to verify the database URL format

const testTursoConnection = async () => {
  const dbName = 'tarframework-3ed9';
  const orgName = 'tarfw';
  
  // Try different URL formats
  const urlsToTry = [
    `https://${dbName}.turso.io`,          // Just database name
    `https://${dbName}-${orgName}.turso.io`, // Database name + org name
  ];
  
  for (const url of urlsToTry) {
    try {
      console.log(`[Test] Trying URL: ${url}`);
      const response = await fetch(`${url}/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_AUTH_TOKEN_HERE`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: 'SELECT 1', params: [] }),
      });
      
      console.log(`[Test] Response status for ${url}: ${response.status}`);
      if (response.ok) {
        console.log(`[Test] Success! Correct URL is: ${url}`);
        break;
      }
    } catch (error) {
      console.log(`[Test] Error for ${url}: ${error.message}`);
    }
  }
};

// Uncomment to run the test
// testTursoConnection();