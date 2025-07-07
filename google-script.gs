const SPREADSHEET_ID = 'google_sheet_id';

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Guest List");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const guests = [];

  for (let i = 1; i < data.length; i++) {
    let row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    guests.push(row);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    guests: guests
  })).setMimeType(ContentService.MimeType.JSON);
}


function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000); // Wait a maximum of 5 seconds.

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Guest List");
    const range = sheet.getDataRange();
    const data = range.getValues(); // Full sheet data in memory
    const headers = data[0];

    const body = JSON.parse(e.postData.contents);
    const namesToCheckIn = body.names;
    const newMessageText = body.message ? body.message.trim() : ""; // Trim and handle empty message
    const timestamp = new Date();

    // Get all the column indexes we need
    const nameIdx = headers.indexOf("name");
    const partyIdIdx = headers.indexOf("party_id"); 
    const checkInIdx = headers.indexOf("checked_in");
    const messageIdx = headers.indexOf("message");
    const timeIdx = headers.indexOf("timestamp");

    // Validate that all required columns exist
    if ([nameIdx, partyIdIdx, checkInIdx, messageIdx, timeIdx].includes(-1)) {
      throw new Error("A required column (name, party_id, checked_in, message, timestamp) is missing from the sheet.");
    }

    let successfullyCheckedIn = [];
    let updated = false;

    // --- START OF SIMPLIFIED LOGIC ---

    // Find the main guest for this submission to attach the message.
    // We'll attach the message to the row of the FIRST person in the party list.
    const mainGuestName = namesToCheckIn[0];
    let mainGuestRowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][nameIdx] === mainGuestName) {
            mainGuestRowIndex = i;
            break;
        }
    }

    // If a new message was submitted, append it using a pipe delimiter.
    if (newMessageText && mainGuestRowIndex !== -1) {
        const existingMessage = data[mainGuestRowIndex][messageIdx];
        
        if (existingMessage) {
            // Append with a delimiter if a message already exists
            data[mainGuestRowIndex][messageIdx] = existingMessage + " | " + newMessageText;
        } else {
            // Otherwise, just set the new message
            data[mainGuestRowIndex][messageIdx] = newMessageText;
        }
        updated = true;
    }

    // Now, loop through and mark everyone from the submission as checked in.
    for (let i = 1; i < data.length; i++) {
      const currentName = data[i][nameIdx];
      if (namesToCheckIn.includes(currentName)) {
        // Only update if not already checked in to preserve the original check-in time
        if (data[i][checkInIdx] !== true) {
            data[i][checkInIdx] = true;
            data[i][timeIdx] = timestamp;
            updated = true;
        }
        successfullyCheckedIn.push(currentName);
      }
    }
    
    // --- END OF SIMPLIFIED LOGIC ---

    if (updated) {
      range.setValues(data); // Write the entire modified data array back once.
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      checkedIn: successfullyCheckedIn
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}