"use strict";

export let flightOffer;

import { searchData } from "./script.js";

let flightResponse;

const clientId = "lYKNbtENrgAoP5c25WrTs2AknjxlXfiW";
const clientSecret = "j3lEN0qQAVCJXxOT";

async function getAccessToken() {
  try {
    const message = document.getElementById("message");
    message.textContent = "Please wait. Getting flight information...";
    message.style.color = "#007bff";
    message.style.display = "block";

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

    // Safely check if data exists and is an array
    const offers = Array.isArray(flightResponse.data?.data)
      ? flightResponse.data.data
      : [];

    if (offers.length === 0) {
      const message = document.getElementById("message");
      message.textContent = "Sorry, there is no flight available.";
      message.style.color = "#fe2400";
      message.style.display = "block";
    } else {
      document.getElementById("message").style.display = "none";

      // Dynamically load card.js if offers are available
      const script = document.createElement("script");
      script.src = "card.js";
      document.body.appendChild(script);
    }

    window.flightResponse = flightResponse.data;
    return flightResponse.data; // Store response data here
  } catch (error) {
    console.error(
      "Error fetching flight offers:",
      error.response ? error.response.data : error.message
    );
    const message = document.getElementById("message");
    message.textContent =
      "There was an error getting flight information. Invalid flight query. Please try again with other combination.";
    message.style.color = "#fe2400";
    message.style.display = "block";
    const errorDetails = flightData.errors
      .map((error) => `${error.title}: ${error.detail}`)
      .join(", ");
    console.error("Detailed error:", errorDetails);
    throw new Error(errorDetails);
  }
}

