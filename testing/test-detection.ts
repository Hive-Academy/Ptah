import { ClaudeCliDetectorStandalone } from './test-detection-standalone';

async function testClaudeDetection() {
  console.log('🔍 Testing Claude CLI Detection Service...\n');

  const detector = new ClaudeCliDetectorStandalone();

  try {
    console.log('Attempting to detect Claude CLI installation...');
    const installation = await detector.detectClaudeInstallation();

    if (installation) {
      console.log('✅ Claude CLI detected successfully!');
      console.log(`   Path: ${installation.path}`);
      console.log(`   Source: ${installation.source}`);
      console.log(`   Version: ${installation.version || 'Unknown'}`);

      // Test validation
      console.log('\nValidating installation...');
      const isValid = await detector.validateInstallation(installation);
      console.log(`   Validation: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    } else {
      console.log('❌ Claude CLI not found on this system');
      console.log('   To install: npm install -g @anthropic-ai/claude-code');
    }
  } catch (error) {
    console.error('❌ Error during detection:', error instanceof Error ? error.message : error);
  }
}

// Run the test
if (require.main === module) {
  testClaudeDetection();
}
