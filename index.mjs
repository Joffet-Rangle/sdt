import { webflowPostOrPatch, webflowQuery, peak15Query } from "./apiCalls.mjs";
import { peakItemsRequiringSync } from "./peakItemsRequiringSync.mjs";
import { peakArrayToWebflowArray } from "./peakArrayToWebflowArray.mjs";
import { getCollectionId, updateExistingWebflowTrips } from "./common.mjs";

export const handler = async (event, context) => {
	// TRIPS SYNC

	// get trips from Peak
	const peakTripDataArray = await peak15Query("p15_trips");

	// convert to array of flat objects with only the fields we care about
	const peakTripDataInWebflowFormatArray = peakArrayToWebflowArray(
		"trips",
		peakTripDataArray
	);

	// get existing webflow trips
	const existingWebflowTrips = await webflowQuery(getCollectionId("trips"));

	// compare peak trips to webflow trips to determine which are new and which are changed
	const tripsToSync = await peakItemsRequiringSync(
		"trips",
		existingWebflowTrips,
		peakTripDataInWebflowFormatArray
	);
	console.log({ tripsToSync });

	// copy a record of the posted trips for use in the departures sync
	let postedTrips = [];
	if (tripsToSync.length > 0) {
		postedTrips = await webflowPostOrPatch(
			getCollectionId("trips"),
			tripsToSync
		);
	}

	// DEPARTURES SYNC

	// get departures from Peak
	const peakDeparturesDataArray = await peak15Query("p15_tripdepartures");

	// combine the original query of existing trips with the returned value of trips updated. If some new ones were created, we need the assigned webflowIds in case we need to create new departures for those trips
	const updatedExistingWebflowTrips = updateExistingWebflowTrips(
		existingWebflowTrips,
		postedTrips
	);

	// convert to array of flat objects with only the fields we care about
	const peakDepartureDataInWebflowFormatArray = peakArrayToWebflowArray(
		"departures",
		peakDeparturesDataArray,
		updatedExistingWebflowTrips
	);

	// get existing webflow departures
	const existingWebflowDepartures = await webflowQuery(
		getCollectionId("departures")
	);
	const departuresToSync = await peakItemsRequiringSync(
		"departures",
		existingWebflowDepartures,
		peakDepartureDataInWebflowFormatArray
	);
	console.log({
		departuresToSync,
	});
	if (departuresToSync.length > 0)
		webflowPostOrPatch(getCollectionId("departures"), departuresToSync);
};

handler();
