const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch'); // Import node-fetch for HTTP requests

// Initialize Firebase Admin SDK (required for Firestore triggers)
admin.initializeApp();

// Get Mailchimp API Key and Audience ID from environment configuration
// These are loaded from the variables you set in Step 4.
const MAILCHIMP_API_KEY = functions.config().mailchimp.key;
const MAILCHIMP_AUDIENCE_ID = functions.config().mailchimp.audience_id;

// Mailchimp API key format includes the data center (e.g., YOUR_API_KEY-usX)
// We need to extract this data center for the Mailchimp API URL.
const [apiKeyPart, dataCenter] = MAILCHIMP_API_KEY.split('-');

// This Cloud Function is triggered whenever a new document is created
// in the 'newsletter_subscribers' collection within your app's public data.
exports.addSubscriberToMailchimp = functions.firestore
    .document('artifacts/{appId}/public/data/newsletter_subscribers/{docId}')
    .onCreate(async (snap, context) => {
        const subscriberData = snap.data(); // Get the data of the new Firestore document
        const email = subscriberData.email; // Extract the email address

        // Basic validation: ensure an email exists
        if (!email) {
            console.log('No email found in subscriber data. Skipping Mailchimp sync.');
            return null; // Exit the function if no email
        }

        // Ensure Mailchimp credentials are available
        if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !dataCenter) {
            console.error('Mailchimp API Key, Audience ID, or Data Center is missing in Firebase config. Cannot add subscriber.');
            return null; // Exit if credentials are not set
        }

        // Construct the Mailchimp API URL
        const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`;

        // Prepare the data payload for Mailchimp
        const data = {
            email_address: email,
            status: 'subscribed', // 'subscribed' for immediate subscription
                                  // 'pending' for double opt-in (Mailchimp sends a confirmation email)
            // You can add more fields if you collect them in your form, e.g.:
            // merge_fields: {
            //     FNAME: 'John',
            //     LNAME: 'Doe'
            // }
        };

        try {
            // Make the API request to Mailchimp
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Mailchimp API requires 'apikey' prefix for authorization
                    'Authorization': `apikey ${MAILCHIMP_API_KEY}`
                },
                body: JSON.stringify(data) // Send the data as JSON
            });

            const responseData = await response.json(); // Parse the JSON response from Mailchimp

            if (response.ok) { // Check if the HTTP response status is 2xx (success)
                console.log(`Successfully added ${email} to Mailchimp audience. Mailchimp ID: ${responseData.id}`);
            } else {
                // Log detailed error from Mailchimp if the request was not successful
                console.error(`Failed to add ${email} to Mailchimp. Status: ${response.status}, Error: ${JSON.stringify(responseData)}`);

                // Handle specific Mailchimp errors, e.g., if member already exists
                if (responseData.title === 'Member Exists') {
                    console.log(`${email} already exists in Mailchimp audience. No action needed.`);
                }
            }
        } catch (error) {
            // Catch any network errors or issues during the fetch operation
            console.error(`Error communicating with Mailchimp API for ${email}:`, error);
        }

        return null; // Cloud Functions should always return null or a Promise
    });
    