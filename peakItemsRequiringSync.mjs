import { createRequire } from "module";
import { getCollectionId, hasValue } from "./common.mjs";
import { webflowDelete } from "./apiCalls.mjs";
const require = createRequire(import.meta.url);
const dict = require("./dataConversionDict.json");

export const peakItemsRequiringSync = async (
	dataType,
	webflowExistingItems,
	peakItems
) => {
	const peakItemsIdsArray = peakItems.map((e) => e.tripidp15);
	const requiringSyncArray = [];
	let matchingIdLabel = "tripidp15";
	if (dataType === "departures") matchingIdLabel = "tripdeparturesid";

	// if an item exists in Webflow, but not in Peak15, then delete it
	for (let index = 0; index < webflowExistingItems.length; index++) {
		const webflowItem = webflowExistingItems[index];
		if (!peakItemsIdsArray.includes(webflowItem.tripidp15)) {
			// delete item from webflow
			console.log("here");
			webflowDelete(getCollectionId(dataType), webflowItem.webflowId);
		}
	}

	for (let index = 0; index < peakItems.length; index++) {
		const peakObject = peakItems[index];

		// change the matching parameter, depending on the datatype
		const webflowObject = webflowExistingItems.find(
			(e) => e[matchingIdLabel] === peakObject[matchingIdLabel]
		);

		if (!webflowObject) {
			console.log("no webflowObject");
			requiringSyncArray.push(peakObject);
		} else {
			peakObject.webflowId = webflowObject.webflowId;
			const specificDict = dict[dataType];
			const webflowFieldNamesArray = Object.values(specificDict).map(
				(e) => e.webflowString
			);

			const fieldNamesToIgnore = ["webflowId", "slug", "_archived", "_draft"];
			let updateThisItem = false;

			for (let index = 0; index < webflowFieldNamesArray.length; index++) {
				const fieldName = webflowFieldNamesArray[index];
				if (fieldNamesToIgnore.includes(fieldName)) continue;

				const peakValue = peakObject[fieldName];
				let webflowValue = webflowObject[fieldName];

				// webflow adds '.000Z' to the end of date fields, so remove that Z for comparison purposes
				if (
					typeof webflowValue === "string" &&
					webflowValue.slice(webflowValue.length - 5, webflowValue.length) ===
						".000Z"
				)
					webflowValue = webflowValue.slice(0, webflowValue.length - 5);

				if (hasValue(webflowValue) && !hasValue(peakValue)) {
					peakObject[fieldName] = null;
					updateThisItem = true;
				} else if (!hasValue(webflowValue) && hasValue(peakValue)) {
					updateThisItem = true;
				} else if (
					hasValue(webflowValue) &&
					hasValue(peakValue) &&
					webflowValue !== peakValue
				) {
					updateThisItem = true;
				}
			}
			if (updateThisItem) requiringSyncArray.push(peakObject);
		}
	}
	return requiringSyncArray;
};
