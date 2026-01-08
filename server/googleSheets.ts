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

let spreadsheetId: string | null = null;
let spreadsheetUrl: string | null = null;

export function getSpreadsheetUrl(): string | null {
  return spreadsheetUrl;
}

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

async function createSpreadsheet(): Promise<string> {
  const sheets = await getUncachableGoogleSheetClient();
  
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'Interview Statistics'
      },
      sheets: [{
        properties: {
          title: 'Interviews'
        }
      }]
    }
  });

  const newSpreadsheetId = response.data.spreadsheetId!;
  spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`;
  
  console.log(`[GoogleSheets] Created new spreadsheet: ${spreadsheetUrl}`);
  
  // Add header row
  await sheets.spreadsheets.values.update({
    spreadsheetId: newSpreadsheetId,
    range: 'Interviews!A1:L1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
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
      ]]
    }
  });

  console.log('[GoogleSheets] Header row created');
  return newSpreadsheetId;
}

export async function recordInterviewStats(stats: InterviewStatsRow): Promise<void> {
  try {
    if (!spreadsheetId) {
      console.log('[GoogleSheets] Spreadsheet not initialized, skipping recording');
      return;
    }

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
      spreadsheetId: spreadsheetId,
      range: 'Interviews!A:L',
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

export async function initializeSpreadsheet(): Promise<void> {
  try {
    spreadsheetId = await createSpreadsheet();
    console.log(`[GoogleSheets] Initialized with spreadsheet ID: ${spreadsheetId}`);
    console.log(`[GoogleSheets] View your interview stats at: ${spreadsheetUrl}`);
  } catch (error: any) {
    console.error('[GoogleSheets] Failed to initialize spreadsheet:', error.message || error);
  }
}
