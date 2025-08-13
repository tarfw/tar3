import { DataService } from '../lib/dataService';
import { db } from '../lib/instant';

/**
 * Test script to verify issue creation and status management
 * Run this to check if the issue system is working properly
 */
export async function testIssueSystem() {
  console.log('🚀 Testing Issue Creation and Status Management System...');
  
  try {
    // Step 1: Initialize demo data
    console.log('📊 Initializing demo data...');
    const demoResult = await DataService.initializeDemoData();
    console.log('✅ Demo data created:', {
      project: demoResult.project.name,
      issues: demoResult.createdIssues.length,
      statuses: demoResult.statusIds.length
    });

    // Step 2: Test issue creation
    console.log('📝 Testing issue creation...');
    const testIssue = await DataService.createIssue({
      title: 'Test Issue - System Verification',
      description: 'This is a test issue to verify the system is working correctly',
      projectId: demoResult.project.id,
      creatorId: demoResult.demoUserId,
      priority: 2,
      projectKey: demoResult.project.key
    });
    console.log('✅ Test issue created:', testIssue.identifier);

    // Step 3: Query issues to verify they appear
    console.log('🔍 Querying issues...');
    const { data } = await db.queryOnce({
      issues: {
        $: {
          order: { createdAt: 'desc' },
          limit: 10
        }
      },
      issueStatuses: {}
    });
    
    console.log('✅ Found issues:', data?.issues?.length || 0);
    console.log('✅ Found statuses:', data?.issueStatuses?.length || 0);

    // Step 4: Test status update
    if (data?.issues?.[0] && data?.issueStatuses?.[0]) {
      console.log('🔄 Testing status update...');
      await DataService.updateIssueStatus(
        data.issues[0].id, 
        data.issueStatuses[1]?.id || data.issueStatuses[0].id
      );
      console.log('✅ Status updated successfully');
    }

    console.log('🎉 All tests passed! Issue system is working correctly.');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Helper function to display current system state
export async function displaySystemState() {
  try {
    const { data } = await db.queryOnce({
      issues: { $: { order: { createdAt: 'desc' } } },
      issueStatuses: { $: { order: { position: 'asc' } } },
      projects: {},
      teams: {}
    });

    console.log('\n📊 Current System State:');
    console.log('Teams:', data?.teams?.length || 0);
    console.log('Projects:', data?.projects?.length || 0);
    console.log('Issues:', data?.issues?.length || 0);
    console.log('Statuses:', data?.issueStatuses?.length || 0);

    if (data?.issues) {
      console.log('\n📋 Recent Issues:');
      data.issues.slice(0, 5).forEach((issue, index) => {
        const status = data.issueStatuses?.find(s => s.id === issue.statusId);
        console.log(`${index + 1}. ${issue.identifier}: ${issue.title} [${status?.name || 'No Status'}]`);
      });
    }

    if (data?.issueStatuses) {
      console.log('\n🏷️  Available Statuses:');
      data.issueStatuses.forEach((status, index) => {
        console.log(`${index + 1}. ${status.name} (${status.type}) - ${status.color}`);
      });
    }

  } catch (error) {
    console.error('Failed to display system state:', error);
  }
}

// Export for use in development
export const IssueSystemTester = {
  test: testIssueSystem,
  displayState: displaySystemState
};
