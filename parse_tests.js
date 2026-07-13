const fs = require('fs');
const data = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));

const failingFiles = [];

data.testResults.forEach(suite => {
  if (suite.status === 'failed') {
    const failedTests = suite.assertionResults.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      console.log(`\nFILE: ${suite.name}`);
      failedTests.forEach(test => {
        console.log(`  - TEST: ${test.title}`);
        console.log(`    ERROR: ${test.failureMessages[0].split('\n')[0]}`);
      });
      failingFiles.push(suite.name);
    }
  }
});
