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
    console.log("Access Token:", accessToken);
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

    // console.log("Flight Offers:", flightResponse.data);
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
          <svg class="logo" viewBox="0 0 40 40" fill="#ef4444">
            <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm5 30h-10v-4h10v4zm0-8h-10v-4h10v4zm0-8h-10v-4h10v4z" />
          </svg>
          <div class="airline">${airlineName}</div>
          <div class="flight-info">
            <div>
              <div class="depart">Depart</div>
              <div class="time">${formatTime(departureTime)}</div>
              <div class="date">${formatDate(departureDate)}</div>
              <div class="location">${fromLocation.value.toUpperCase()}</div>
            </div>
            <div class="duration">
              <div class="total-duration">${formatDuration(
                flightDuration
              )}</div>
              <div class="arrow"></div>
              <div class="stop-info">${stopsLocation}</div>
            </div>
            <div>
              <div class="arrive">Arrive</div>
              <div class="time">${formatTime(arrivalTime)}</div>
              <div class="date">${formatDate(arrivalDate)}</div>
              <div class="location">${toLocation.value.toUpperCase()}</div>
            </div>
          </div>
          <div class="price-section">
            <div>
              <div class="price-label">Price</div>
              <div class="price">${priceCurrency} ${totalPrice}</div>
              <div class="refund-status">Partially Refundable</div>
            </div>
            <button class="book-button">Book Now</button>
          </div>
          <div class="details-button">Flight Details ▼</div>
        </div>
      `;

      // Add the card to the container
      bookingCardsContainer.insertAdjacentHTML("beforeend", cardHTML);

      // Console log for debugging
      console.log(`Offer ${i + 1}:
        Price: ${priceCurrency} ${totalPrice}
        Flight Duration: ${formatDuration(flightDuration)}
        Airline name: ${airlineName}
        Departure Time: ${formatTime(departureTime)}
        Departure Date: ${formatDate(departureDate)}
        Departure Airport: ${toLocation.value.toUpperCase()}
        Arrival Time: ${formatTime(arrivalTime)}
        Arrival Date: ${formatDate(arrivalDate)}
        Arrival Airport: ${toLocation.value.toUpperCase()}
        Transit: ${stopsLocation} 
 
      `);
    }

    // Show all cards after data is loaded
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => (card.style.display = "block"));
  }
}
