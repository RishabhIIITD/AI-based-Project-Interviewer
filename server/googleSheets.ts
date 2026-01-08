// Google Sheets Integration for recording interview stats
import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

const SPREADSHEET_ID = '1vFJOmT8Ec-oUAYknmLC0-9wGMF0m36iSPAptcU567wU';

export type InterviewStatsRow = {
  interviewId: number;
  studentName: string;
  studentEmail: string;
  projectTitle: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  overallScore: number;
  responseCount: number;
  strengths: string;
  weaknesses: string;
  revisionTopics: string;
};

export async function recordInterviewStats(stats: InterviewStatsRow): Promise<void> {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    const values = [[
      stats.interviewId,
      stats.studentName,
      stats.studentEmail,
      stats.projectTitle,
      stats.startTime,
      stats.endTime,
      stats.durationMinutes,
      stats.overallScore,
      stats.responseCount,
      stats.strengths,
      stats.weaknesses,
      stats.revisionTopics
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:L',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values
      }
    });

    console.log(`[GoogleSheets] Successfully recorded stats for interview ${stats.interviewId}`);
  } catch (error) {
    console.error('[GoogleSheets] Failed to record interview stats:', error);
  }
}

export async function ensureHeaderRow(): Promise<void> {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    // First, get spreadsheet info to find the first sheet name
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });
    
    const firstSheetTitle = spreadsheetInfo.data.sheets?.[0]?.properties?.title || 'Sheet1';
    console.log(`[GoogleSheets] Using sheet: ${firstSheetTitle}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${firstSheetTitle}!A1:L1`
    });

    if (!response.data.values || response.data.values.length === 0) {
      const headers = [[
        'Interview ID',
        'Student Name',
        'Student Email',
        'Project Title',
        'Start Time',
        'End Time',
        'Duration (mins)',
        'Overall Score',
        'Response Count',
        'Strengths',
        'Weaknesses',
        'Revision Topics'
      ]];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${firstSheetTitle}!A1:L1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: headers
        }
      });

      console.log('[GoogleSheets] Header row created');
    }
  } catch (error: any) {
    if (error.status === 404) {
      console.error('[GoogleSheets] Spreadsheet not found or not accessible. Make sure the spreadsheet is shared with the connected Google account.');
      console.error('[GoogleSheets] Spreadsheet ID:', SPREADSHEET_ID);
    } else if (error.status === 403) {
      console.error('[GoogleSheets] Permission denied. The connected Google account needs Editor access to this spreadsheet.');
    } else {
      console.error('[GoogleSheets] Failed to ensure header row:', error.message || error);
      console.error('[GoogleSheets] Error details:', JSON.stringify(error.response?.data || error.errors || {}, null, 2));
    }
  }
}
