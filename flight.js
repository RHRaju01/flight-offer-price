"use strict";

export let flightOffer;

import { searchData, fromLocation, toLocation } from "./script.js";

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
      const segments = flight.itineraries[0].segments;

      const segmentsArrival = flight.itineraries[0].segments;
      const arrivalTime =
        segmentsArrival[segmentsArrival.length - 1].arrival.at;
      const arrivalDate =
        segmentsArrival[segmentsArrival.length - 1].arrival.at;
      const flightDuration = flight.itineraries[0].duration;
      const numOfStops = flight.itineraries[0].segments.length;
      const aircraftCode = segments[0].aircraft.code;
      const aircraftName = flightDictionaries.aircraft[aircraftCode];
      const travelerPricings = flight.travelerPricings[0];
      const cabin = travelerPricings.fareDetailsBySegment[0].cabin;
      const cClass = travelerPricings.fareDetailsBySegment[0].class;
      const availableSits = flight.numberOfBookableSeats;
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
        <!-- Flight Booking Card -->
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

        <div class="details-section" style="display: none">
          <div class="tabs">
            <button class="tab active" data-tab="flight">Flight Details</button>
            <button class="tab" data-tab="fare">Fare Summary</button>
            <button class="tab" data-tab="rules">Fare Rules</button>
          </div>

          <div id="flightDetails" class="tab-content active">
            <h3 class="flight-details-header">
              ${fromLocation.value.toUpperCase()} to ${toLocation.value.toUpperCase()} on ${formatDate(
        departureDate
      )}
            </h3>

            <!-- First Flight -->
            <div class="flight-info">
              <img
                src="/api/placeholder/40/40"
                alt="Airlines Logo"
                style="width: 40px"
              />
              <div>
                <div class="flight-number">${airlineName} ${
        segments[0].carrierCode
      } | ${segments[0].number}</div>
                <div class="flight-meta">Aircraft:  ${aircraftName}</div>
                <div class="flight-meta">Operated by: ${airlineName}</div>
                <div class="flight-meta">Cabin(Class): ${cabin}(${cClass})</div>
                <div class="flight-meta">Available seats: ${availableSits}</div>
              </div>
            </div>

            <div class="grid">
              <!-- Flight times and route info -->
              <div class="time-info">
                <span class="time">${formatTime(departureTime)}</span>
                <span class="date">${formatDate(departureDate)}</span>
                <span class="flight-meta">Terminal ${
                  segments[0].departure.terminal
                }</span>
                <span class="flight-meta">${
                  segments[0].departure.iataCode
                }</span>
                <span class="flight-meta">City, Country</span>
              </div>

              <div class="duration">
                <div class="duration-text">${formatDuration(
                  segments[0].duration
                )}</div>
                <div class="path-line"></div>
              </div>

              <div class="time-info">
                <span class="time">${formatTime(segments[0].arrival.at)}</span>
                <span class="date">${formatDate(segments[0].arrival.at)}</span>
                <span class="flight-meta">Terminal ${
                  segments[0].arrival.terminal
                    ? segments[0].arrival.terminal
                    : "N/A"
                }</span>
                <span class="flight-meta">${segments[0].arrival.iataCode}</span>
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
            </div>

            <div class="layover">${"Transit (if any) Duration in X airport"}</div>

            <!-- Second Flight -->
            <!-- Similar structure as first flight -->
            <div class="flight-info">
              <img
                src="/api/placeholder/40/40"
                alt="Airlines Logo"
                style="width: 40px"
              />
              <div>
                <div class="flight-number">Airlines Code | Number</div>
                <div class="flight-meta">Aircraft: X</div>
                <div class="flight-meta">Operated by: X</div>
                <div class="flight-meta">Cabin(Class): X(X)</div>
                <div class="flight-meta">Available seats: X</div>
              </div>
            </div>

            <div class="grid">
              <!-- Flight times and route info -->
              <div class="time-info">
                <span class="time">DepTime</span>
                <span class="date">DepDate</span>
                <span class="flight-meta">Terminal X</span>
                <span class="flight-meta">Airport</span>
                <span class="flight-meta">City, Country</span>
              </div>

              <div class="duration">
                <div class="duration-text">Flight Duration</div>
                <div class="path-line"></div>
              </div>

              <div class="time-info">
                <span class="time">ArrTime</span>
                <span class="date">ArrDate</span>
                <span class="flight-meta">Terminal X</span>
                <span class="flight-meta">Airport</span>
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
            </div>
          </div>

          <div id="fareSummary" class="tab-content">
          
            <div class="fare-breakdown">
              <h3>Fare breakdown (Not actual data)</h3>
              <table class="fare-table">
                <thead>
                  <tr>
                    <th>Fare Summary</th>
                    <th>Base Fare</th>
                    <th>Taxes + Fees</th>
                    <th>Per Passenger</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Adult</td>
                    <td>BDT 1,106,441</td>
                    <td>BDT 91,288</td>
                    <td>BDT (1,197,729 x 1)</td>
                    <td>BDT 1,197,729</td>
                  </tr>
                  <tr>
                    <td>Child</td>
                    <td>BDT 1,106,441</td>
                    <td>BDT 91,288</td>
                    <td>BDT (1,197,729 x 1)</td>
                    <td>BDT 1,197,729</td>
                  </tr>
                  <tr>
                    <td>Infant</td>
                    <td>BDT 211,001</td>
                    <td>BDT 19,147</td>
                    <td>BDT (230,148 x 1)</td>
                    <td>BDT 230,148</td>
                  </tr>
                  <tr>
                    <td>Total (3 Travelers)</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>BDT 2,625,606</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div id="fareRules" class="tab-content">
            <h3 class="flight-details-header">Fare Rules</h3>
            <p style="color: #6b7280">Fare rules content would go here...</p>
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
