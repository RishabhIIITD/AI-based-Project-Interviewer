// Google Sheets Integration for recording interview stats
import { google } from 'googleapis';
import { storage } from './storage';

const SPREADSHEET_ID_KEY = 'google_spreadsheet_id';
const SPREADSHEET_URL_KEY = 'google_spreadsheet_url';

let connectionSettings: any;
let spreadsheetId: string | null = null;
let spreadsheetUrl: string | null = null;
let initialized = false;

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

export function getSpreadsheetUrl(): string | null {
  return spreadsheetUrl;
}

export function isInitialized(): boolean {
  return initialized;
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

async function createSpreadsheet(): Promise<{ id: string; url: string }> {
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
  const newSpreadsheetUrl = `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`;
  
  console.log(`[GoogleSheets] Created new spreadsheet: ${newSpreadsheetUrl}`);
  
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
  return { id: newSpreadsheetId, url: newSpreadsheetUrl };
}

async function verifySpreadsheetAccess(sheetId: string): Promise<boolean> {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    return true;
  } catch (error) {
    return false;
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function waitForInitialization(maxWaitMs: number = 10000): Promise<boolean> {
  const startTime = Date.now();
  while (!initialized && Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return initialized;
}

export async function recordInterviewStats(stats: InterviewStatsRow): Promise<void> {
  // Wait for initialization if not ready yet
  if (!initialized) {
    console.log('[GoogleSheets] Waiting for initialization...');
    const ready = await waitForInitialization();
    if (!ready || !spreadsheetId) {
      console.error('[GoogleSheets] Spreadsheet not initialized after waiting, stats will not be recorded');
      console.error('[GoogleSheets] Lost stats for interview:', stats.interviewId);
      return;
    }
  }

  let lastError: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
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
        spreadsheetId: spreadsheetId!,
        range: 'Interviews!A:L',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values
        }
      });

      console.log(`[GoogleSheets] Successfully recorded stats for interview ${stats.interviewId}`);
      return;
    } catch (error: any) {
      lastError = error;
      console.error(`[GoogleSheets] Attempt ${attempt}/${MAX_RETRIES} failed:`, error.message || error);
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }
  
  console.error('[GoogleSheets] All retry attempts failed for interview:', stats.interviewId);
  console.error('[GoogleSheets] Last error:', lastError?.message || lastError);
}

export async function initializeSpreadsheet(): Promise<void> {
  try {
    // Check if we have an existing spreadsheet ID in the database
    const existingId = await storage.getSetting(SPREADSHEET_ID_KEY);
    const existingUrl = await storage.getSetting(SPREADSHEET_URL_KEY);
    
    if (existingId && existingUrl) {
      // Verify we still have access to this spreadsheet
      const hasAccess = await verifySpreadsheetAccess(existingId);
      if (hasAccess) {
        spreadsheetId = existingId;
        spreadsheetUrl = existingUrl;
        initialized = true;
        console.log(`[GoogleSheets] Using existing spreadsheet: ${spreadsheetUrl}`);
        return;
      } else {
        console.log('[GoogleSheets] Lost access to existing spreadsheet, creating new one');
      }
    }
    
    // Create a new spreadsheet
    const { id, url } = await createSpreadsheet();
    spreadsheetId = id;
    spreadsheetUrl = url;
    
    // Persist the IDs
    await storage.setSetting(SPREADSHEET_ID_KEY, id);
    await storage.setSetting(SPREADSHEET_URL_KEY, url);
    
    initialized = true;
    console.log(`[GoogleSheets] Initialized with spreadsheet ID: ${spreadsheetId}`);
    console.log(`[GoogleSheets] View your interview stats at: ${spreadsheetUrl}`);
  } catch (error: any) {
    console.error('[GoogleSheets] Failed to initialize spreadsheet:', error.message || error);
  }
}
