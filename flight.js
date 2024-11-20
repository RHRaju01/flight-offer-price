"use strict";

export let flightOffer;

import { searchData, fromLocation, toLocation } from "./script.js";

let flightResponse;

const clientId = "lYKNbtENrgAoP5c25WrTs2AknjxlXfiW";
const clientSecret = "j3lEN0qQAVCJXxOT";

async function getAccessToken() {
  try {
    const responseToken = await axios.post(
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

    const accessToken = responseToken.data.access_token;
    return accessToken;
  } catch (error) {
    console.error(
      "Error fetching access token:",
      error.responseToken ? error.responseToken.data : error.message
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
          travelClass: searchData.travelClass,
          currencyCode: "BDT",
          //  includedAirlineCodes: "KU",
        },
      }
    );

    window.flightResponse = flightResponse.data;
    return flightResponse.data; // Store response data here
  } catch (error) {
    console.error(
      "Error fetching flight offers:",
      error.response ? error.response.data : error.message
    );
  }
}

flightOffer = async function main() {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const flightData = await getFlightOffers(accessToken);
    if (flightData) {
      handleFlightData(flightData); // Call function to handle flight data
    }
  }
};

const formatDuration = function convertTimeString(isoTimeString) {
  // Extract hours and minutes from the string using regex
  const match = isoTimeString.match(/PT(\d+H)?(\d+M)?/);

  if (!match) {
    throw new Error("Invalid time string format");
  }

  // Extract hours and minutes, defaulting to 0 if not present
  const hours = match[1] ? parseInt(match[1].replace("H", ""), 10) : 0;
  const minutes = match[2] ? parseInt(match[2].replace("M", ""), 10) : 0;

  // Construct the output string
  const hoursString = hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : "";
  const minutesString =
    minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : "";

  // Combine with a space if both are present
  return [hoursString, minutesString].filter(Boolean).join(" ");
};

const formatDate = function formatDateString(dateTimeString) {
  // Create a Date object from the date-time string
  const date = new Date(dateTimeString);

  // Array of weekday and month names

  // prettier ignore
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Prettier ignore
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Extract day of the week, date, month, and year
  const dayOfWeek = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  // Return the formatted date string
  return `${dayOfWeek}, ${day} ${month} ${year}`;
};

const formatTime = function formatTimeString(dateTimeString) {
  // Create a Date object from the date-time string
  const date = new Date(dateTimeString);

  // Extract hours and minutes
  const hours = date.getHours(); // Gets the hour in 24-hour format
  const minutes = date.getMinutes(); // Gets the minutes

  // Format hours and minutes with leading zeros if needed
  const formattedHours = hours.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");

  // Return the formatted time string
  return `${formattedHours}:${formattedMinutes}`;
};

// Function to handle flight data
function handleFlightData(flightResponse) {
  // Handle response object
  let flightData = flightResponse.data;
  const flightDictionaries = flightResponse.dictionaries;
  const flightMeta = flightResponse.meta;

  // Get the container where cards will be added
  const bookingCardsContainer = document.querySelector(".booking-card");

  // Clear any existing cards
  bookingCardsContainer.innerHTML = "";

  if (flightData.length > 0) {
    for (let i = 0; i < flightData.length; i++) {
      const flight = flightData[i];

      // Extract flight data
      const airlineCode = flight.validatingAirlineCodes;
      const airlineName = flightDictionaries.carriers[airlineCode];
      const totalPrice = flight.price.grandTotal;
      const priceCurrency = flight.price.currency;
      const departureTime = flight.itineraries[0].segments[0].departure.at;
      const departureDate = flight.itineraries[0].segments[0].departure.at;
      const segmentsArrival = flight.itineraries[0].segments;
      const arrivalTime =
        segmentsArrival[segmentsArrival.length - 1].arrival.at;
      const arrivalDate =
        segmentsArrival[segmentsArrival.length - 1].arrival.at;
      const flightDuration = flight.itineraries[0].duration;
      const numOfStops = flight.itineraries[0].segments.length;
      const stopsLocationExtract = flight.itineraries[0].segments
        .slice(0, -1)
        .map((seg) => seg.arrival.iataCode);
      const stopsLocation =
        numOfStops === 1
          ? "Non Stop"
          : `${stopsLocationExtract.length} Stop${
              stopsLocationExtract.length > 1 ? "s" : ""
            } via ${stopsLocationExtract.join(", ")}`;

      // Create card HTML
      const cardHTML = `
        <div class="card">
        <span class="flight-counter">Flight: ${i + 1}</span>
        <div class="card-header">
          <div class="grid">
            <div class="airline-info">
              <img
                src="/api/placeholder/120/40"
                alt="Airline Logo"
                class="airline-logo"
              />
              <span class="airline-name">${airlineName}</span>
              <span class="refund-status">Partially Refundable</span>
            </div>

            <div class="time-info">
              <span class="description">Depart</span>
              <span class="time">${formatTime(departureTime)}</span>
              <span class="date">${formatDate(departureDate)}</span>
              <span class="airport">${fromLocation.value.toUpperCase()}</span>
            </div>

            <div class="duration">
              <div class="duration-text">${formatDuration(flightDuration)}</div>
              <div class="flight-path">
                <div class="path-line"></div>
              </div>
              <span class="stopover">${stopsLocation}</span>
            </div>

            <div class="time-info">
              <span class="description">Arrive</span>
              <span class="time">${formatTime(arrivalTime)}</span>
              <span class="date">${formatDate(arrivalDate)}</span>
              <span class="airport">${toLocation.value.toUpperCase()}</span>
            </div>

            <div class="price">
              <span class="description">Price</span>
              <span class="price">${priceCurrency} ${totalPrice}</span>
            </div>

            <div class="book-details">
              <button class="book-button">Book Now</button>
              <button class="details-button">
                Flight Details
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      `;

      // Add the card to the container
      bookingCardsContainer.insertAdjacentHTML("beforeend", cardHTML);
    }

    // Show all cards after data is loaded
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => (card.style.display = "block"));
  }
}
