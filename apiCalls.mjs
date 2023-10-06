import axios from "axios";
import { webflowRawToFlat } from "./common.mjs";
import convert from "xml-js";
import "dotenv/config";

export const webflowPostOrPatch = async (
	collectorId,
	dataInWebflowFormatArray
) => {
	const postedItems = [];
	let url = `https://api.webflow.com/v2/collections/${collectorId}/items`;
	let method = "post";
	for (let index = 0; index < dataInWebflowFormatArray.length; index++) {
		const fieldData = dataInWebflowFormatArray[index];
		if (!fieldData) continue;

		// if updating/patching an existing record, change the method and url
		if (fieldData.webflowId) {
			url += `/${fieldData.webflowId}`;
			method = "patch";
		}
		delete fieldData.webflowId;

		await axios({
			method,
			headers: {
				accept: "application/json",
				"content-type": "application/json",
				authorization: `Bearer ${process.env.WEBFLOW_V2_TOKEN}`,
			},
			url,
			data: JSON.stringify({ fieldData }),
		})
			.then((res) => postedItems.push(webflowRawToFlat(res.data)))
			.catch((err) => console.log({ err, err: err.code }));
	}
	return postedItems;
};

export const webflowQuery = async (collectorId) => {
	const response = [];
	await axios({
		method: "get",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			authorization: `Bearer ${process.env.WEBFLOW_V2_TOKEN}`,
		},
		url: `https://api.webflow.com/v2/collections/${collectorId}/items`,
	})
		.then((res) => {
			// pull out just the fields we need to compare
			for (const item of res.data?.items) {
				response.push(webflowRawToFlat(item));
			}
		})
		.catch((err) => console.log({ err }));
	return response;
};

export const webflowDelete = async (collectorId, itemId) => {
	await axios({
		method: "delete",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			authorization: `Bearer ${process.env.WEBFLOW_V2_TOKEN}`,
		},
		url: `https://api.webflow.com/v2/collections/${collectorId}/items/${itemId}`,
	})
		.then((res) => console.log("deleted item"))
		.catch((err) => console.log({ err }));
};

export const peak15Query = async (peak15EntityName) => {
	let response = {};
	await axios({
		method: "post",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		data: `token=${process.env.PEAK_TOKEN}`,
		url: `https://data.peak15systems.com/beacon/service.svc/get/sdt/entity/${peak15EntityName}`,
	})
		.then((result) => {
			const jsonData = convert.xml2js(result.data, {
				compact: true,
				spaces: 4,
			});
			response = jsonData.resultset;
		})
		.catch((error) => {
			console.log(`axios error: ${error}`);
			response`Error: ${error}`;
		});
	return response.result;
};
