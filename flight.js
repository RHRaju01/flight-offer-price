"use strict";
// Import searchData
import { searchData } from "./script.js";
// Declare flightResponse globally to access in console
let flightResponse;
// Replace with your actual Amadeus API Key and Secret
const clientId = "lYKNbtENrgAoP5c25WrTs2AknjxlXfiW";
const clientSecret = "j3lEN0qQAVCJXxOT";

async function getAccessToken() {
  try {
    const response = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = response.data.access_token;
    console.log("Access Token:", accessToken);
    return accessToken;
  } catch (error) {
    console.error(
      "Error fetching access token:",
      error.response ? error.response.data : error.message
    );
  }
}

async function getFlightOffers(accessToken) {
  try {
    flightResponse = await axios.get(
      "https://test.api.amadeus.com/v2/shopping/flight-offers",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          originLocationCode: searchData.originLocationCode, // Origin airport (e.g., JFK for New York)
          destinationLocationCode: searchData.destinationLocationCode, // Destination airport (e.g., LAX for Los Angeles)
          departureDate: searchData.departureDate, // Departure date (YYYY-MM-DD format)
          adults: searchData.adults, // Number of adult passengers
          children: searchData.children,
          infants: searchData.infants,
          nonStop: false, // Set to true if you only want direct flights
          //max: 5, // Maximum number of flight offers to return
          currencyCode: "BDT",
          //  includedAirlineCodes: "KU",
        },
      }
    );

    console.log("Flight Offers:", flightResponse.data);
  } catch (error) {
    console.error(
      "Error fetching flight offers:",
      error.response ? error.response.data : error.message
    );
  }
}

async function main() {
  const accessToken = await getAccessToken();
  if (accessToken) {
    await getFlightOffers(accessToken);
  }
}

// Fetches flight information for user queries
document.querySelector(".search-button").addEventListener("click", async () => {
  await main();
});
