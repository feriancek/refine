// (MI) JS has classes and simplifies can simplify youre "domain" knowldge.
// you gain centralized functions for stuff like toJSON and isValid.
//
// These could be free floating functions just fine, but the context here is
// contained within its self. As the codebase grows, you're not juggling disparate
// functions scattered over several files (or: one fucking massive one).
//
// I also suspect chatGPT will handle this better but its not backed up by data.
class LogEntry {
  constructor(rpm, temperature, particleSize, notes, entryTime) {
    this.rpm = parseInt(rpm);
    this.temperature = parseInt(temperature);
    this.particleSize = parseInt(particleSize);
    this.notes = notes;
    this.entryTime = entryTime;
  }

  // Static because you don't have an instance to use when you wan to create one from JSON
  static fromJSON(json) {
    let obj = JSON.parse(json);
    return new LogEntry(
      obj.rpm,
      obj.temperature,
      obj.particleSize,
      obj.notes,
      obj.entryTime,
    );
  }

  // (MI) You would do something similar to this function for "toCSV"
  toJSON() {
    return JSON.stringify({
      rpm: this.rpm,
      temperature: this.temperature,
      particleSize: this.particleSize,
      notes: this.notes,
      entryTime: this.entryTime,
    });
  }

  // (MI) I don't like this name but I don't have enough tme to agnonize over it.
  // This centralizes your printing logic, toJSON, toCSV, toHTML, etc.
  //
  // Also i made it less shitty
  toBatchItemHtml() {
    let html = `<div class="log-entry">`;
    let timeStamp = new Date(this.entryTime);
    let options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZone: "America/Halifax",
    };

    html += `<p><strong>${timeStamp.toLocaleString(
      "en-CA",
      options,
    )}</strong></p>`;
    // (MI) ternary operator, look it up they're sick.
    html += this.rpm ? `<p><strong>RPM:</strong> ${this.rpm}</p>` : "";
    html += this.temperature
      ? `<p><strong>Temp:</strong> ${this.temperature}</p>`
      : "";
    html += this.particleSize
      ? `<p><strong>Particle Size:</strong> ${this.particleSize}</p>`
      : "";
    html += this.notes ? `<p><strong>Notes:</strong> ${this.notes}</p>` : "";
    html += `<hr></div>`;

    return html;
  }

  isValid() {
    // [SF] input is validated inline, this checks for the null
    return this.rpm;
  }
}
function validateNumber(input) {
  input.value = input.value.replace(/[^0-9]/g, ""); // Remove non-numeric characters
}

function logData() {
  // Get values from input fields
  var rpm = document.getElementById("rpm").value;
  var temperature = document.getElementById("temperature").value;
  var particleSize = document.getElementById("particleSize").value;
  var notes = document.getElementById("notes").value;
  var entryTime = new Date().getTime();
  var logEntry = new LogEntry(rpm, temperature, particleSize, notes, entryTime);

  if (!logEntry.isValid()) {
    alert("RPM is required, numbers only");
    return;
  }

  // Save data to local storage with a unique key
  var logKey = "logEntry_" + logEntry.entryTime;
  localStorage.setItem(logKey, logEntry.toJSON());

  // Display all log entries and batch information for the entered batch ID
  displayAllLogEntries();
  displayBatchInfo();

  // Clear input fields after saving the log entry
  clearForm();
}

function displayAllLogEntries() {
  // Retrieve log entries
  var logEntries = loadEntries();

  logEntries.sort(function (a, b) {
    return a.entryTime - b.entryTime; // Sort by Unix time
  });

  // Display all log entries
  var logContent = document.getElementById("logContent");
  logContent.innerHTML = "";

  for (var i = 0; i < logEntries.length; i++) {
    logContent.innerHTML += logEntries[i].toBatchItemHtml();
		console.log(logEntries[i].toJSON()); 
  }
  // Show the log entries div
  document.getElementById("logEntries").style.display = "block";
}

function displayBatchInfo() {
  var totalRevolutions = calculateTotalRevolutions(loadEntries());
  var averageRPM = calculateAverageRPM(loadEntries());

  document.getElementById("averageRPM").innerText = averageRPM.toFixed(0);
  document.getElementById("totalRevolutions").innerText =
    totalRevolutions.toPrecision(5);

  // Show the batch information div
  document.getElementById("batchInfo").style.display = "block";
}

function calculateTotalRevolutions(logEntries) {
  var totalRevolutions = 0;
  // Sort log entries by entry time
  logEntries.sort(function (a, b) {
    return a.entryTime - b.entryTime;
  });
  for (var i = 1; i < logEntries.length; i++) {
    var timeDifferenceInHours =
      (logEntries[i].entryTime - logEntries[i - 1].entryTime) / 3600000; // Miliseconds to hours
    var revolutions = logEntries[i - 1].rpm * timeDifferenceInHours * 60; // Convert hours to minutes for RPM

    totalRevolutions += revolutions;
  }
  return totalRevolutions;
}

function clearEntries() {
  localStorage.clear();
}

function clearForm() {
  document.getElementById("rpm").value = "";
  document.getElementById("temperature").value = "";
  document.getElementById("particleSize").value = "";
  document.getElementById("notes").value = "";
}

// remove comments never
function loadEntries() {
  return Object.keys(localStorage) // Get all keys in localstorage
    .filter((key) => key.startsWith("logEntry_"))
    .map((key) => {
      //"For each key...."
      try {
        let entryJson = localStorage.getItem(key); // Get the JSON
        return LogEntry.fromJSON(entryJson); // Attempt to create a LogEntry from it
      } catch (error) {
        console.error(`Error parsing log entry for key ${key}:`, error);
        return null;
      }
    })
    .filter((entry) => entry !== null); //returns an array of LogEntry
}

function calculateAverageRPM(logEntries) {
  if (logEntries.length == 0) {
    return 0;
  }

  let totalRPM = logEntries.reduce((sum, entry) => sum + entry.rpm, 0);
  let avg = totalRPM / logEntries.length;
  return avg;
}

function displayTotalRuntime() {
  let logEntries = loadEntries();
  if (logEntries.length === 0) {
    return; // No entries, no runtime to display.
  }

  let firstEntryTime = Math.min(...logEntries.map((entry) => entry.entryTime));

  // Start updating the runtime every second
  setInterval(() => {
    updateRuntime(firstEntryTime);
  }, 1000);
}

function updateRuntime(firstEntryTime) {
  let currentTime = new Date().getTime();
  let runtime = new Date(currentTime - firstEntryTime);

  // Format runtime as HH:MM:SS
  let formattedRuntime = runtime.toISOString().substr(11, 8);

  // Directly update the 'totalRuntime' element
  document.getElementById("totalRuntime").innerText = formattedRuntime;
}

displayTotalRuntime();
