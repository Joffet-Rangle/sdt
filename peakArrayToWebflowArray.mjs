import { createRequire } from "module";
const require = createRequire(import.meta.url);
const dataConversionDict = require("./dataConversionDict.json");

export const peakArrayToWebflowArray = (
	dataType,
	peakDataArray,
	existingWebflowTrips = null
) => {
	const specificDict = dataConversionDict[dataType.replace("Test", "")];
	if (!specificDict) return [];

	const newArray = [];
	for (let index = 0; index < peakDataArray.length; index++) {
		const peakItem = peakDataArray[index];
		// start new item with webflow required fields
		const newItem = {
			_archived: false,
			_draft: false,
		};

		// if departure item add the existing WebflowId
		if (dataType === "departures" && existingWebflowTrips) {
			const matchingTrip = existingWebflowTrips.find(
				(e) => e.tripidp15 === peakItem.p15_tripid._text
			);
			newItem.tripsid = matchingTrip?.webflowId;
		}

		// if departure and no webflow tripid is added (like if it's a new trip that hasn't been synced yet), then do not add the departure. It will get caught on the next sync
		if (dataType === "departures" && !newItem.tripsid) {
			continue;
		}

		// iterate through each key in the specific dictionary, adding the value to the newItem
		for (let index = 0; index < Object.keys(specificDict).length; index++) {
			const key = Object.keys(specificDict)[index];
			const keyConversionHash = specificDict[key];
			if (!keyConversionHash || !peakItem[key]) continue;
			let value = keyConversionHash.isAttributeName
				? peakItem[key]._attributes.name
				: peakItem[key]._text;
			if (keyConversionHash.isInteger) value = parseInt(value);
			newItem[keyConversionHash.webflowString] = value;
		}
		newArray.push(newItem);
	}
	return newArray;
};
