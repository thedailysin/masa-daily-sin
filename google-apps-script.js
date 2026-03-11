// ─────────────────────────────────────────────────────────────
// MASA — Daily Sin Confessional
// Google Apps Script webhook — Flat row per user
// ─────────────────────────────────────────────────────────────
// Sheet: 1gPGhA7YXo73PE6OtmU0GoCG6nYQrSCryhzhfhl8JIBc
// One row per user. Columns: Timestamp, Session ID, Name, 
// Phone, Email, then one column per question ID (Q01–Q13)
// showing L or R for their answer.
// ─────────────────────────────────────────────────────────────

const SPREADSHEET_ID = '1gPGhA7YXo73PE6OtmU0GoCG6nYQrSCryhzhfhl8JIBc';

// Fixed question IDs in order — must match index.html
const QUESTION_IDS = [
  'Q01','Q02','Q03','Q04','Q05',
  'Q06','Q07','Q08','Q09','Q10',
  'Q11','Q12','Q13'
];

const HEADERS = [
  'Timestamp', 'Session ID', 'Name', 'Phone', 'Email',
  ...QUESTION_IDS
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet(ss, 'Confessions', HEADERS);

    // Build answer map: { Q01: 'L', Q03: 'R', ... }
    const answerMap = {};
    (data.answers || []).forEach(a => {
      answerMap[a.qid] = a.chose === 'left' ? 'L' : 'R';
    });

    // One flat row — fill blank if question wasn't reached
    const row = [
      data.timestamp || new Date().toISOString(),
      data.session_id || '',
      data.name || '',
      data.phone || '',
      data.email || '',
      ...QUESTION_IDS.map(id => answerMap[id] || '')
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    const range = sheet.getRange(1, 1, 1, headers.length);
    range.setFontWeight('bold').setBackground('#2D6A2D').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

// ── RUN THIS to verify setup ──
function debugSetup() {
  Logger.log('Opening spreadsheet...');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  Logger.log('Name: ' + ss.getName());

  const sheet = getOrCreateSheet(ss, 'Confessions', HEADERS);
  Logger.log('Sheet ready: ' + sheet.getName());

  // Write a test row
  const testAnswers = [
    { qid: 'Q01', chose: 'right' },
    { qid: 'Q02', chose: 'left' },
    { qid: 'Q03', chose: 'right' },
    { qid: 'Q07', chose: 'left' },
    { qid: 'Q11', chose: 'right' },
  ];
  const answerMap = {};
  testAnswers.forEach(a => { answerMap[a.qid] = a.chose === 'left' ? 'L' : 'R'; });

  const row = [
    new Date().toISOString(), 'TEST001', 'Test User', '9999999999', 'test@masa.com',
    ...QUESTION_IDS.map(id => answerMap[id] || '')
  ];
  sheet.appendRow(row);
  Logger.log('Test row written. Check your sheet — Confessions tab.');
}
