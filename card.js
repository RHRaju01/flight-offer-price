"use strict";

document.querySelectorAll(".details-section").forEach((detailsSection) => {
  const detailsButton =
    detailsSection.previousElementSibling.querySelector(".details-button");
  const tabs = detailsSection.querySelectorAll(".tab");
  const tabContents = detailsSection.querySelectorAll(".tab-content");

  // Function to update the arrow icon
  const updateArrowIcon = (isExpanded) => {
    const svg = detailsButton.querySelector("svg");
    svg.style.transform = isExpanded ? "rotate(180deg)" : "rotate(0deg)";
  };

  // Function to show specific tab content
  const showTabContent = (tabId) => {
    // Remove active class from all tabs and contents
    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    // Map tab IDs to content IDs based on HTML structure
    const contentIdMap = {
      flight: "flightDetails",
      fare: "fareSummary",
      rules: "fareRules",
    };

    const contentId = contentIdMap[tabId];
    const selectedTab = detailsSection.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = detailsSection.querySelector(`#${contentId}`);

    if (selectedTab && selectedContent) {
      selectedTab.classList.add("active");
      selectedContent.classList.add("active");
    }
  };

  // Handle details button toggle (expand/collapse)
  detailsButton.addEventListener("click", () => {
    const isExpanded = detailsSection.style.display !== "none";
    detailsSection.style.display = isExpanded ? "none" : "block";
    updateArrowIcon(!isExpanded);

    // If expanding, ensure flight details tab is shown by default
    if (!isExpanded) {
      showTabContent("flight");
    }
  });

  // Handle tab clicks
  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent any default behavior
      const tabId = tab.dataset.tab;
      showTabContent(tabId);
      // Keep the details section expanded
      detailsSection.style.display = "block";
      updateArrowIcon(true);
    });
  });

  // Initialize the default state for each details section
  detailsSection.style.display = "none";
  updateArrowIcon(false);
  showTabContent("flight");
});
