export const webflowRawToFlat = (item) => {
	// pull out just the fields we need to compare
	const flattenedItem = {
		webflowId: item.id,
	};
	for (const key of Object.keys(item.fieldData)) {
		// each key within "fieldData" child object
		if (key !== "slug") flattenedItem[key] = item.fieldData[key];
	}
	return flattenedItem;
};

export const updateExistingWebflowDepartures = (
	oldExistingWebflowDepartures,
	justAddedDepartures
) => {
	const addedDepartureIdsArray = justAddedDepartures.map(
		(e) => e.tripdeparturesid
	);
	// filter out Departures in the old array that also exist in the new
	const returnArray = oldExistingWebflowDepartures.filter(
		(e) => !addedDepartureIdsArray.includes(e.tripdeparturesid)
	);
	returnArray.concat(justAddedDepartures);
	return returnArray;
};

export const hasValue = (e) => {
	return (e !== undefined) & (e !== null);
};

export const getCollectionId = (name) => {
	const dict = {
		trips: "651c79765b896d4d4fd41c65",
		tripsTest: "651da4bf1fd06704dcd04dac",
		departures: "651da805ea8a38061b7afd8b",
		departuresTest: "651da817c5a3fe4d1b29159c",
	};
	return dict[name];
};
