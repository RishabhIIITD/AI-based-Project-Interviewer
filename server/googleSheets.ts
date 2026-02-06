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

export async function recordInterviewStats(stats: InterviewStatsRow) {
    // Placeholder for now as it depends on Replit env
    console.log("Recording stats (mock):", stats);
}

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
  return { id: newSpreadsheetId, url: newSpreadsheetUrl };
}

export type QuestionRow = {
  id: string;
  question: string;
  topic: string;
  difficulty: string;
};

export async function fetchQuestionsFromSheet(): Promise<QuestionRow[]> {
  const SHEET_ID = '1KZJTr_Pd7B9CwP3-IvYFlgXo6VNqMdwMtXFJE5FgZcc';
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&t=${Date.now()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }
    const text = await response.text();
    
    // Simple CSV parser handling quotes
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentCell.trim());
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.length > 0) rows.push(currentRow);
    }

    // Skip header and map
    const dataRows = rows.slice(1);
    
    return dataRows.map(row => ({
      id: row[0] || '',
      question: row[1] || '',
      topic: row[2] || '',
      difficulty: row[3] || ''
    })).filter(q => q.question && q.question.trim().length > 0);
    
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}
