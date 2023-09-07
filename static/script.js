document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("urlForm");
    const resultDiv = document.getElementById("result");
    const confirmationDiv = document.getElementById("confirmation");  // Create a div in your HTML with this id to show the confirmation message


//// Initialize a text area to hold the channel IDs
//const channelIDTextArea = document.createElement("textarea");
//channelIDTextArea.rows = 10;
//channelIDTextArea.cols = 50;
//channelIDTextArea.id = "channelIDs";
//document.body.appendChild(channelIDTextArea);

// Function to append a channel ID to the text area
function appendChannelID(channelID) {
    const existingIDs = channelIDTextArea.value.split('\n');
    if (!existingIDs.includes(channelID)) {
        channelIDTextArea.value += channelID + '\n';
    }
}

// Modify existing form submission logic to append channel ID to text area
form.addEventListener("submit", function(event) {
    // Existing form submission logic here...

    // Append channel ID to text area if it exists
    if (data.channel_id) {
        appendChannelID(data.channel_id);
    }
});
form.addEventListener("submit", function(event) {
        event.preventDefault();
        const url = document.getElementById("url").value;

        fetch("/get_channel_id", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: url })
        })
        .then(response => response.json())
        .then(data => {
            if (data.channel_id) {
                document.getElementById("result").textContent = `Channel ID: ${data.channel_id}`;
            } else {
                document.getElementById("result").textContent = `Error: ${data.error}`;
            }
        // Clear the text box
        document.getElementById("url").value = '';

        // Show confirmation message
        confirmationDiv.innerHTML = "Channel submitted!";
        confirmationDiv.style.color = "#007BFF";

        })
        .catch(error => {
            console.error("An error occurred:", error);
            document.getElementById("result").textContent = `An error occurred: ${error}`;
        });
    });
});

// Variable to keep track of the number of submissions
let submissionCount = 0;

// Function to handle the response from the server
function handleServerResponse(response) {
    // Show the "Stop and Download" button when the user starts submitting URLs
    document.getElementById('stop-and-download').style.display = 'block';

    if (response.status === 'closed') {
        // Hide the "Stop and Download" button and show the message and "Download JSON" button when submissions are closed
        document.getElementById('stop-and-download').style.display = 'none';
        document.getElementById('max-submissions-message').style.display = 'block';
        document.getElementById('download-json').style.display = 'block';
    } else {
        // Increment the submission count
        submissionCount++;

        // Check if the submission count has reached the maximum limit
        if (submissionCount >= 10) {
            // Trigger the stop and download
            fetch('/download_json').then(response => response.json()).then(data => {
                // Handle the download response
            });
        }
    }
}


// Event listener for the "Stop and Download" button
document.getElementById('stop-and-download').addEventListener('click', function() {
    // Trigger the stop and download
    fetch('/download_json').then(response => response.json()).then(data => {
        // Handle the download response
    });
});

// Event listener for the "Download JSON" button
document.getElementById('download-json').addEventListener('click', function() {
    // Trigger the download
    window.location.href = '/download_json';
});

// Updating the existing fetch logic to include the new handleServerResponse function
fetch("/get_channel_id", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({url: url})
}).then(response => response.json()).then(data => {
    handleServerResponse(data);
});


// Display the JSON data as text
fetch('/get_json_data').then(response => response.json()).then(data => {
    if (data.status === 'success') {
        const jsonDataStr = JSON.stringify(data.data, null, 2);
        const textarea = document.createElement('textarea');
        textarea.value = jsonDataStr;
        textarea.rows = 10;
        textarea.cols = 50;
        document.body.appendChild(textarea);
    } else {
        console.error(data.message);
    }
});
// Event listener to clear result and confirmation text when the input box is cleared
document.getElementById("url").addEventListener("input", function() {
    if (this.value === "") {
        document.getElementById("result").textContent = "";
        document.getElementById("confirmation").textContent = "";
    }
});
