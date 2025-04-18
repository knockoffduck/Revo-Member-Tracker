import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getErrorMessage = (
	error: unknown,
	defaultMessage: string = "Something went wrong"
) => {
	console.error(error);
	let errorMessage = defaultMessage;
	if (error instanceof Error && error.message.length < 100) {
		errorMessage = error.message;
	}
	return errorMessage;
};

// Convert ISO string to a localized hour (using browser's local timezone)
export const convertToLocalHour = (isoString: string): string => {
	const date = new Date(isoString);

	// Format the date to local timezone (browser's timezone)
	const localTimeFormatter = new Intl.DateTimeFormat("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false, // 24-hour format
	});

	return localTimeFormatter.format(date);
};

// Convert UTC date to local browser time
export function convertUTCToLocalTime(utcDate: Date): Date {
	// Get the UTC time in milliseconds
	const utcTime = utcDate.getTime();

	// Calculate the offset for the local timezone
	const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

	// Adjust UTC time to local time
	const localDate = new Date(utcTime - timezoneOffset);

	return localDate;
}