flightOffer = async function main() {
  const accessToken = await getAccessToken();
  if (accessToken) {
    const flightData = await getFlightOffers(accessToken); // Renamed to flightData
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
      const totalPrice = flight.price.grandTotal;
      const priceCurrency = flight.price.currency;
      const flightDuration = flight.itineraries[0].duration;
      const segments = flight.itineraries[0].segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      const airlineName = flightDictionaries.carriers[firstSegment.carrierCode];
      const availableSits = flight.numberOfBookableSeats;

      /*       // Calculate total duration for all segments
      const totalDuration = segments.reduce((acc, segment) => {
        const duration = segment.duration;
        const hours = parseInt(duration.match(/PT(\d+)H/)?.[1] || 0);
        const minutes = parseInt(duration.match(/(\d+)M/)?.[1] || 0);
        return acc + hours * 60 + minutes;
      }, 0);
      const flightDuration = `PT${Math.floor(totalDuration / 60)}H${
        totalDuration % 60
      }M`; */

      // Calculate stops information
      const stopsLocationExtract = segments
        .slice(0, -1)
        .map((seg) => seg.arrival.iataCode);
      const stopsLocation =
        segments.length === 1
          ? "Non Stop"
          : `${stopsLocationExtract.length} Stop${
              stopsLocationExtract.length > 1 ? "s" : ""
            } via ${stopsLocationExtract.join(", ")}`;

      // Generate flight segments HTML
      const generateFlightSegmentHTML = (segment, index) => {
        const carrierCode = segment.carrierCode;
        const airlineName = flightDictionaries.carriers[carrierCode];
        const aircraftCode = segment.aircraft.code;
        const aircraftName = flightDictionaries.aircraft[aircraftCode];
        const travelerPricings = flight.travelerPricings[0];
        const cabin = travelerPricings.fareDetailsBySegment[index].cabin;
        const cClass = travelerPricings.fareDetailsBySegment[index].class;

        return `
        <!-- Flight ${index + 1} -->
        <div class="flight-info">
          <img src="/api/placeholder/40/40" alt="Airlines Logo" style="width: 40px" />
          <div>
            <div class="flight-number">${airlineName} ${carrierCode} | ${
          segment.number
        }</div>
            <div class="flight-meta">Aircraft: ${aircraftName}</div>
            <div class="flight-meta">Operated by: ${airlineName}</div>
            <div class="flight-meta">Cabin(Class): ${cabin}(${cClass})</div>
            <div class="flight-meta">Available seats: ${availableSits}</div>
          </div>
        </div>

        <div class="grid">
          <div class="time-info">
            <span class="time">${formatTime(segment.departure.at)}</span>
            <span class="date">${formatDate(segment.departure.at)}</span>
            <span class="flight-meta">Terminal ${
              segment.departure.terminal
            }</span>
            <span class="flight-meta">${segment.departure.iataCode}</span>
            <span class="flight-meta">City, Country</span>
          </div>

          <div class="duration">
            <div class="duration-text">${formatDuration(segment.duration)}</div>
            <div class="path-line"></div>
          </div>

          <div class="time-info">
            <span class="time">${formatTime(segment.arrival.at)}</span>
            <span class="date">${formatDate(segment.arrival.at)}</span>
            <span class="flight-meta">Terminal ${
              segment.arrival.terminal ? segment.arrival.terminal : "N/A"
            }</span>
            <span class="flight-meta">${segment.arrival.iataCode}</span>
            <span class="flight-meta">City, Country</span>
          </div>

          <div class="baggage-info">
            <div class="baggage-column">
              <h4>Baggage</h4>
              <div class="baggage-detail">Adult</div>
              <div class="baggage-detail">Children</div>
              <div class="baggage-detail">Infant</div>
            </div>
            <div class="baggage-column">
              <h4>Check In</h4>
              <div class="baggage-detail">X Kg(s)</div>
              <div class="baggage-detail">X Kg(s)</div>
              <div class="baggage-detail">X Kg(s)</div>
            </div>
            <div class="baggage-column">
              <h4>Cabin</h4>
              <div class="baggage-detail">X Kg(s)</div>
              <div class="baggage-detail">X Kg(s)</div>
              <div class="baggage-detail">X Kg(s)</div>
            </div>
          </div>
        </div>`;
      };

      // Calculate transit durations between segments
      const calculateTransitDuration = (currentSegment, nextSegment) => {
        const arrivalTime = new Date(currentSegment.arrival.at);
        const departureTime = new Date(nextSegment.departure.at);
        const diffMinutes = Math.floor(
          (departureTime - arrivalTime) / (1000 * 60)
        );
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `${hours}h ${minutes}m`;
      };

      // Generate flight segments with transit information
      const generateAllFlightSegmentsHTML = () => {
        let html = "";
        segments.forEach((segment, index) => {
          html += generateFlightSegmentHTML(segment, index);

          // Add transit information if there's a next segment
          if (index < segments.length - 1) {
            const transitDuration = calculateTransitDuration(
              segment,
              segments[index + 1]
            );
            html += `<div class="layover">${transitDuration} Transit in ${segment.arrival.iataCode}</div>`;
          }
        });
        return html;
      };

      // Create card HTML
      const cardHTML = `
      <!-- Flight Booking Card -->
      <div class="card">
        <span class="flight-counter">Flight: ${i + 1}</span>
        <div class="card-header">
          <div class="grid">
            <div class="airline-info">
              <img src="/api/placeholder/120/40" alt="Airline Logo" class="airline-logo" />
              <span class="airline-name">${airlineName}</span>
              <span class="refund-status">Partially Refundable</span>
            </div>

            <div class="time-info">
              <span class="description">Depart</span>
              <span class="time">${formatTime(firstSegment.departure.at)}</span>
              <span class="date">${formatDate(firstSegment.departure.at)}</span>
              <span class="airport">${firstSegment.departure.iataCode}</span>
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
              <span class="time">${formatTime(lastSegment.arrival.at)}</span>
              <span class="date">${formatDate(lastSegment.arrival.at)}</span>
              <span class="airport">${lastSegment.arrival.iataCode}</span>
            </div>

            <div class="price">
              <span class="description">Price</span>
              <span class="price">${priceCurrency} ${totalPrice}</span>
            </div>

            <div class="book-details">
              <button class="book-button">Book Now</button>
              <button class="details-button">
                Flight Details
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="details-section" style="display: none">
          <div class="tabs">
            <button class="tab active" data-tab="flight">Flight Details</button>
            <button class="tab" data-tab="fare">Fare Summary</button>
            <button class="tab" data-tab="rules">Fare Rules</button>
          </div>

          <div id="flightDetails" class="tab-content active">
            <h3 class="flight-details-header">
              ${firstSegment.departure.iataCode} to ${
        lastSegment.arrival.iataCode
      } on ${formatDate(firstSegment.departure.at)}
            </h3>

            ${generateAllFlightSegmentsHTML()}

            <!-- Other tabs -->
            <div id="fareSummary" class="tab-content"></div>
            <div id="fareRules" class="tab-content"></div>
          </div>
        </div>
      </div>`;

      // Add the card to the container
      bookingCardsContainer.insertAdjacentHTML("beforeend", cardHTML);
    }
    // Show all cards after data is loaded
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => (card.style.display = "block"));
  }
}
