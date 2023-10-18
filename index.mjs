import { webflowPostOrPatch, webflowQuery, peak15Query } from "./apiCalls.mjs";
import { peakItemsRequiringSync } from "./peakItemsRequiringSync.mjs";
import { peakArrayToWebflowFormatArray } from "./peakArrayToWebflowFormatArray.mjs";
import { getCollectionId, updateExistingWebflowDepartures } from "./common.mjs";
import "dotenv/config";

export const handler = async (event, context) => {
	// DEPARTURES SYNC

	// get departures from Peak
	const peakDeparturesDataArray = await peak15Query("p15_tripdepartures");

	// convert to array of flat objects with only the fields we care about
	const peakDepartureDataInWebflowFormatArray = peakArrayToWebflowFormatArray(
		"departures",
		peakDeparturesDataArray
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

	// copy a record of the posted trips for use in the departures sync
	let postedDepartures = [];
	if (departuresToSync.length > 0) {
		postedDepartures = await webflowPostOrPatch(
			getCollectionId("departures"),
			departuresToSync
		);
	}

	// TRIPS SYNC

	// get trips from Peak
	const peakTripDataArray = await peak15Query("p15_trips");

	// combine the original query of existing departures with the returned value of departures updated.
	// If some new departures were created, we need the assigned webflowIds in case we need to create new trips for those departures
	const updatedExistingWebflowDepartures = updateExistingWebflowDepartures(
		existingWebflowDepartures,
		postedDepartures
	);

	// convert to array of flat objects with only the fields we care about
	const peakTripDataInWebflowFormatArray = peakArrayToWebflowFormatArray(
		"trips",
		peakTripDataArray,
		updatedExistingWebflowDepartures
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
	if (tripsToSync.length > 0)
		webflowPostOrPatch(getCollectionId("trips"), tripsToSync);
};

if (process.env.IS_LOCAL_MACHINE) handler();
